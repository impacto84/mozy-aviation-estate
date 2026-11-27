import { describe, expect, it } from "vitest";
import { EASINGS, clamp, clamp01, cubicBezier, lerp, resolveEasing, smoothstep, windowProgress } from "./easing";
import type { EasingName } from "./easing";

const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

describe("clamp e clamp01", () => {
  it("prende o valor entre os limites", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-2, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(-0.1)).toBe(0);
  });

  it("devolve o mínimo quando recebe NaN", () => {
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it("recusa limites invertidos", () => {
    expect(() => clamp(1, 3, 0)).toThrow(RangeError);
  });
});

describe("lerp", () => {
  it("interpola e extrapola de forma linear", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 1.1)).toBeCloseTo(21);
  });
});

describe("windowProgress", () => {
  it("devolve 0 antes da janela, 1 depois e a fração no meio", () => {
    expect(windowProgress(1, 2, 4)).toBe(0);
    expect(windowProgress(3, 2, 4)).toBe(0.5);
    expect(windowProgress(9, 2, 4)).toBe(1);
  });

  it("recusa janela vazia ou invertida", () => {
    expect(() => windowProgress(1, 2, 2)).toThrow(RangeError);
    expect(() => windowProgress(1, 3, 2)).toThrow(RangeError);
    expect(() => windowProgress(1, Number.NaN, 2)).toThrow(RangeError);
  });
});

describe("smoothstep", () => {
  it("vai de 0 a 1 com derivada zero nas pontas", () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.1)).toBeLessThan(0.1);
  });
});

describe("EASINGS", () => {
  it.each(EASING_NAMES)("%s começa em 0 e termina em 1", (name) => {
    expect(EASINGS[name](0)).toBeCloseTo(0);
    expect(EASINGS[name](1)).toBeCloseTo(1);
  });

  it.each(EASING_NAMES)("%s ignora entrada fora de 0..1", (name) => {
    expect(EASINGS[name](-3)).toBeCloseTo(0);
    expect(EASINGS[name](7)).toBeCloseTo(1);
  });

  it("outQuart desacelera: passa da metade cedo", () => {
    expect(EASINGS.outQuart(0.25)).toBeGreaterThan(0.6);
    expect(EASINGS.outCubic(0.25)).toBeGreaterThan(0.5);
  });

  it("inOutCubic é simétrica em torno da metade", () => {
    expect(EASINGS.inOutCubic(0.5)).toBeCloseTo(0.5);
    expect(EASINGS.inOutCubic(0.25) + EASINGS.inOutCubic(0.75)).toBeCloseTo(1);
  });

  it("outBack passa de 1 antes de assentar", () => {
    expect(EASINGS.outBack(0.7)).toBeGreaterThan(1);
  });
});

describe("resolveEasing", () => {
  it("aceita nome, função ou nada", () => {
    const custom = (t: number): number => t * t;

    expect(resolveEasing("outQuart")).toBe(EASINGS.outQuart);
    expect(resolveEasing(custom)).toBe(custom);
    expect(resolveEasing(undefined)(0.3)).toBe(0.3);
  });
});

describe("cubicBezier", () => {
  it("reproduz a curva linear", () => {
    const ease = cubicBezier(0.25, 0.25, 0.75, 0.75);

    expect(ease(0.2)).toBeCloseTo(0.2, 4);
    expect(ease(0.8)).toBeCloseTo(0.8, 4);
  });

  it("bate com a curva paramétrica amostrada por força bruta", () => {
    const [x1, y1, x2, y2] = [0.25, 0.1, 0.25, 1] as const;
    const ease = cubicBezier(x1, y1, x2, y2);
    const axis = (t: number, p1: number, p2: number): number => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
    const reference = (x: number): number => {
      let best = 0;
      for (let step = 0; step <= 100_000; step += 1) {
        const t = step / 100_000;
        if (Math.abs(axis(t, x1, x2) - x) < Math.abs(axis(best, x1, x2) - x)) {
          best = t;
        }
      }
      return axis(best, y1, y2);
    };

    for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(ease(x)).toBeCloseTo(reference(x), 4);
    }
  });

  it("fixa as pontas e prende a entrada", () => {
    const ease = cubicBezier(0.16, 1, 0.3, 1);

    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });

  it("é monótona para uma curva de saída", () => {
    const ease = cubicBezier(0.16, 1, 0.3, 1);
    const samples = Array.from({ length: 21 }, (_, index) => ease(index / 20));

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1] ?? 0);
    }
  });

  it("resolve curvas com tangente vertical no início (bisseção)", () => {
    const ease = cubicBezier(0, 0, 1, 1);

    expect(ease(0.5)).toBeCloseTo(0.5, 3);
    expect(cubicBezier(0, 1, 0, 1)(0.001)).toBeGreaterThan(0);
  });

  it("recusa x fora de 0..1 e valores não finitos", () => {
    expect(() => cubicBezier(1.2, 0, 0.3, 1)).toThrow(RangeError);
    expect(() => cubicBezier(0.2, 0, -0.3, 1)).toThrow(RangeError);
    expect(() => cubicBezier(0.2, Number.NaN, 0.3, 1)).toThrow(RangeError);
  });
});
