import { describe, expect, it } from "vitest";
import { clamp01, damp, lerp } from "./scene-math";

describe("clamp01", () => {
  it("mantém valores entre 0 e 1 e corta o resto", () => {
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(7)).toBe(1);
  });

  it("trata NaN como 0", () => {
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe("lerp", () => {
  it("interpola entre os extremos", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });
});

describe("damp", () => {
  it("aproxima do alvo sem ultrapassar", () => {
    const next = damp(0, 1, 4, 0.1);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it("não se move com delta zero (frame parado)", () => {
    expect(damp(0.3, 1, 4, 0)).toBe(0.3);
  });

  it("dá o mesmo resultado em um passo longo ou em dois curtos (independe da taxa de frames)", () => {
    const oneStep = damp(0, 1, 5, 0.2);
    const twoSteps = damp(damp(0, 1, 5, 0.1), 1, 5, 0.1);

    expect(twoSteps).toBeCloseTo(oneStep, 10);
  });

  it("chega ao alvo com delta muito grande", () => {
    expect(damp(0, 1, 5, 100)).toBeCloseTo(1, 10);
  });
});
