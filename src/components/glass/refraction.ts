/**
 * Refração do vidro: quando ligar e com que números.
 *
 * A refração é um filtro SVG (ruído + mapa de deslocamento) referenciado dentro
 * do `backdrop-filter`. Hoje só o Chromium desenha `backdrop-filter: url(#…)`.
 * WebKit e Gecko aceitam a sintaxe e não desenham o filtro, então `CSS.supports`
 * sozinho responde "sim" onde o efeito não existe. Por isso a decisão junta duas
 * respostas: o CSS aceita a declaração e o motor se declara Chromium em
 * `navigator.userAgentData` (API que só o Chromium tem). Em qualquer outro caso
 * o vidro fica com blur, tinta, brilho e borda, sem refração.
 *
 * Módulo puro. O ambiente entra por parâmetro para a decisão ser testável.
 */

export type RefractionLevel = "none" | "soft" | "strong";

export const REFRACTION_LEVELS: readonly RefractionLevel[] = ["none", "soft", "strong"];

/** Atributos numéricos do filtro. Todos finitos e positivos (check `SVG-NAN`). */
export interface RefractionSpec {
  /** Deslocamento máximo, em px (`feDisplacementMap scale`). */
  readonly scale: number;
  /** Frequência do ruído em x e y. Quanto menor, mais largas as ondas. */
  readonly frequencyX: number;
  readonly frequencyY: number;
  readonly octaves: number;
  /** Desfoque do ruído antes de deslocar, para a onda não ter quina. */
  readonly softness: number;
  readonly seed: number;
}

export interface RefractionEnvironment {
  /** `CSS.supports(propriedade, valor)`. */
  readonly supports: (property: string, value: string) => boolean;
  /** Marcas de `navigator.userAgentData.brands`, ou `null` quando a API não existe. */
  readonly brands: readonly string[] | null;
}

/** A mesma forma de declaração que `Glass.module.css` usa quando a refração liga. */
export const REFRACTION_SUPPORT_PROBE = {
  property: "backdrop-filter",
  value: "url(#glass) blur(1px)",
} as const;

const CHROMIUM_BRAND = "Chromium";
const FILTER_ID_PREFIX = "glass-refraction-";
const UNSAFE_ID_CHARACTER = /[^A-Za-z0-9_-]/g;

const SPECS: Readonly<Record<Exclude<RefractionLevel, "none">, RefractionSpec>> = {
  soft: { scale: 18, frequencyX: 0.007, frequencyY: 0.011, octaves: 2, softness: 2, seed: 7 },
  strong: { scale: 42, frequencyX: 0.006, frequencyY: 0.009, octaves: 2, softness: 3, seed: 7 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readSupports(view: Record<string, unknown>): RefractionEnvironment["supports"] {
  const css = view.CSS;
  if (!isRecord(css) || typeof css.supports !== "function") {
    return () => false;
  }
  const supports = css.supports.bind(css) as (property: string, value: string) => unknown;
  return (property, value) => supports(property, value) === true;
}

function readBrands(view: Record<string, unknown>): readonly string[] | null {
  const navigator = view.navigator;
  const userAgentData = isRecord(navigator) ? navigator.userAgentData : undefined;
  const brands = isRecord(userAgentData) ? userAgentData.brands : undefined;
  if (!Array.isArray(brands)) {
    return null;
  }
  return brands.flatMap((entry: unknown) => (isRecord(entry) && typeof entry.brand === "string" ? [entry.brand] : []));
}

/**
 * Lê do `window` o que a decisão precisa. Recebe `unknown` porque
 * `navigator.userAgentData` não existe em todo navegador nem nos tipos do DOM.
 */
export function readRefractionEnvironment(view: unknown): RefractionEnvironment {
  if (!isRecord(view)) {
    return { supports: () => false, brands: null };
  }
  return { supports: readSupports(view), brands: readBrands(view) };
}

/** `true` só onde a refração é desenhada de fato. Na dúvida, `false`. */
export function supportsRefraction(environment: RefractionEnvironment): boolean {
  if (environment.brands === null || !environment.brands.includes(CHROMIUM_BRAND)) {
    return false;
  }
  try {
    return environment.supports(REFRACTION_SUPPORT_PROBE.property, REFRACTION_SUPPORT_PROBE.value);
  } catch {
    // Motor que lança ao consultar o CSS não é motor em que valha ligar o efeito.
    return false;
  }
}

/** Números do filtro para um nível, ou `null` quando não há refração. */
export function refractionSpec(level: RefractionLevel): RefractionSpec | null {
  return level === "none" ? null : SPECS[level];
}

/**
 * Id do `<filter>` de uma instância, a partir do `useId()` dela. Troca o que não
 * é letra, número, `_` ou `-`, para o id caber sem aspas em `url(#…)`.
 */
export function refractionFilterId(instanceId: string): string {
  return `${FILTER_ID_PREFIX}${instanceId.replace(UNSAFE_ID_CHARACTER, "_")}`;
}
