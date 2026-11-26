// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  MAX_LEAD_BODY_BYTES,
  clientKey,
  createLeadHandler,
  createWebhookDelivery,
  isSameOrigin,
  resolveLeadWebhookUrl,
} from "./lead-handler";
import type { DeliverLead, LeadDelivery, LeadHandlerOptions, LeadSuccessBody } from "./lead-handler";
import type { LeadLogEntry } from "./lead-storage";
import { PROBLEM_CONTENT_TYPE, problemType } from "./problem";
import type { ProblemDetails } from "./problem";
import { createRateLimiter } from "./rate-limit";

const ORIGIN = "https://site.example";
const ENDPOINT = `${ORIGIN}/api/leads`;
const NOW = new Date("2026-11-24T12:00:00.000Z");
const EVENT_ID = "3f2b8c1e-7a4d-4e9b-9c1a-5d6e7f8a9b0c";
const TRACE_ID = "trace-0001-abcdef";
const VALID = { name: "Ana Souza", email: "ana@empresa.com.br", profile: "Runway Signature", phone: "", company: "Empresa", message: "" } as const;

function options(overrides: Partial<LeadHandlerOptions> = {}): LeadHandlerOptions {
  return {
    deliver: vi.fn<DeliverLead>().mockResolvedValue(undefined),
    limiter: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    successPath: "/solicitar-acesso#envio-recebido",
    failurePath: "/solicitar-acesso#envio-nao-concluido",
    now: () => NOW,
    generateTraceId: () => TRACE_ID,
    ...overrides,
  };
}

function jsonRequest(body: unknown, headers: Readonly<Record<string, string>> = {}): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, host: "site.example", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function formRequest(fields: Readonly<Record<string, string>>): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: ORIGIN, host: "site.example" },
    body: new URLSearchParams(fields).toString(),
  });
}

async function successOf(response: Response): Promise<LeadSuccessBody> {
  return (await response.json()) as LeadSuccessBody;
}

/** Lê e confere o envelope RFC 7807 comum a todo erro da rota. */
async function problemOf(response: Response, status: number): Promise<ProblemDetails> {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
  expect(response.headers.get("x-trace-id")).toBe(TRACE_ID);
  const problem = (await response.json()) as ProblemDetails;
  expect(problem).toMatchObject({ status, instance: "/api/leads", traceId: TRACE_ID });
  expect(problem.type).toMatch(/^urn:mozy:problem:/);
  expect(problem.title).not.toBe("");
  expect(problem.detail).not.toBe("");
  return problem;
}

