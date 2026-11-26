/**
 * Configuração de martech lida de env e validada na borda. Nenhum ID mora no código.
 *
 * - valor vazio ou placeholder de `.env.example` (`GTM-XXXXXXX`, zeros) vira `null`:
 *   placeholder nunca carrega tag;
 * - valor fora do formato derruba o build com mensagem clara, em vez de publicar
 *   uma tag que não mede nada.
 */

export type TrackingIdKind = "gtm" | "ga4" | "metaPixel" | "tiktokPixel";

interface TrackingIdRule {
  readonly envName: string;
  readonly pattern: RegExp;
  readonly example: string;
}

const TRACKING_ID_RULES: Readonly<Record<TrackingIdKind, TrackingIdRule>> = {
  gtm: { envName: "NEXT_PUBLIC_GTM_ID", pattern: /^GTM-[A-Z0-9]{4,12}$/, example: "GTM-XXXXXXX" },
  ga4: { envName: "NEXT_PUBLIC_GA4_ID", pattern: /^G-[A-Z0-9]{6,14}$/, example: "G-XXXXXXXXXX" },
  metaPixel: { envName: "NEXT_PUBLIC_META_PIXEL_ID", pattern: /^\d{10,20}$/, example: "000000000000000" },
  tiktokPixel: { envName: "NEXT_PUBLIC_TIKTOK_PIXEL_ID", pattern: /^[A-Z0-9]{16,24}$/, example: "XXXXXXXXXXXXXXXXXXXX" },
};

const PLACEHOLDER_BODY = /^[X0]+$/;
const ID_PREFIX = /^(GTM-|G-)/;

/** `GTM-XXXXXXX`, `G-XXXXXXXXXX` e `000000000000000` são exemplos, não IDs. */
export function isPlaceholderId(value: string): boolean {
  return PLACEHOLDER_BODY.test(value.replace(ID_PREFIX, ""));
}

export function isTrackingId(kind: TrackingIdKind, value: string): boolean {
  return TRACKING_ID_RULES[kind].pattern.test(value);
}

/** `null` para ausente ou placeholder; erro para valor preenchido fora do formato. */
export function resolveTrackingId(kind: TrackingIdKind, raw: string | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (value === "" || isPlaceholderId(value)) {
    return null;
  }
  const rule = TRACKING_ID_RULES[kind];
  if (!rule.pattern.test(value)) {
    throw new Error(`${rule.envName} inválido: "${value}". Formato esperado: ${rule.example}.`);
  }
  return value;
}

const FORM_URL_ENV = "NEXT_PUBLIC_FORM_URL";

/** URL única do formulário externo (LESSONS L-REF-21). Só https; `null` se ausente. */
export function resolveFormUrl(raw: string | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (value === "") {
    return null;
  }
  if (!URL.canParse(value) || new URL(value).protocol !== "https:") {
    throw new Error(`${FORM_URL_ENV} inválida: "${value}". Use uma URL https completa.`);
  }
  return new URL(value).toString();
}

export interface MartechConfig {
  readonly gtmId: string | null;
  readonly formUrl: string | null;
}

export interface MartechEnv {
  readonly gtmId: string | undefined;
  readonly formUrl: string | undefined;
}

/**
 * Leitura das variáveis públicas. Cada `process.env.NEXT_PUBLIC_*` aparece por extenso:
 * é assim que o Next consegue embutir o valor no bundle do cliente.
 */
export function readMartechEnv(): MartechEnv {
  return {
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
    formUrl: process.env.NEXT_PUBLIC_FORM_URL,
  };
}

export function resolveMartechConfig(env: MartechEnv = readMartechEnv()): MartechConfig {
  return Object.freeze({
    gtmId: resolveTrackingId("gtm", env.gtmId),
    formUrl: resolveFormUrl(env.formUrl),
  });
}
