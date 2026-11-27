import { describe, expect, it, vi } from "vitest";
import { HONEYPOT_FIELD, isHoneypotTripped, validateLead, validateLeadField } from "./lead";
import { formDataToPayload, submitLead } from "./lead-client";
import { createRateLimiter } from "./rate-limit";

const VALID = {
  name: "Ana Souza",
  email: "ana@empresa.com.br",
  profile: "Founder Estate",
  phone: "+1 754 271 6203",
  company: "Family Office",
  message: "Quero acesso ao Data Room.",
} as const;
const TRACE_ID = "trace-0001-abcdef";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("validateLead", () => {
  it("aceita o lead válido, apara espaços e normaliza o e-mail", () => {
    const result = validateLead({ ...VALID, name: "  Ana Souza ", email: " Ana@Empresa.com.BR " });

    expect(result).toEqual({ ok: true, lead: { ...VALID, name: "Ana Souza", email: "ana@empresa.com.br" } });
  });

  it("trata telefone, organização e mensagem como opcionais", () => {
    const result = validateLead({ name: "Ana", email: "ana@empresa.com.br", profile: "LP / Equity Partner" });

    expect(result).toEqual({
      ok: true,
      lead: { name: "Ana", email: "ana@empresa.com.br", profile: "LP / Equity Partner", phone: "", company: "", message: "" },
    });
  });

  it("exige um dos perfis do Data Room e recusa telefone malformado", () => {
    expect(validateLead({ ...VALID, profile: "Outro" })).toMatchObject({ ok: false, errors: { profile: "Escolha o perfil que melhor descreve seu interesse." } });
    expect(validateLead({ ...VALID, phone: "abc" })).toMatchObject({ ok: false, errors: { phone: "Informe um telefone válido, com DDI, como +1 754 271 6203." } });
  });

  it("devolve uma mensagem por campo quando falta nome e o e-mail é inválido", () => {
    const result = validateLead({ name: " ", email: "ana@" });

    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Informe seu nome, com pelo menos 2 letras.",
        email: "Informe um e-mail válido, como nome@empresa.com.br.",
        profile: "Escolha o perfil que melhor descreve seu interesse.",
      },
    });
  });

  it("pede o e-mail quando o campo veio vazio ou ausente", () => {
    expect(validateLead({ name: "Ana", email: "" })).toMatchObject({ ok: false, errors: { email: "Informe seu e-mail." } });
    expect(validateLead({ name: "Ana" })).toMatchObject({ ok: false, errors: { email: "Informe seu e-mail." } });
  });

  it("recusa texto acima do limite", () => {
    const result = validateLead({ ...VALID, message: "x".repeat(2001), company: "y".repeat(121) });

    expect(result).toMatchObject({ ok: false, errors: { message: "Use até 2000 caracteres na mensagem.", company: "Use até 120 caracteres no nome da organização." } });
  });

  it.each([null, undefined, "texto", 42, []])("recusa dado que não é um objeto de lead: %j", (raw) => {
    const result = validateLead(raw);

    expect(result.ok).toBe(false);
    expect(Object.keys(result.ok ? {} : result.errors).length).toBeGreaterThan(0);
  });

  it("ignora campos desconhecidos em vez de repassá-los", () => {
    const result = validateLead({ ...VALID, role: "admin" });

    expect(result.ok && Object.keys(result.lead)).toEqual(["name", "email", "profile", "phone", "company", "message"]);
  });
});

describe("validateLeadField", () => {
  it("valida um campo por vez, para o erro aparecer ao sair do campo", () => {
    expect(validateLeadField("email", "ana@empresa.com.br")).toBeNull();
    expect(validateLeadField("email", "ana")).toBe("Informe um e-mail válido, como nome@empresa.com.br.");
    expect(validateLeadField("name", "")).toBe("Informe seu nome, com pelo menos 2 letras.");
    expect(validateLeadField("company", "")).toBeNull();
  });
});

