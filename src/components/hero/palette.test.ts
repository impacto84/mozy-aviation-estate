import { describe, expect, it } from "vitest";
import { HERO_PALETTE_PROPERTIES, parseCssColor, readHeroPalette, srgbToLinear } from "./palette";
import type { Rgb } from "./palette";

const TOLERANCE_DIGITS = 2;

function expectRgb(actual: Rgb | null, expected: Rgb): void {
  expect(actual).not.toBeNull();
  if (actual === null) {
    return;
  }
  expect(actual[0]).toBeCloseTo(expected[0], TOLERANCE_DIGITS);
  expect(actual[1]).toBeCloseTo(expected[1], TOLERANCE_DIGITS);
  expect(actual[2]).toBeCloseTo(expected[2], TOLERANCE_DIGITS);
}

describe("parseCssColor", () => {
  it("lê hex de 3, 4, 6 e 8 dígitos", () => {
    expectRgb(parseCssColor("#fff"), [1, 1, 1]);
    expectRgb(parseCssColor("#f00c"), [1, 0, 0]);
    expectRgb(parseCssColor("#0080ff"), [0, 0.502, 1]);
    expectRgb(parseCssColor("#0080FF80"), [0, 0.502, 1]);
  });

  it("lê rgb() com vírgulas, com espaços, com alfa e com porcentagem", () => {
    expectRgb(parseCssColor("rgb(255, 0, 0)"), [1, 0, 0]);
    expectRgb(parseCssColor("rgba(0, 128, 255, 0.5)"), [0, 0.502, 1]);
    expectRgb(parseCssColor("rgb(0 128 255 / 50%)"), [0, 0.502, 1]);
    expectRgb(parseCssColor("rgb(100% 50% 0%)"), [1, 0.5, 0]);
  });

  it("lê color(srgb ...) e color(srgb-linear ...)", () => {
    expectRgb(parseCssColor("color(srgb 0.25 0.5 0.75)"), [0.25, 0.5, 0.75]);
    expectRgb(parseCssColor("color(srgb-linear 1 0.2140 0)"), [1, 0.5, 0]);
  });

  it("converte oklch() acromático para o cinza equivalente", () => {
    expectRgb(parseCssColor("oklch(1 0 0)"), [1, 1, 1]);
    expectRgb(parseCssColor("oklch(0% 0 0)"), [0, 0, 0]);
    // L = 0,5 -> luminância linear 0,5^3 = 0,125 -> sRGB 0,389.
    expectRgb(parseCssColor("oklch(0.5 0 0)"), [0.389, 0.389, 0.389]);
  });

  it("converte oklch() cromático (referência: vermelho sRGB)", () => {
    expectRgb(parseCssColor("oklch(0.628 0.2577 29.23)"), [1, 0, 0]);
    expectRgb(parseCssColor("oklch(62.8% 0.2577 29.23deg / 0.4)"), [1, 0, 0]);
  });

  it("converte oklab() (referência: azul sRGB)", () => {
    expectRgb(parseCssColor("oklab(0.452 -0.0325 -0.3115)"), [0, 0, 1]);
  });

  it("converte lab() e lch() em D50 (é assim que o build entrega os tokens oklch)", () => {
    expectRgb(parseCssColor("lab(100 0 0)"), [1, 1, 1]);
    expectRgb(parseCssColor("lab(0 0 0)"), [0, 0, 0]);
    expectRgb(parseCssColor("lab(54.29 80.8 69.89)"), [1, 0, 0]);
    expectRgb(parseCssColor("lch(54.29 106.84 40.86)"), [1, 0, 0]);
    expectRgb(parseCssColor("lab(50% 0 0)"), [0.466, 0.466, 0.466]);
  });

  it("dá a mesma cor para o token em oklch() e para a forma lab() que o navegador serializa", () => {
    const fromOklch = parseCssColor("oklch(0.46 0.19 262)");
    const fromLab = parseCssColor("lab(35.0512 19.082 -66.582)");

    expect(fromOklch).not.toBeNull();
    expectRgb(fromLab, fromOklch ?? [0, 0, 0]);
  });

  it("trata `none` como zero", () => {
    expectRgb(parseCssColor("oklch(1 none none)"), [1, 1, 1]);
  });

  it("limita ao intervalo 0..1 uma cor fora do gamut sRGB", () => {
    const outOfGamut = parseCssColor("oklch(0.7 0.4 150)");

    expect(outOfGamut).not.toBeNull();
    for (const channel of outOfGamut ?? []) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });

  it("aceita espaços nas pontas e maiúsculas", () => {
    expectRgb(parseCssColor("  RGB(255 255 255)  "), [1, 1, 1]);
  });

  it("devolve null para sintaxe que não conhece ou incompleta", () => {
    expect(parseCssColor("")).toBeNull();
    expect(parseCssColor("rebeccapurple")).toBeNull();
    expect(parseCssColor("#12")).toBeNull();
    expect(parseCssColor("#ggg")).toBeNull();
    expect(parseCssColor("rgb(1, 2)")).toBeNull();
    expect(parseCssColor("rgb(a b c)")).toBeNull();
    expect(parseCssColor("color(display-p3 1 0 0)")).toBeNull();
    expect(parseCssColor("light-dark(oklch(1 0 0), oklch(0 0 0))")).toBeNull();
    expect(parseCssColor("hsl(200 50% 50%)")).toBeNull();
  });
});

