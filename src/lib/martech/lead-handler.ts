/**
 * Recebimento do lead no servidor, como função pura sobre `Request`/`Response`.
 * A rota (`app/api/leads/route.ts`) só liga as dependências.
 *
 * Ordem das defesas: mesma origem → limite de requisições → tamanho e formato →
 * campo-isca → validação → entrega. Nenhum dado pessoal vai para log.
 *
 * Sucesso: `200 { success: true, data: { accepted }, traceId }`. `accepted: false`
 * quer dizer "recebido e descartado" (campo-isca): o navegador não conta conversão.
 * Erro: sempre RFC 7807 (`application/problem+json`) com `traceId`.
 * Envio sem JavaScript (form urlencoded) recebe redirect 303 em vez de JSON.
 */

import { isEventId } from "./event-id";
import { isHoneypotTripped, validateLead } from "./lead";
import type { LeadLogEntry } from "./lead-storage";
import { PROBLEM_CONTENT_TYPE, buildProblem, resolveTraceId } from "./problem";
import type { ProblemSlug } from "./problem";
import type { Lead, LeadErrors } from "./lead";
import type { RateLimiter } from "./rate-limit";
import { sanitizeAttribution } from "./utm";
import type { Attribution } from "./utm";

export interface LeadDelivery {
  readonly lead: Lead;
  readonly attribution: Attribution;
  /** Mesmo `event_id` do evento de conversão do navegador, para deduplicar no servidor. */
  readonly eventId: string | null;
  /** Correlaciona o registro gravado com a resposta e o log. */
  readonly traceId: string;
  readonly receivedAt: string;
}

export type DeliverLead = (delivery: LeadDelivery) => Promise<void>;

export interface LeadHandlerOptions {
  /** `null`: destino não configurado, a rota responde 503 em vez de fingir que guardou. */
  readonly deliver: DeliverLead | null;
  readonly limiter: RateLimiter;
  /** Para onde vai o envio sem JavaScript quando dá certo. */
  readonly successPath: string;
  /** Para onde volta o envio sem JavaScript quando falha (âncora do aviso de erro). */
  readonly failurePath: string;
  readonly now?: () => Date;
  readonly generateTraceId?: () => string;
  /** Log estruturado. Recebe só metadados (o tipo não aceita dado pessoal). */
  readonly log?: (entry: LeadLogEntry) => void;
}

export interface LeadSuccessBody {
  readonly success: true;
  readonly data: { readonly accepted: boolean };
  readonly traceId: string;
}

export const MAX_LEAD_BODY_BYTES = 16_384;
const INSTANCE = "/api/leads";

const STATUS = {
  ok: 200,
  seeOther: 303,
  badRequest: 400,
  forbidden: 403,
  tooLarge: 413,
  unsupported: 415,
  unprocessable: 422,
  tooMany: 429,
  badGateway: 502,
  unavailable: 503,
} as const;

interface Rejection {
  readonly kind: "rejected";
  readonly slug: ProblemSlug;
  readonly status: number;
  readonly detail: string;
  readonly fieldErrors?: LeadErrors;
  readonly retryAfter?: number;
}

type Outcome = { readonly kind: "accepted"; readonly lead: Lead; readonly hasAttribution: boolean } | { readonly kind: "discarded" } | Rejection;

type PayloadFormat = "json" | "form";

const NO_STORE = { "cache-control": "no-store" } as const;

/** Origem canônica do site (`NEXT_PUBLIC_SITE_URL`), ou `null` se ausente/inválida. */
function configuredSiteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  return raw !== "" && URL.canParse(raw) ? new URL(raw).origin : null;
}

/**
 * O pedido veio de uma página do próprio site? Defesa contra envio forjado (CSRF).
 * Com `NEXT_PUBLIC_SITE_URL` configurada, o `Origin` precisa bater com ela: cabeçalhos
 * de host (`X-Forwarded-Host`) são controláveis pelo cliente e não decidem nada.
 * Sem a variável (dev local), cai na comparação com o host do pedido.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) {
    return request.headers.get("sec-fetch-site") === "same-origin";
  }
  if (!URL.canParse(origin)) {
    return false;
  }
  const siteOrigin = configuredSiteOrigin();
  if (siteOrigin !== null) {
    return new URL(origin).origin === siteOrigin;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  return new URL(origin).host === host;
}

/**
 * Chave do limite. `x-real-ip` é escrito pelo proxy da plataforma (sobrescreve o do
 * cliente); sem ele, vale o último salto de `x-forwarded-for`, que é o anexado pelo
 * proxy confiável. O primeiro salto é forjável pelo cliente e nunca é usado.
 */
