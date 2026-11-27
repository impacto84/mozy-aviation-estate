/**
 * Erros HTTP no formato RFC 7807 (Problem Details), com `traceId` para correlacionar
 * resposta, log estruturado e suporte. Nunca carrega stack trace nem dado pessoal.
 */

export const PROBLEM_CONTENT_TYPE = "application/problem+json; charset=utf-8";

export type ProblemSlug =
  | "validation-error"
  | "forbidden-origin"
  | "rate-limited"
  | "unsupported-media-type"
  | "payload-too-large"
  | "malformed-payload"
  | "storage-unavailable"
  | "delivery-failed";

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly traceId: string;
  /** Extensão: erros por campo (só em `validation-error`). */
  readonly errors?: Readonly<Record<string, string>>;
}

const PROBLEM_TITLES: Readonly<Record<ProblemSlug, string>> = {
  "validation-error": "Dados inválidos",
  "forbidden-origin": "Origem não permitida",
  "rate-limited": "Muitas tentativas",
  "unsupported-media-type": "Formato não suportado",
  "payload-too-large": "Envio grande demais",
  "malformed-payload": "Envio ilegível",
  "storage-unavailable": "Recebimento indisponível",
  "delivery-failed": "Falha ao registrar",
};

/** URN estável por tipo de problema (RFC 7807 §3.1: `type` é uma referência URI). */
export function problemType(slug: ProblemSlug): string {
  return `urn:mozy:problem:${slug}`;
}

export interface ProblemInput {
  readonly slug: ProblemSlug;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly traceId: string;
  readonly errors?: Readonly<Record<string, string>>;
}

export function buildProblem(input: ProblemInput): ProblemDetails {
  const base: ProblemDetails = {
    type: problemType(input.slug),
    title: PROBLEM_TITLES[input.slug],
    status: input.status,
    detail: input.detail,
    instance: input.instance,
    traceId: input.traceId,
  };
  return input.errors === undefined ? base : { ...base, errors: input.errors };
}

const TRACE_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const TRACEPARENT_PATTERN = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/;

/**
 * `traceId` do pedido: o trace-id do `traceparent` (W3C), ou `x-request-id` se tiver
 * formato seguro; senão, um UUID novo. Valor externo é validado antes de ecoar.
 */
export function resolveTraceId(headers: Headers, generate: () => string = () => crypto.randomUUID()): string {
  const traceparent = headers.get("traceparent")?.trim().toLowerCase() ?? "";
  const fromTraceparent = TRACEPARENT_PATTERN.exec(traceparent)?.[1];
  if (fromTraceparent !== undefined) {
    return fromTraceparent;
  }
  const requestId = headers.get("x-request-id")?.trim() ?? "";
  return TRACE_ID_PATTERN.test(requestId) ? requestId : generate();
}
