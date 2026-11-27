import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_URL, resolveSiteUrl, siteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("usa o padrão local quando a variável não existe", () => {
    expect(resolveSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
  });

  it("usa o padrão local quando a variável está vazia", () => {
    expect(resolveSiteUrl("   ")).toBe(DEFAULT_SITE_URL);
  });

  it("devolve a origem sem barra final nem caminho", () => {
    expect(resolveSiteUrl("https://exemplo.com.br/qualquer/caminho?x=1")).toBe("https://exemplo.com.br");
  });

  it("preserva a porta", () => {
    expect(resolveSiteUrl("http://localhost:4312/")).toBe("http://localhost:4312");
  });

  it("lança erro claro quando o valor não é uma URL", () => {
    expect(() => resolveSiteUrl("exemplo sem protocolo")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("recusa protocolo que não seja http ou https", () => {
    expect(() => resolveSiteUrl("javascript:alert(1)")).toThrow(/http/);
    expect(() => resolveSiteUrl("ftp://exemplo.com")).toThrow(/http/);
  });
});

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lê NEXT_PUBLIC_SITE_URL do ambiente", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.com.br/");

    expect(siteUrl()).toBe("https://exemplo.com.br");
  });

  it("cai no padrão local quando a variável não está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(siteUrl()).toBe(DEFAULT_SITE_URL);
  });
});