describe("srgbToLinear", () => {
  it("mantém preto e branco e escurece os meios-tons", () => {
    expectRgb(srgbToLinear([0, 0, 0]), [0, 0, 0]);
    expectRgb(srgbToLinear([1, 1, 1]), [1, 1, 1]);
    expectRgb(srgbToLinear([0.5, 0.5, 0.5]), [0.214, 0.214, 0.214]);
  });

  it("usa o trecho linear da curva para valores muito escuros", () => {
    expectRgb(srgbToLinear([0.04, 0.04, 0.04]), [0.0031, 0.0031, 0.0031]);
  });
});

describe("readHeroPalette", () => {
  function styleOf(values: Readonly<Record<string, string>>) {
    return { getPropertyValue: (name: string) => values[name] ?? "" };
  }

  it("lê as quatro cores das custom properties do hero", () => {
    const palette = readHeroPalette(
      styleOf({
        [HERO_PALETTE_PROPERTIES.base]: "oklch(1 0 0)",
        [HERO_PALETTE_PROPERTIES.soft]: " rgb(128, 128, 255)",
        [HERO_PALETTE_PROPERTIES.accent]: "#0000ff",
        [HERO_PALETTE_PROPERTIES.ink]: "color(srgb 0 0 0)",
      }),
    );

    expectRgb(palette?.base ?? null, [1, 1, 1]);
    expectRgb(palette?.soft ?? null, [0.502, 0.502, 1]);
    expectRgb(palette?.accent ?? null, [0, 0, 1]);
    expectRgb(palette?.ink ?? null, [0, 0, 0]);
  });

  it("devolve null quando falta uma cor ou ela não foi resolvida pelo navegador", () => {
    const withoutInk = styleOf({
      [HERO_PALETTE_PROPERTIES.base]: "#fff",
      [HERO_PALETTE_PROPERTIES.soft]: "#ccc",
      [HERO_PALETTE_PROPERTIES.accent]: "#00f",
    });
    const unresolved = styleOf({
      [HERO_PALETTE_PROPERTIES.base]: "light-dark(#fff, #000)",
      [HERO_PALETTE_PROPERTIES.soft]: "#ccc",
      [HERO_PALETTE_PROPERTIES.accent]: "#00f",
      [HERO_PALETTE_PROPERTIES.ink]: "#000",
    });

    expect(readHeroPalette(withoutInk)).toBeNull();
    expect(readHeroPalette(unresolved)).toBeNull();
  });
});
