/**
 * Conta de contraste do vidro: a prova de que a camada de tinta garante o texto.
 *
 * Atrás de um vidro pode passar qualquer coisa (foto, gradiente, vídeo, o que o
 * visitante rolar). O que segura a leitura é a tinta: uma camada da cor da
 * superfície, com alfa alto o bastante para que o pior fundo possível ainda
 * deixe o texto acima de 4,5:1. Blur, saturação e refração só embaralham o
 * fundo; nenhum deles tira o resultado da faixa entre preto e branco.
 *
 * Use ao trocar os tokens da marca ou o alfa da tinta:
 *
 *   minimumTintAlpha(texto, tinta)             // menor alfa que passa em AA
 *   worstCaseContrast(texto, [tinta, brilho])  // contraste no pior fundo
 *
 * As cores entram em sRGB codificado (o `rgb()` do CSS dividido por 255),
 * porque é nesse espaço que o navegador compõe camadas com alfa.
 * Módulo puro: sem DOM, serve em teste unitário e em teste de navegador.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Uma camada chapada do vidro: cor e opacidade. */
export interface GlassLayer {
  readonly color: Rgb;
  readonly alpha: number;
}

export interface MinimumTintOptions {
  /** Contraste exigido. O padrão é o AA de texto normal. */
  readonly target?: number;
  /** Camadas pintadas por cima da tinta e por baixo do texto (ex.: o brilho). */
  readonly layersAbove?: readonly GlassLayer[];
}

export const BLACK: Rgb = { r: 0, g: 0, b: 0 };
export const WHITE: Rgb = { r: 1, g: 1, b: 1 };
/** WCAG 1.4.3: texto normal. */
export const WCAG_AA_TEXT = 4.5;
/** WCAG 1.4.3: texto grande (24 px, ou 18,66 px em negrito). */
export const WCAG_AA_LARGE_TEXT = 3;

/** Constantes da função de transferência do sRGB e da fórmula de contraste do WCAG 2. */
const SRGB_LINEAR_LIMIT = 0.04045;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_OFFSET = 0.055;
const SRGB_GAMMA = 2.4;
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;
const CONTRAST_FLARE = 0.05;
const NO_CONTRAST = 1;
const ALPHA_STEPS = 100;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toLinear(channel: number): number {
  const encoded = clampUnit(channel);
  return encoded <= SRGB_LINEAR_LIMIT
    ? encoded / SRGB_LINEAR_DIVISOR
    : ((encoded + SRGB_OFFSET) / (1 + SRGB_OFFSET)) ** SRGB_GAMMA;
}

/** Luminância relativa do WCAG 2, de 0 (preto) a 1 (branco). */
export function relativeLuminance(color: Rgb): number {
  return LUMA_RED * toLinear(color.r) + LUMA_GREEN * toLinear(color.g) + LUMA_BLUE * toLinear(color.b);
}

function luminanceRatio(first: number, second: number): number {
  return (Math.max(first, second) + CONTRAST_FLARE) / (Math.min(first, second) + CONTRAST_FLARE);
}

/** Contraste do WCAG 2 entre duas cores opacas, de 1 a 21. */
export function contrastRatio(first: Rgb, second: Rgb): number {
  return luminanceRatio(relativeLuminance(first), relativeLuminance(second));
}

/** Compõe uma camada sobre um fundo opaco, como o navegador (source-over em sRGB). */
export function compositeOver(backdrop: Rgb, layer: GlassLayer): Rgb {
  const alpha = clampUnit(layer.alpha);
  const mix = (under: number, over: number): number => over * alpha + under * (1 - alpha);
  return {
    r: mix(backdrop.r, layer.color.r),
    g: mix(backdrop.g, layer.color.g),
    b: mix(backdrop.b, layer.color.b),
  };
}

/** Compõe as camadas em ordem, a primeira logo acima do fundo. */
export function flattenLayers(backdrop: Rgb, layers: readonly GlassLayer[]): Rgb {
  return layers.reduce(compositeOver, backdrop);
}

/**
 * Menor contraste que o texto pode ter sobre essas camadas, para qualquer fundo.
 *
 * O fundo atrás do vidro varia de preto a branco, então a superfície final varia
 * entre dois extremos de luminância. Se a luminância do texto cabe entre eles,
 * existe um fundo que apaga o texto e o resultado é 1.
 */
export function worstCaseContrast(text: Rgb, layers: readonly GlassLayer[]): number {
  const darkest = relativeLuminance(flattenLayers(BLACK, layers));
  const lightest = relativeLuminance(flattenLayers(WHITE, layers));
  const textLuminance = relativeLuminance(text);
  if (textLuminance >= darkest && textLuminance <= lightest) {
    return NO_CONTRAST;
  }
  return Math.min(luminanceRatio(textLuminance, darkest), luminanceRatio(textLuminance, lightest));
}

/**
 * Menor alfa da tinta (em passos de 0,01) que mantém o texto no alvo contra
 * qualquer fundo. `null` quando nem a tinta opaca alcança: aí o problema é o
 * par de cores, não a opacidade.
 */
export function minimumTintAlpha(text: Rgb, tint: Rgb, options: MinimumTintOptions = {}): number | null {
  const target = options.target ?? WCAG_AA_TEXT;
  const layersAbove = options.layersAbove ?? [];
  for (let step = 0; step <= ALPHA_STEPS; step += 1) {
    const alpha = step / ALPHA_STEPS;
    if (worstCaseContrast(text, [{ color: tint, alpha }, ...layersAbove]) >= target) {
      return alpha;
    }
  }
  return null;
}