export function clientKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim() ?? "";
  if (realIp !== "") {
    return realIp;
  }
  const hops = (request.headers.get("x-forwarded-for") ?? "").split(",").map((hop) => hop.trim()).filter((hop) => hop !== "");
  return hops.at(-1) ?? "desconhecido";
}

function payloadFormat(request: Request): PayloadFormat | null {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.startsWith("application/json")) {
    return "json";
  }
  return contentType.startsWith("application/x-www-form-urlencoded") ? "form" : null;
}

function toStringRecord(entries: Iterable<readonly [string, unknown]>): Readonly<Record<string, string>> {
  const pairs = [...entries].filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return Object.fromEntries(pairs);
}

function concatChunks(chunks: readonly Uint8Array[], totalBytes: number): Uint8Array {
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Lê o corpo como texto respeitando o teto byte a byte no stream: aborta assim que
 * cruza `MAX_LEAD_BODY_BYTES`, sem bufferizar o resto. `null` se passou do teto.
 */
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_LEAD_BODY_BYTES) {
    return null;
  }
  if (request.body === null) {
    return "";
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalBytes += value.byteLength;
      if (totalBytes > MAX_LEAD_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(concatChunks(chunks, totalBytes));
}

function parsePayload(text: string, format: PayloadFormat): Readonly<Record<string, string>> | null {
  if (format === "form") {
    return toStringRecord(new URLSearchParams(text).entries());
  }
  try {
    const parsed: unknown = JSON.parse(text);
    const isRecord = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
    return isRecord ? toStringRecord(Object.entries(parsed)) : null;
  } catch {
    // JSON malformado: tratado como pedido inválido (400) por quem chama.
    return null;
  }
}

function reject(slug: ProblemSlug, status: number, detail: string, extra: Partial<Pick<Rejection, "fieldErrors" | "retryAfter">> = {}): Rejection {
  return { kind: "rejected", slug, status, detail, ...extra };
}

async function deliverLead(payload: Readonly<Record<string, string>>, lead: Lead, traceId: string, options: LeadHandlerOptions): Promise<Outcome> {
  if (options.deliver === null) {
    return reject("storage-unavailable", STATUS.unavailable, "O recebimento de contatos não está configurado neste ambiente.");
  }
  const now = options.now ?? (() => new Date());
  const attribution = sanitizeAttribution(Object.entries(payload));
  try {
    await options.deliver({
      lead,
      attribution,
      eventId: isEventId(payload.event_id) ? payload.event_id : null,
      traceId,
      receivedAt: now().toISOString(),
    });
    return { kind: "accepted", lead, hasAttribution: Object.keys(attribution).length > 0 };
  } catch {
    // O erro em si pode conter dados do destino: não vai para a resposta nem para o log.
    return reject("delivery-failed", STATUS.badGateway, "Não foi possível registrar seu contato agora. Tente de novo em instantes.");
  }
}

async function decide(request: Request, format: PayloadFormat | null, traceId: string, options: LeadHandlerOptions): Promise<Outcome> {
  if (!isSameOrigin(request)) {
    return reject("forbidden-origin", STATUS.forbidden, "Este formulário só aceita envios do próprio site.");
  }
  const limit = options.limiter.check(clientKey(request));
  if (!limit.isAllowed) {
    return reject("rate-limited", STATUS.tooMany, "Muitas tentativas. Aguarde um pouco e envie de novo.", { retryAfter: limit.retryAfterSeconds });
  }
  if (format === null) {
    return reject("unsupported-media-type", STATUS.unsupported, "Envie em application/json ou application/x-www-form-urlencoded.");
  }
  const body = await readBody(request);
  if (body === null) {
    return reject("payload-too-large", STATUS.tooLarge, `O envio passa de ${MAX_LEAD_BODY_BYTES} bytes.`);
  }
  const payload = parsePayload(body, format);
  if (payload === null) {
    return reject("malformed-payload", STATUS.badRequest, "Não foi possível ler os dados enviados.");
  }
  if (isHoneypotTripped(payload)) {
    return { kind: "discarded" };
  }
  const validation = validateLead(payload);
  if (!validation.ok) {
    return reject("validation-error", STATUS.unprocessable, "Revise os campos destacados.", { fieldErrors: validation.errors });
  }
  return deliverLead(payload, validation.lead, traceId, options);
}

function problemResponse(outcome: Rejection, traceId: string): Response {
  const problem = buildProblem({
    slug: outcome.slug,
    status: outcome.status,
    detail: outcome.detail,
    instance: INSTANCE,
    traceId,
    errors: outcome.fieldErrors,
  });
  const retry: Readonly<Record<string, string>> = outcome.retryAfter === undefined ? {} : { "retry-after": String(outcome.retryAfter) };
  return new Response(JSON.stringify(problem), {
    status: outcome.status,
    headers: { "content-type": PROBLEM_CONTENT_TYPE, "x-trace-id": traceId, ...NO_STORE, ...retry },
  });
}

function respond(format: PayloadFormat | null, outcome: Outcome, traceId: string, options: LeadHandlerOptions): Response {
  if (format === "form") {
    const location = outcome.kind === "rejected" ? options.failurePath : options.successPath;
    return new Response(null, { status: STATUS.seeOther, headers: { location, "x-trace-id": traceId, ...NO_STORE } });
  }
  if (outcome.kind === "rejected") {
    return problemResponse(outcome, traceId);
  }
  const body: LeadSuccessBody = { success: true, data: { accepted: outcome.kind === "accepted" }, traceId };
  return new Response(JSON.stringify(body), {
    status: STATUS.ok,
    headers: { "content-type": "application/json; charset=utf-8", "x-trace-id": traceId, ...NO_STORE },
  });
}

function logOutcome(outcome: Outcome, traceId: string, options: LeadHandlerOptions): void {
  if (options.log === undefined) {
    return;
  }
  if (outcome.kind === "accepted") {
    options.log({ event: "lead.accepted", traceId, status: STATUS.ok, profile: outcome.lead.profile, hasAttribution: outcome.hasAttribution });
  } else if (outcome.kind === "discarded") {
    options.log({ event: "lead.discarded", traceId, status: STATUS.ok });
  } else {
    const event = outcome.slug === "delivery-failed" ? "lead.delivery_failed" : "lead.rejected";
    options.log({ event, traceId, status: outcome.status, problem: outcome.slug });
  }
}

export function createLeadHandler(options: LeadHandlerOptions): (request: Request) => Promise<Response> {
  return async (request) => {
    const traceId = resolveTraceId(request.headers, options.generateTraceId);
    const format = payloadFormat(request);
    const outcome = await decide(request, format, traceId, options);
    logOutcome(outcome, traceId, options);
    return respond(format, outcome, traceId, options);
  };
}

const WEBHOOK_TIMEOUT_MS = 8000;
const WEBHOOK_ENV = "LEAD_WEBHOOK_URL";
const LOCAL_HOSTS: readonly string[] = ["localhost", "127.0.0.1"];

/** URL do destino do lead (env só de servidor). `null` se ausente; erro se não for https. */
export function resolveLeadWebhookUrl(raw: string | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (value === "") {
    return null;
  }
  if (!URL.canParse(value)) {
    throw new Error(`${WEBHOOK_ENV} inválida. Use uma URL https completa.`);
  }
  const url = new URL(value);
  const isLocalHttp = url.protocol === "http:" && LOCAL_HOSTS.includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error(`${WEBHOOK_ENV} deve usar https.`);
  }
  return url.toString();
}

/** Entrega por webhook: POST JSON com prazo, sem seguir redirect. Resposta fora de 2xx é falha. */
export function createWebhookDelivery(url: string, fetchImpl: typeof fetch = fetch): DeliverLead {
  return async (delivery) => {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(delivery),
      // Redirecionamento poderia levar o lead (PII) para outro host: tratado como falha.
      redirect: "error",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Destino do lead respondeu ${response.status}.`);
    }
  };
}
