/**
 * Atribuição de campanha: captura `utm_*` e click-ids na entrada, guarda na sessão
 * e devolve para quem precisa (campos ocultos do formulário, link do formulário externo).
 *
 * Um mecanismo só para o site inteiro (LESSONS L-REF-20). Regras:
 * - só entram chaves conhecidas, com valor limpo e curto (dado de URL é entrada externa);
 * - URL nova com campanha substitui a anterior inteira (não mistura duas campanhas);
 * - o valor fica em sessionStorage: some quando a aba fecha e nunca sai do navegador
 *   sozinho. Só viaja quando o visitante envia o formulário.
 */

import { isRecord, parseJson, stringEntries } from "./guards";
import { readStorage, writeStorage } from "./storage";
import type { KeyValueStorage } from "./storage";

export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"] as const;
export const ATTRIBUTION_STORAGE_KEY = "forja.attribution.v1";

/** Chave → valor, já validado. Chaves: `utm_*` e as de `CLICK_ID_KEYS`. */
export type Attribution = Readonly<Record<string, string>>;

export const EMPTY_ATTRIBUTION: Attribution = Object.freeze({});

const UTM_KEY_PATTERN = /^utm_[a-z0-9_]{1,32}$/;
const MAX_VALUE_LENGTH = 200;
const MAX_KEYS = 20;
/** Caracteres de controle (quebra de linha, tab, NUL): nunca fazem parte de um valor de campanha. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function isAttributionKey(key: string): boolean {
  return UTM_KEY_PATTERN.test(key) || (CLICK_ID_KEYS as readonly string[]).includes(key);
}

function cleanValue(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, MAX_VALUE_LENGTH);
}

/** Filtra pares chave/valor de origem não confiável e devolve um objeto congelado, com chaves em ordem. */
export function sanitizeAttribution(entries: Iterable<readonly [string, string]>): Attribution {
  const accepted = new Map<string, string>();
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.toLowerCase();
    const value = cleanValue(rawValue);
    if (isAttributionKey(key) && value !== "" && !accepted.has(key) && accepted.size < MAX_KEYS) {
      accepted.set(key, value);
    }
  }
  return Object.freeze(Object.fromEntries([...accepted].sort(([a], [b]) => a.localeCompare(b))));
}

/** Extrai a atribuição de uma query string (`?utm_source=...` ou `URLSearchParams`). */
export function parseAttribution(search: string | URLSearchParams): Attribution {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  return sanitizeAttribution(params.entries());
}

export function hasAttribution(attribution: Attribution): boolean {
  return Object.keys(attribution).length > 0;
}

/** Lê a atribuição guardada na sessão. Valor ausente ou corrompido devolve vazio. */
export function readStoredAttribution(storage: KeyValueStorage | null): Attribution {
  const raw = readStorage(storage, ATTRIBUTION_STORAGE_KEY);
  const json = raw === null ? undefined : parseJson(raw);
  // O storage pode ter sido adulterado: o valor passa pelo mesmo filtro da URL.
  return isRecord(json) ? sanitizeAttribution(stringEntries(json)) : EMPTY_ATTRIBUTION;
}

export interface CaptureAttributionInput {
  /** `window.location.search` da página de entrada. */
  readonly search: string;
  readonly storage: KeyValueStorage | null;
}

/**
 * Chame uma vez por carga de página. Se a URL traz campanha, ela substitui a guardada;
 * se não traz, vale a que já estava na sessão (navegação interna).
 */
export function captureAttribution(input: CaptureAttributionInput): Attribution {
  const incoming = parseAttribution(input.search);
  if (!hasAttribution(incoming)) {
    return readStoredAttribution(input.storage);
  }
  writeStorage(input.storage, ATTRIBUTION_STORAGE_KEY, JSON.stringify(incoming));
  return incoming;
}

export interface DecorateUrlOptions {
  /** Base para resolver `href` relativo (em geral `window.location.href`). */
  readonly base: string;
  /** Hosts que podem receber os parâmetros. Fora da lista o link volta intacto. */
  readonly allowedHosts: readonly string[];
}

/**
 * Acrescenta a atribuição a um link de conversão. Não sobrescreve parâmetro que o link
 * já traz e não toca em link para host fora de `allowedHosts` (nada de vazar campanha
 * para terceiros). `href` inválido volta como veio.
 */
export function decorateUrl(href: string, attribution: Attribution, options: DecorateUrlOptions): string {
  if (!hasAttribution(attribution) || !URL.canParse(href, options.base)) {
    return href;
  }
  const url = new URL(href, options.base);
  const isHttp = url.protocol === "https:" || url.protocol === "http:";
  if (!isHttp || !options.allowedHosts.includes(url.hostname)) {
    return href;
  }
  for (const [key, value] of Object.entries(attribution)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export interface AttributionField {
  readonly name: string;
  readonly value: string;
}

/** Pares prontos para virar `<input type="hidden">` no formulário nativo. */
export function attributionFields(attribution: Attribution): readonly AttributionField[] {
  return Object.entries(attribution).map(([name, value]) => ({ name, value }));
}