describe("isHoneypotTripped", () => {
  it("acusa o envio que preencheu o campo-isca", () => {
    expect(isHoneypotTripped({ ...VALID, [HONEYPOT_FIELD]: "http://spam.example" })).toBe(true);
  });

  it("deixa passar campo-isca vazio, ausente ou dado que não é objeto", () => {
    expect(isHoneypotTripped({ ...VALID, [HONEYPOT_FIELD]: "  " })).toBe(false);
    expect(isHoneypotTripped(VALID)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
    expect(isHoneypotTripped("texto")).toBe(false);
  });
});

describe("formDataToPayload", () => {
  it("transforma os campos de texto em objeto e ignora arquivo", () => {
    const data = new FormData();
    data.set("name", "Ana");
    data.set("utm_source", "google");
    data.set("anexo", new File(["x"], "a.txt"));

    expect(formDataToPayload(data)).toEqual({ name: "Ana", utm_source: "google" });
  });
});

describe("submitLead", () => {
  const input = { endpoint: "/api/leads", payload: VALID };

  it("envia JSON por POST e devolve accepted quando o servidor aceita", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { success: true, data: { accepted: true }, traceId: TRACE_ID }));

    const result = await submitLead({ ...input, fetchImpl });

    expect(result).toEqual({ status: "accepted" });
    expect(fetchImpl).toHaveBeenCalledWith("/api/leads", expect.objectContaining({ method: "POST", body: JSON.stringify(VALID) }));
  });

  it("trata 2xx sem corpo reconhecível como aceito (backend de terceiros)", async () => {
    const empty = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const other = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { ok: true }));

    expect(await submitLead({ ...input, fetchImpl: empty })).toEqual({ status: "accepted" });
    expect(await submitLead({ ...input, fetchImpl: other })).toEqual({ status: "accepted" });
  });

  it("devolve discarded quando o servidor recebeu e jogou fora (campo-isca)", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { success: true, data: { accepted: false }, traceId: TRACE_ID }));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "discarded" });
  });

  it("devolve os erros de campo do servidor em 422 (extensão `errors` do RFC 7807), só dos campos conhecidos", async () => {
    const body = { type: "urn:mozy:problem:validation-error", title: "Dados inválidos", status: 422, detail: "Revise.", traceId: TRACE_ID, errors: { email: "Informe um e-mail válido.", outro: "x" } };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(422, body));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "invalid", errors: { email: "Informe um e-mail válido." } });
  });

  it("devolve invalid sem campos quando o 422 veio sem detalhes", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("erro", { status: 422 }));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "invalid", errors: {} });
  });

  it.each([
    [429, "rate-limited"],
    [500, "server"],
    [503, "server"],
  ])("devolve failed para status %i", async (status, reason) => {
    const problem = { type: "urn:mozy:problem:x", title: "Erro", status, detail: "x", instance: "/api/leads", traceId: TRACE_ID };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(status, problem));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "failed", reason, traceId: TRACE_ID });
  });

  it("devolve traceId null quando o erro veio sem corpo RFC 7807", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("Bad Gateway", { status: 502 }));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "failed", reason: "server", traceId: null });
  });

  it("devolve failed por rede quando o fetch rejeita, sem lançar", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await submitLead({ ...input, fetchImpl })).toEqual({ status: "failed", reason: "network", traceId: null });
  });

  it("usa o fetch global quando nenhum é informado", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    expect(await submitLead(input)).toEqual({ status: "accepted" });
    spy.mockRestore();
  });
});

describe("createRateLimiter", () => {
  it("permite até o limite e bloqueia o excesso dentro da janela", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => time });

    const first = limiter.check("ip");
    const second = limiter.check("ip");
    time = 15_000;
    const third = limiter.check("ip");

    expect(first).toEqual({ isAllowed: true, retryAfterSeconds: 0 });
    expect(second.isAllowed).toBe(true);
    expect(third).toEqual({ isAllowed: false, retryAfterSeconds: 45 });
  });

  it("conta cada chave em separado e libera de novo quando a janela vira", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => time });
    limiter.check("a");

    expect(limiter.check("b").isAllowed).toBe(true);
    expect(limiter.check("a").isAllowed).toBe(false);
    time = 1000;
    expect(limiter.check("a").isAllowed).toBe(true);
  });

  it("descarta chaves vencidas quando chega ao teto de memória", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => time, maxKeys: 2 });
    limiter.check("a");
    limiter.check("b");
    time = 5000;

    expect(limiter.check("c").isAllowed).toBe(true);
    expect(limiter.check("a").isAllowed).toBe(true);
  });

  it("usa o relógio do sistema por padrão", () => {
    expect(createRateLimiter({ limit: 1, windowMs: 1000 }).check("a").isAllowed).toBe(true);
  });
});