describe("createLeadHandler (JSON)", () => {
  it("entrega o lead válido com atribuição, event_id e data, e responde accepted", async () => {
    const deliver = vi.fn<DeliverLead>().mockResolvedValue(undefined);
    const handler = createLeadHandler(options({ deliver }));

    const response = await handler(jsonRequest({ ...VALID, event_id: EVENT_ID, utm_source: "google", gclid: "abc", extra: "ignorado" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-trace-id")).toBe(TRACE_ID);
    expect(await successOf(response)).toEqual({ success: true, data: { accepted: true }, traceId: TRACE_ID });
    expect(deliver).toHaveBeenCalledWith({
      lead: VALID,
      attribution: { gclid: "abc", utm_source: "google" },
      eventId: EVENT_ID,
      traceId: TRACE_ID,
      receivedAt: NOW.toISOString(),
    });
  });

  it("entrega eventId null quando o id recebido não é um UUID", async () => {
    const deliver = vi.fn<DeliverLead>().mockResolvedValue(undefined);

    await createLeadHandler(options({ deliver }))(jsonRequest({ ...VALID, event_id: "<script>" }));

    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ eventId: null }));
  });

  it("recusa pedido de outra origem com 403, antes de ler o corpo", async () => {
    const deliver = vi.fn<DeliverLead>();
    const handler = createLeadHandler(options({ deliver }));

    const response = await handler(jsonRequest(VALID, { origin: "https://atacante.example" }));

    const problem = await problemOf(response, 403);
    expect(problem.type).toBe(problemType("forbidden-origin"));
    expect(deliver).not.toHaveBeenCalled();
  });

  it("responde 429 com Retry-After quando o limite estoura", async () => {
    const handler = createLeadHandler(options({ limiter: createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 }) }));
    await handler(jsonRequest(VALID));

    const response = await handler(jsonRequest(VALID));

    expect(response.headers.get("retry-after")).toBe("60");
    expect((await problemOf(response, 429)).type).toBe(problemType("rate-limited"));
  });

  it("responde 415 para formato não suportado", async () => {
    const request = new Request(ENDPOINT, { method: "POST", headers: { "content-type": "text/plain", origin: ORIGIN, host: "site.example" }, body: "oi" });

    const problem = await problemOf(await createLeadHandler(options())(request), 415);
    expect(problem.type).toBe(problemType("unsupported-media-type"));
  });

  it("responde 413 para corpo acima do teto, declarado ou real", async () => {
    const handler = createLeadHandler(options());
    const huge = { ...VALID, message: "x".repeat(MAX_LEAD_BODY_BYTES) };

    const declared = await handler(jsonRequest(VALID, { "content-length": String(MAX_LEAD_BODY_BYTES + 1) }));
    const real = await handler(jsonRequest(huge));

    expect((await problemOf(declared, 413)).type).toBe(problemType("payload-too-large"));
    expect((await problemOf(real, 413)).type).toBe(problemType("payload-too-large"));
  });

  it.each(["{nao-e-json", "[1,2]", '"texto"', "null"])("responde 400 para corpo que não é um objeto JSON: %s", async (raw) => {
    const problem = await problemOf(await createLeadHandler(options())(jsonRequest(raw)), 400);
    expect(problem.type).toBe(problemType("malformed-payload"));
  });

  it("descarta em silêncio o envio que preencheu o campo-isca", async () => {
    const deliver = vi.fn<DeliverLead>();

    const response = await createLeadHandler(options({ deliver }))(jsonRequest({ ...VALID, website: "http://spam.example" }));

    expect(response.status).toBe(200);
    expect(await successOf(response)).toEqual({ success: true, data: { accepted: false }, traceId: TRACE_ID });
    expect(deliver).not.toHaveBeenCalled();
  });

  it("responde 422 com os erros por campo quando a validação falha", async () => {
    const response = await createLeadHandler(options())(jsonRequest({ name: "", email: "ana@" }));

    expect(await problemOf(response, 422)).toEqual({
      type: problemType("validation-error"),
      title: "Dados inválidos",
      status: 422,
      detail: "Revise os campos destacados.",
      instance: "/api/leads",
      traceId: TRACE_ID,
      errors: {
        name: "Informe seu nome, com pelo menos 2 letras.",
        email: "Informe um e-mail válido, como nome@empresa.com.br.",
        profile: "Escolha o perfil que melhor descreve seu interesse.",
      },
    });
  });

  it("responde 503 quando o destino do lead não está configurado", async () => {
    const response = await createLeadHandler(options({ deliver: null }))(jsonRequest(VALID));

    const problem = await problemOf(response, 503);
    expect(problem.type).toBe(problemType("storage-unavailable"));
    expect(problem.detail).toContain("não está configurado");
  });

  it("responde 502 e registra log estruturado quando a entrega falha, sem expor o lead", async () => {
    const failure = new Error(`timeout ao gravar ${VALID.email}`);
    const log = vi.fn<(entry: LeadLogEntry) => void>();
    const handler = createLeadHandler(options({ deliver: vi.fn<DeliverLead>().mockRejectedValue(failure), log }));

    const response = await handler(jsonRequest(VALID));

    const problem = await problemOf(response, 502);
    expect(problem.type).toBe(problemType("delivery-failed"));
    expect(log).toHaveBeenCalledWith({ event: "lead.delivery_failed", traceId: TRACE_ID, status: 502, problem: "delivery-failed" });
    expect(JSON.stringify(problem)).not.toContain(VALID.email);
    expect(JSON.stringify(log.mock.calls)).not.toContain(VALID.email);
  });

  it("registra só metadados no log do lead aceito e do descartado", async () => {
    const log = vi.fn<(entry: LeadLogEntry) => void>();
    const handler = createLeadHandler(options({ log }));

    await handler(jsonRequest({ ...VALID, utm_source: "google" }));
    await handler(jsonRequest({ ...VALID, website: "spam" }));
    await handler(jsonRequest({ name: "" }));

    expect(log.mock.calls.map(([entry]) => entry)).toEqual([
      { event: "lead.accepted", traceId: TRACE_ID, status: 200, profile: VALID.profile, hasAttribution: true },
      { event: "lead.discarded", traceId: TRACE_ID, status: 200 },
      { event: "lead.rejected", traceId: TRACE_ID, status: 422, problem: "validation-error" },
    ]);
    expect(JSON.stringify(log.mock.calls)).not.toContain(VALID.email);
  });

  it("reaproveita o trace-id do traceparent W3C recebido", async () => {
    const traceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

    const response = await createLeadHandler(options())(jsonRequest(VALID, { traceparent }));

    expect(response.headers.get("x-trace-id")).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect((await successOf(response)).traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("usa a data do sistema quando nenhum relógio é informado", async () => {
    const deliver = vi.fn<DeliverLead>().mockResolvedValue(undefined);
    const withoutClock: LeadHandlerOptions = {
      deliver,
      limiter: createRateLimiter({ limit: 100, windowMs: 60_000 }),
      successPath: "/solicitar-acesso#envio-recebido",
      failurePath: "/solicitar-acesso#envio-nao-concluido",
    };

    await createLeadHandler(withoutClock)(jsonRequest(VALID));

    expect(deliver.mock.calls[0]?.[0].receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("createLeadHandler (envio sem JavaScript)", () => {
  it("redireciona com 303 para a página de agradecimento quando dá certo", async () => {
    const deliver = vi.fn<DeliverLead>().mockResolvedValue(undefined);

    const response = await createLeadHandler(options({ deliver }))(formRequest({ ...VALID, utm_source: "google" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/solicitar-acesso#envio-recebido");
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ lead: VALID, attribution: { utm_source: "google" } }));
  });

  it("redireciona de volta ao formulário, na âncora do aviso, quando falha", async () => {
    const response = await createLeadHandler(options())(formRequest({ name: "", email: "x" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/solicitar-acesso#envio-nao-concluido");
  });

  it("manda o robô do campo-isca para o agradecimento sem entregar nada", async () => {
    const deliver = vi.fn<DeliverLead>();

    const response = await createLeadHandler(options({ deliver }))(formRequest({ ...VALID, website: "spam" }));

    expect(response.headers.get("location")).toBe("/solicitar-acesso#envio-recebido");
    expect(deliver).not.toHaveBeenCalled();
  });
});

describe("isSameOrigin", () => {
  const request = (headers: Readonly<Record<string, string>>): Request => new Request(ENDPOINT, { method: "POST", headers });

  it("aceita Origin igual ao host do pedido, inclusive atrás de proxy", () => {
    expect(isSameOrigin(request({ origin: ORIGIN, host: "site.example" }))).toBe(true);
    expect(isSameOrigin(request({ origin: ORIGIN, host: "interno:3000", "x-forwarded-host": "site.example" }))).toBe(true);
    expect(isSameOrigin(request({ origin: ORIGIN }))).toBe(true);
  });

  it("recusa Origin diferente, inválido ou nulo", () => {
    expect(isSameOrigin(request({ origin: "https://outro.example", host: "site.example" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "null", host: "site.example" }))).toBe(false);
  });

  it("sem Origin, só aceita quando o navegador declara same-origin", () => {
    expect(isSameOrigin(request({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOrigin(request({ "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOrigin(request({}))).toBe(false);
  });
});

describe("clientKey", () => {
  const request = (headers: Readonly<Record<string, string>>): Request => new Request(ENDPOINT, { headers });

  it("usa o primeiro IP de x-forwarded-for, depois x-real-ip, depois um valor fixo", () => {
    expect(clientKey(request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientKey(request({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientKey(request({}))).toBe("desconhecido");
  });
});

describe("resolveLeadWebhookUrl", () => {
  it("devolve null quando o destino não foi configurado", () => {
    expect(resolveLeadWebhookUrl(undefined)).toBeNull();
    expect(resolveLeadWebhookUrl("  ")).toBeNull();
  });

  it("aceita https e http só em localhost", () => {
    expect(resolveLeadWebhookUrl("https://hooks.example.com/lead")).toBe("https://hooks.example.com/lead");
    expect(resolveLeadWebhookUrl("http://localhost:8787/lead")).toBe("http://localhost:8787/lead");
  });

  it("recusa URL inválida ou http em host público", () => {
    expect(() => resolveLeadWebhookUrl("hooks.example.com")).toThrow("LEAD_WEBHOOK_URL inválida");
    expect(() => resolveLeadWebhookUrl("http://hooks.example.com/lead")).toThrow("deve usar https");
  });
});

describe("createWebhookDelivery", () => {
  const delivery: LeadDelivery = { lead: VALID, attribution: {}, eventId: EVENT_ID, traceId: TRACE_ID, receivedAt: NOW.toISOString() };

  it("envia o lead por POST JSON ao destino", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await createWebhookDelivery("https://hooks.example.com/lead", fetchImpl)(delivery);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://hooks.example.com/lead",
      expect.objectContaining({ method: "POST", body: JSON.stringify(delivery), headers: { "content-type": "application/json" } }),
    );
  });

  it("falha quando o destino responde fora de 2xx", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }));

    await expect(createWebhookDelivery("https://hooks.example.com/lead", fetchImpl)(delivery)).rejects.toThrow("respondeu 500");
  });
});
