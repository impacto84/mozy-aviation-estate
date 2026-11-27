/**
 * Paleta do hero lida dos design tokens.
 *
 * O CSS do hero registra quatro custom properties com `@property` e
 * `syntax: "<color>"` (ver `HeroShell.module.css`). Com isso o navegador entrega
 * em `getComputedStyle` a cor já resolvida (`var()`, `light-dark()` e
 * `color-mix()` aplicados), e este módulo só precisa converter para sRGB 0..1.
 *
 * Atenção: o build do Next (Lightning CSS) reescreve `oklch()` dos tokens em
 * `lab()`, então é `lab(...)` que chega aqui para um token puro, e `oklch(...)`
 * para um `color-mix(in oklch, ...)`. Por isso as duas famílias são aceitas.
 *
 * Constantes de conversão: OKLab -> sRGB linear de Björn Ottosson ("A perceptual
 * color space for image processing", 2020); CIE Lab (D50) -> XYZ e XYZ (D50) ->
 * sRGB linear da especificação CSS Color 4. São números de especificação, não
 * código copiado.
 */

/** Cor em sRGB, canais de 0 a 1. */
export type Rgb = readonly [number, number, number];

export interface HeroPalette {
  /** Fundo da seção: o canvas tem de casar com ele nas bordas. */
  readonly base: Rgb;
  /** Mistura suave entre fundo e destaque. */
  readonly soft: Rgb;
  readonly accent: Rgb;
  /** Cor do texto, para detalhes finos. */
  readonly ink: Rgb;
}

export const HERO_PALETTE_PROPERTIES = {
  base: "--hero-color-base",
  soft: "--hero-color-soft",
  accent: "--hero-color-accent",
  ink: "--hero-color-ink",
} as const satisfies Record<keyof HeroPalette, string>;

interface ComputedStyleSource {
  readonly getPropertyValue: (name: string) => string;
}

const BYTE_MAX = 255;
const PERCENT = 100;
/** Em `oklch()` e `oklab()`, 100% de croma ou de eixo vale 0,4. */
const OK_PERCENT_REFERENCE = 0.4;
/** Em `lab()`, 100% de L vale 100 e 100% de a/b vale 125; em `lch()`, 100% de C vale 150. */
const LAB_LIGHTNESS_REFERENCE = 100;
const LAB_AXIS_REFERENCE = 125;
const LCH_CHROMA_REFERENCE = 150;
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;
const D50_WHITE: Rgb = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];
const DEGREES_TO_RADIANS = Math.PI / 180;
const SRGB_LINEAR_THRESHOLD = 0.04045;
const SRGB_ENCODE_THRESHOLD = 0.0031308;
const SRGB_LINEAR_SLOPE = 12.92;
const SRGB_OFFSET = 0.055;
const SRGB_GAMMA = 2.4;

const FUNCTION_PATTERN = /^([a-z-]+)\(([^()]*)\)$/;
const HEX_PATTERN = /^#([0-9a-f]{3,8})$/;
const HEX_LENGTHS: readonly number[] = [3, 4, 6, 8];
const SHORT_HEX_MAX_LENGTH = 4;

