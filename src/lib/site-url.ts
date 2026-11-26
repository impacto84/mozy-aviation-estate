/**
 * URL pública do site, lida de NEXT_PUBLIC_SITE_URL e validada na borda.
 * Usada por metadata, sitemap e robots. Devolve só a origem, sem barra final.
 */

export const DEFAULT_SITE_URL = "http://localhost:4310";

const ALLOWED_PROTOCOLS: readonly string[] = ["http:", "https:"];

export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (value === "") {
    return DEFAULT_SITE_URL;
  }
  if (!URL.canParse(value)) {
    throw new Error(`NEXT_PUBLIC_SITE_URL inválida: "${value}". Use uma URL completa, ex.: https://exemplo.com.br`);
  }
  const url = new URL(value);
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`NEXT_PUBLIC_SITE_URL deve usar http ou https; recebido "${url.protocol}".`);
  }
  return url.origin;
}

/** Origem do site para o ambiente atual. */
export function siteUrl(): string {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
