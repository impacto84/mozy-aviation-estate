import { afterEach, describe, expect, it, vi } from "vitest";
import { isPlaceholderId, isTrackingId, readMartechEnv, resolveFormUrl, resolveMartechConfig, resolveTrackingId } from "./config";

/** ID de teste: formato válido, não é placeholder e não pertence a ninguém. */
const TEST_GTM_ID = ["GTM", "TESTE01"].join("-");

describe("isPlaceholderId", () => {
  it.each(["GTM-XXXXXXX", "G-XXXXXXXXXX", "000000000000000", "XXXXXXXXXXXXXXXXXXXX"])("reconhece o exemplo %s", (value) => {
    expect(isPlaceholderId(value)).toBe(true);
  });

  it("não confunde um ID preenchido com exemplo", () => {
    expect(isPlaceholderId(TEST_GTM_ID)).toBe(false);
  });
});

describe("resolveTrackingId", () => {
  it("devolve null para valor ausente, vazio ou placeholder", () => {
    expect(resolveTrackingId("gtm", undefined)).toBeNull();
    expect(resolveTrackingId("gtm", "  ")).toBeNull();
    expect(resolveTrackingId("gtm", "GTM-XXXXXXX")).toBeNull();
    expect(resolveTrackingId("metaPixel", "000000000000000")).toBeNull();
  });

  it("devolve o ID quando o formato está certo", () => {
    expect(resolveTrackingId("gtm", ` ${TEST_GTM_ID} `)).toBe(TEST_GTM_ID);
    expect(isTrackingId("gtm", TEST_GTM_ID)).toBe(true);
    expect(isTrackingId("ga4", ["G", "TESTE00001"].join("-"))).toBe(true);
    expect(isTrackingId("metaPixel", "123456789012345")).toBe(true);
    expect(isTrackingId("tiktokPixel", "C".repeat(20))).toBe(true);
  });

  it("derruba o build quando o valor preenchido está fora do formato", () => {
    expect(() => resolveTrackingId("gtm", "gtm-abc")).toThrow("NEXT_PUBLIC_GTM_ID inválido");
    expect(() => resolveTrackingId("ga4", "UA-1234-1")).toThrow("NEXT_PUBLIC_GA4_ID inválido");
  });
});

describe("resolveFormUrl", () => {
  it("devolve null quando não há formulário externo", () => {
    expect(resolveFormUrl(undefined)).toBeNull();
    expect(resolveFormUrl("")).toBeNull();
  });

  it("aceita só URL https completa", () => {
    expect(resolveFormUrl("https://example.com/formulario")).toBe("https://example.com/formulario");
    expect(() => resolveFormUrl("http://example.com/formulario")).toThrow("NEXT_PUBLIC_FORM_URL inválida");
    expect(() => resolveFormUrl("/formulario")).toThrow("NEXT_PUBLIC_FORM_URL inválida");
  });
});

describe("resolveMartechConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("monta a configuração a partir do env informado", () => {
    const config = resolveMartechConfig({ gtmId: TEST_GTM_ID, formUrl: "https://example.com/formulario" });

    expect(config).toEqual({ gtmId: TEST_GTM_ID, formUrl: "https://example.com/formulario" });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("lê as variáveis NEXT_PUBLIC_* do processo por padrão", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", TEST_GTM_ID);
    vi.stubEnv("NEXT_PUBLIC_FORM_URL", "https://example.com/formulario");

    expect(readMartechEnv()).toEqual({ gtmId: TEST_GTM_ID, formUrl: "https://example.com/formulario" });
    expect(resolveMartechConfig().gtmId).toBe(TEST_GTM_ID);
  });

  it("nunca carrega tag com o placeholder do .env.example", () => {
    expect(resolveMartechConfig({ gtmId: "GTM-XXXXXXX", formUrl: undefined })).toEqual({ gtmId: null, formUrl: null });
  });
});