function clampUnit(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function decodeChannel(value: number): number {
  return value <= SRGB_LINEAR_THRESHOLD
    ? value / SRGB_LINEAR_SLOPE
    : ((value + SRGB_OFFSET) / (1 + SRGB_OFFSET)) ** SRGB_GAMMA;
}

function encodeChannel(value: number): number {
  const encoded =
    value <= SRGB_ENCODE_THRESHOLD
      ? value * SRGB_LINEAR_SLOPE
      : (1 + SRGB_OFFSET) * value ** (1 / SRGB_GAMMA) - SRGB_OFFSET;
  return clampUnit(encoded);
}

/** sRGB (com gama) para sRGB linear: é em linear que o shader mistura cores. */
export function srgbToLinear(color: Rgb): Rgb {
  return [decodeChannel(color[0]), decodeChannel(color[1]), decodeChannel(color[2])];
}

function linearToSrgb(red: number, green: number, blue: number): Rgb {
  return [encodeChannel(Math.max(red, 0)), encodeChannel(Math.max(green, 0)), encodeChannel(Math.max(blue, 0))];
}

function oklabToSrgb(lightness: number, a: number, b: number): Rgb {
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return linearToSrgb(
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  );
}

function labToXyzComponent(value: number): number {
  const cubed = value ** 3;
  return cubed > LAB_EPSILON ? cubed : (116 * value - 16) / LAB_KAPPA;
}

/** CIE Lab com branco D50 (o `lab()` do CSS) para sRGB. */
function labToSrgb(lightness: number, a: number, b: number): Rgb {
  const fy = (lightness + 16) / 116;
  const x = labToXyzComponent(a / 500 + fy) * D50_WHITE[0];
  const y = (lightness > LAB_KAPPA * LAB_EPSILON ? fy ** 3 : lightness / LAB_KAPPA) * D50_WHITE[1];
  const z = labToXyzComponent(fy - b / 200) * D50_WHITE[2];
  return linearToSrgb(
    3.1341359569958707 * x - 1.6173863321612538 * y - 0.4906619460083532 * z,
    -0.978795502912089 * x + 1.916254567259524 * y + 0.03344273116131949 * z,
    0.07195537988411677 * x - 0.2289768264158322 * y + 1.405386058324125 * z,
  );
}

/** Número CSS simples: `0.5`, `50%` (vira `0.5 * percentReference`), `120deg`, `none`. */
function parseComponent(token: string, percentReference: number): number | null {
  if (token === "none") {
    return 0;
  }
  const isPercent = token.endsWith("%");
  const raw = isPercent ? token.slice(0, -1) : token.replace(/deg$/, "");
  if (raw === "" || Number.isNaN(Number(raw))) {
    return null;
  }
  return isPercent ? (Number(raw) / PERCENT) * percentReference : Number(raw);
}

/** Separa os três primeiros componentes; o alfa (depois de `/` ou quarto valor) é ignorado. */
function splitComponents(body: string): readonly string[] {
  const withoutAlpha = body.split("/")[0] ?? "";
  return withoutAlpha.split(/[\s,]+/).filter((token) => token !== "");
}

function parseTriple(tokens: readonly string[], references: readonly [number, number, number]): Rgb | null {
  const [first, second, third] = tokens;
  if (first === undefined || second === undefined || third === undefined) {
    return null;
  }
  const values = [
    parseComponent(first, references[0]),
    parseComponent(second, references[1]),
    parseComponent(third, references[2]),
  ];
  const [x, y, z] = values;
  return x === null || y === null || z === null || x === undefined || y === undefined || z === undefined
    ? null
    : [x, y, z];
}

function parseHex(digits: string): Rgb | null {
  if (!HEX_LENGTHS.includes(digits.length)) {
    return null;
  }
  const isShort = digits.length <= SHORT_HEX_MAX_LENGTH;
  const channelAt = (index: number): number => {
    const pair = isShort ? (digits[index] ?? "0").repeat(2) : digits.slice(index * 2, index * 2 + 2);
    return Number.parseInt(pair, 16) / BYTE_MAX;
  };
  return [channelAt(0), channelAt(1), channelAt(2)];
}

function parseRgbFunction(body: string): Rgb | null {
  const triple = parseTriple(splitComponents(body), [BYTE_MAX, BYTE_MAX, BYTE_MAX]);
  return triple === null
    ? null
    : [clampUnit(triple[0] / BYTE_MAX), clampUnit(triple[1] / BYTE_MAX), clampUnit(triple[2] / BYTE_MAX)];
}

function parseOklch(body: string): Rgb | null {
  const triple = parseTriple(splitComponents(body), [1, OK_PERCENT_REFERENCE, 1]);
  if (triple === null) {
    return null;
  }
  const [lightness, chroma, hue] = triple;
  const radians = hue * DEGREES_TO_RADIANS;
  return oklabToSrgb(lightness, chroma * Math.cos(radians), chroma * Math.sin(radians));
}

function parseOklab(body: string): Rgb | null {
  const triple = parseTriple(splitComponents(body), [1, OK_PERCENT_REFERENCE, OK_PERCENT_REFERENCE]);
  return triple === null ? null : oklabToSrgb(triple[0], triple[1], triple[2]);
}

function parseLab(body: string): Rgb | null {
  const triple = parseTriple(splitComponents(body), [LAB_LIGHTNESS_REFERENCE, LAB_AXIS_REFERENCE, LAB_AXIS_REFERENCE]);
  return triple === null ? null : labToSrgb(triple[0], triple[1], triple[2]);
}

function parseLch(body: string): Rgb | null {
  const triple = parseTriple(splitComponents(body), [LAB_LIGHTNESS_REFERENCE, LCH_CHROMA_REFERENCE, 1]);
  if (triple === null) {
    return null;
  }
  const [lightness, chroma, hue] = triple;
  const radians = hue * DEGREES_TO_RADIANS;
  return labToSrgb(lightness, chroma * Math.cos(radians), chroma * Math.sin(radians));
}

function parseColorFunction(body: string): Rgb | null {
  const [space, ...rest] = splitComponents(body);
  const triple = parseTriple(rest, [1, 1, 1]);
  if (triple === null) {
    return null;
  }
  if (space === "srgb") {
    return [clampUnit(triple[0]), clampUnit(triple[1]), clampUnit(triple[2])];
  }
  return space === "srgb-linear" ? linearToSrgb(triple[0], triple[1], triple[2]) : null;
}

const FUNCTION_PARSERS: Readonly<Record<string, (body: string) => Rgb | null>> = {
  rgb: parseRgbFunction,
  rgba: parseRgbFunction,
  oklch: parseOklch,
  oklab: parseOklab,
  lab: parseLab,
  lch: parseLch,
  color: parseColorFunction,
};

/**
 * Converte a cor que o navegador serializa em `getComputedStyle` para sRGB 0..1.
 * Aceita hex, `rgb()`, `oklch()`, `oklab()`, `lab()`, `lch()` e `color(srgb | srgb-linear ...)`.
 * Devolve `null` para qualquer outra sintaxe: quem chama fica no pôster.
 */
export function parseCssColor(value: string): Rgb | null {
  const text = value.trim().toLowerCase();
  const hex = HEX_PATTERN.exec(text);
  if (hex?.[1] !== undefined) {
    return parseHex(hex[1]);
  }
  const call = FUNCTION_PATTERN.exec(text);
  const name = call?.[1];
  const body = call?.[2];
  if (name === undefined || body === undefined || !Object.hasOwn(FUNCTION_PARSERS, name)) {
    return null;
  }
  return FUNCTION_PARSERS[name]?.(body) ?? null;
}

/** Lê a paleta das custom properties do hero. `null` se alguma cor não puder ser lida. */
export function readHeroPalette(style: ComputedStyleSource): HeroPalette | null {
  const read = (name: string): Rgb | null => parseCssColor(style.getPropertyValue(name));
  const base = read(HERO_PALETTE_PROPERTIES.base);
  const soft = read(HERO_PALETTE_PROPERTIES.soft);
  const accent = read(HERO_PALETTE_PROPERTIES.accent);
  const ink = read(HERO_PALETTE_PROPERTIES.ink);
  if (base === null || soft === null || accent === null || ink === null) {
    return null;
  }
  return { base, soft, accent, ink };
}
