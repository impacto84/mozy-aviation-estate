/**
 * Envio do lead a partir do navegador. Devolve um resultado fechado, que o formulário
 * transforma em estado visível; nunca lança.
 *
 * Só `accepted` autoriza o evento de conversão. `discarded` é o servidor dizendo que
 * recebeu e jogou fora (campo-isca): a tela segue igual, mas nada é contado.
 */

import { isRecord, stringEntries } from "./guards";
import { LEAD_FIELDS } from "./lead";
import type { LeadErrors, LeadField } from "./lead";

export type LeadFailureReason = "network" | "rate-limited" | "server";

export type LeadSubmitResult =
  | { readonly status: "accepted" }
  | { readonly status: "discarded" }
  | { readonly status: "invalid"; readonly errors: LeadErrors }
  | { readonly status: "failed"; readonly reason: LeadFailureReason; readonly traceId: string | null };

export interface SubmitLeadInput {
  readonly endpoint: string;
  readonly payload: Readonly<Record<string, string>>;
  readonly fetchImpl?: typeof fetch;
}

const STATUS_UNPROCESSABLE = 422;
const STATUS_TOO_MANY = 429;

interface ResponseBody {
  /** `false` só quando o servidor disse, com todas as letras, que descartou o envio. */
  readonly isDiscarded: boolean;
  readonly fieldErrors: LeadErrors;
  /** `traceId` do servidor (sucesso ou RFC 7807), para o visitante citar ao suporte. */
  readonly traceId: string | null;
}

const EMPTY_BODY: ResponseBody = { isDiscarded: false, fieldErrors: {}, traceId: null };

function toLeadErrors(fieldErrors: unknown): LeadErrors {
  if (!isRecord(fieldErrors)) {
    return {};
  }
  const known = stringEntries(fieldErrors).filter((entry): entry is [LeadField, string] => (LEAD_FIELDS as readonly string[]).includes(entry[0]));
  return Object.fromEntries(known);
}

/** Só o que o cliente precisa da resposta; o resto do corpo é ignorado. */
async function readResponseBody(response: Response): Promise<ResponseBody> {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    // Corpo vazio ou que não é JSON: vale só o status HTTP.
    return EMPTY_BODY;
  }
  if (!isRecord(json)) {
    return EMPTY_BODY;
  }
  const isDiscarded = isRecord(json.data) && json.data.accepted === false;
  const traceId = typeof json.traceId === "string" ? json.traceId : null;
  // RFC 7807: erros por campo na extensão `errors`.
  return { isDiscarded, fieldErrors: toLeadErrors(json.errors), traceId };
}

/** Campos de texto do formulário como objeto simples (arquivos são ignorados). */
export function formDataToPayload(data: FormData): Readonly<Record<string, string>> {
  const pairs = [...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return Object.fromEntries(pairs);
}

export async function submitLead(input: SubmitLeadInput): Promise<LeadSubmitResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(input.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, application/problem+json" },
      body: JSON.stringify(input.payload),
    });
  } catch {
    // Sem rede ou pedido abortado: o formulário mostra o estado de erro com nova tentativa.
    return { status: "failed", reason: "network", traceId: null };
  }
  const body = await readResponseBody(response);
  if (response.ok) {
    return body.isDiscarded ? { status: "discarded" } : { status: "accepted" };
  }
  if (response.status === STATUS_UNPROCESSABLE) {
    return { status: "invalid", errors: body.fieldErrors };
  }
  return { status: "failed", reason: response.status === STATUS_TOO_MANY ? "rate-limited" : "server", traceId: body.traceId };
}
