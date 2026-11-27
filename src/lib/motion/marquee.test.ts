import { describe, expect, it } from "vitest";
import { MARQUEE_DEFAULT_SPEED, marqueeDurationSeconds } from "./marquee";

describe("marqueeDurationSeconds", () => {
  it("divide a distância pela velocidade", () => {
    expect(marqueeDurationSeconds(1200, 40)).toBe(30);
    expect(marqueeDurationSeconds(600, 40)).toBe(15);
  });

  it("mantém o mesmo ritmo em larguras diferentes", () => {
    const narrow = marqueeDurationSeconds(400, MARQUEE_DEFAULT_SPEED);
    const wide = marqueeDurationSeconds(1600, MARQUEE_DEFAULT_SPEED);

    expect((wide ?? 0) / (narrow ?? 1)).toBe(4);
  });

  it("devolve null enquanto a distância não foi medida", () => {
    expect(marqueeDurationSeconds(0, 40)).toBeNull();
    expect(marqueeDurationSeconds(Number.NaN, 40)).toBeNull();
  });

  it("recusa velocidade inválida", () => {
    expect(() => marqueeDurationSeconds(100, 0)).toThrow(RangeError);
    expect(() => marqueeDurationSeconds(100, Number.NaN)).toThrow(RangeError);
  });
});
