import { describe, expect, it } from "vitest";
import {
  BLACK,
  WCAG_AA_TEXT,
  WHITE,
  compositeOver,
  contrastRatio,
  flattenLayers,
  minimumTintAlpha,
  relativeLuminance,
  worstCaseContrast,
} from "./contrast";
import type { Rgb } from "./contrast";

const MID_GRAY: Rgb = { r: 0.5, g: 0.5, b: 0.5 };
const NEAR_BLACK: Rgb = { r: 0.08, g: 0.08, b: 0.08 };
const NEAR_WHITE: Rgb = { r: 0.97, g: 0.97, b: 0.97 };

describe("relativeLuminance", () => {
  it("vale 0 para preto e 1 para branco", () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 6);
  });

  it("usa os pesos do WCAG: verde pesa mais que vermelho, que pesa mais que azul", () => {
    const red = relativeLuminance({ r: 1, g: 0, b: 0 });
    const green = relativeLuminance({ r: 0, g: 1, b: 0 });
    const blue = relativeLuminance({ r: 0, g: 0, b: 1 });

    expect(red).toBeCloseTo(0.2126, 4);
    expect(green).toBeCloseTo(0.7152, 4);
    expect(blue).toBeCloseTo(0.0722, 4);
  });

  it("trata canal fora da faixa como o limite mais próximo", () => {
    expect(relativeLuminance({ r: 2, g: 2, b: 2 })).toBeCloseTo(1, 6);
    expect(relativeLuminance({ r: -1, g: -1, b: -1 })).toBe(0);
  });
});

describe("contrastRatio", () => {
  it("vale 21 entre preto e branco, em qualquer ordem", () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 4);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 4);
  });

  it("vale 1 entre cores iguais", () => {
    expect(contrastRatio(MID_GRAY, MID_GRAY)).toBe(1);
  });

  it("bate com o valor conhecido de cinza #777 sobre branco (4,48:1)", () => {
    const gray777: Rgb = { r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 };

    expect(contrastRatio(gray777, WHITE)).toBeCloseTo(4.48, 2);
  });
});

describe("compositeOver", () => {
  it("camada opaca esconde o fundo e camada transparente não muda nada", () => {
    expect(compositeOver(WHITE, { color: BLACK, alpha: 1 })).toEqual(BLACK);
    expect(compositeOver(WHITE, { color: BLACK, alpha: 0 })).toEqual(WHITE);
  });

  it("mistura por canal, no espaço sRGB codificado, como o navegador", () => {
    const mixed = compositeOver(WHITE, { color: BLACK, alpha: 0.25 });

    expect(mixed.r).toBeCloseTo(0.75, 6);
    expect(mixed.g).toBeCloseTo(0.75, 6);
    expect(mixed.b).toBeCloseTo(0.75, 6);
  });

  it("limita o alfa à faixa de 0 a 1", () => {
    expect(compositeOver(WHITE, { color: BLACK, alpha: 4 })).toEqual(BLACK);
    expect(compositeOver(WHITE, { color: BLACK, alpha: -1 })).toEqual(WHITE);
  });

  it("não altera os argumentos", () => {
    const backdrop: Rgb = { r: 1, g: 1, b: 1 };
    const layer = { color: BLACK, alpha: 0.5 };

    compositeOver(backdrop, layer);

    expect(backdrop).toEqual({ r: 1, g: 1, b: 1 });
    expect(layer).toEqual({ color: BLACK, alpha: 0.5 });
  });
});

describe("flattenLayers", () => {
  it("aplica as camadas de baixo para cima", () => {
    const flat = flattenLayers(WHITE, [
      { color: BLACK, alpha: 1 },
      { color: WHITE, alpha: 0.5 },
    ]);

    expect(flat.r).toBeCloseTo(0.5, 6);
  });

  it("sem camadas devolve o próprio fundo", () => {
    expect(flattenLayers(MID_GRAY, [])).toEqual(MID_GRAY);
  });
});

describe("worstCaseContrast", () => {
  it("com tinta opaca, o fundo atrás do vidro não importa", () => {
    const ratio = worstCaseContrast(NEAR_BLACK, [{ color: NEAR_WHITE, alpha: 1 }]);

    expect(ratio).toBeCloseTo(contrastRatio(NEAR_BLACK, NEAR_WHITE), 6);
  });

  it("texto escuro sobre tinta clara: o pior caso é o fundo preto", () => {
    const tint = { color: NEAR_WHITE, alpha: 0.8 };
    const overBlack = contrastRatio(NEAR_BLACK, flattenLayers(BLACK, [tint]));
    const overWhite = contrastRatio(NEAR_BLACK, flattenLayers(WHITE, [tint]));

    expect(worstCaseContrast(NEAR_BLACK, [tint])).toBeCloseTo(overBlack, 6);
    expect(overBlack).toBeLessThan(overWhite);
  });

  it("texto claro sobre tinta escura: o pior caso é o fundo branco", () => {
    const tint = { color: NEAR_BLACK, alpha: 0.8 };
    const overWhite = contrastRatio(NEAR_WHITE, flattenLayers(WHITE, [tint]));

    expect(worstCaseContrast(NEAR_WHITE, [tint])).toBeCloseTo(overWhite, 6);
  });

  it("vale 1 quando algum fundo consegue igualar a luminância do texto", () => {
    // Tinta fraca: entre o fundo preto e o branco existe um cinza igual ao texto.
    expect(worstCaseContrast(MID_GRAY, [{ color: NEAR_WHITE, alpha: 0.2 }])).toBe(1);
  });

  it("sem tinta nenhuma, vale 1", () => {
    expect(worstCaseContrast(NEAR_BLACK, [])).toBe(1);
  });
});

describe("minimumTintAlpha", () => {
  it("devolve o menor alfa cuja pior combinação ainda passa no alvo", () => {
    const alpha = minimumTintAlpha(NEAR_BLACK, NEAR_WHITE);

    expect(alpha).not.toBeNull();
    const found = alpha ?? 1;
    expect(worstCaseContrast(NEAR_BLACK, [{ color: NEAR_WHITE, alpha: found }])).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(worstCaseContrast(NEAR_BLACK, [{ color: NEAR_WHITE, alpha: found - 0.01 }])).toBeLessThan(WCAG_AA_TEXT);
  });

  it("pede mais tinta quando há uma camada de brilho por cima", () => {
    const plain = minimumTintAlpha(NEAR_WHITE, NEAR_BLACK) ?? 1;
    const withSheen = minimumTintAlpha(NEAR_WHITE, NEAR_BLACK, { layersAbove: [{ color: WHITE, alpha: 0.1 }] }) ?? 1;

    expect(withSheen).toBeGreaterThan(plain);
  });

  it("pede mais tinta para um alvo mais alto", () => {
    const aa = minimumTintAlpha(NEAR_BLACK, NEAR_WHITE) ?? 1;
    const aaa = minimumTintAlpha(NEAR_BLACK, NEAR_WHITE, { target: 7 }) ?? 1;

    expect(aaa).toBeGreaterThan(aa);
  });

  it("devolve null quando nem a tinta opaca alcança o alvo", () => {
    expect(minimumTintAlpha(MID_GRAY, NEAR_WHITE)).toBeNull();
  });
});
