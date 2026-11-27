import { describe, expect, it } from "vitest";
import { fitScale } from "./stage-scale";

const STAGE = { width: 600, height: 640 };

describe("fitScale", () => {
  it("encolhe o palco para caber inteiro (contain)", () => {
    expect(fitScale({ width: 300, height: 640 }, STAGE)).toBe(0.5);
    expect(fitScale({ width: 600, height: 320 }, STAGE)).toBe(0.5);
  });

  it("preenche o contêiner cortando as bordas (cover)", () => {
    expect(fitScale({ width: 300, height: 640 }, STAGE, "cover")).toBe(1);
    expect(fitScale({ width: 1200, height: 640 }, STAGE, "cover")).toBe(2);
  });

  it("amplia quando o contêiner é maior que o palco", () => {
    expect(fitScale({ width: 1200, height: 1280 }, STAGE)).toBe(2);
  });

  it("devolve null enquanto o contêiner não tem área", () => {
    expect(fitScale({ width: 0, height: 640 }, STAGE)).toBeNull();
    expect(fitScale({ width: 300, height: 0 }, STAGE)).toBeNull();
    expect(fitScale({ width: Number.NaN, height: 10 }, STAGE)).toBeNull();
  });

  it("recusa palco sem área", () => {
    expect(() => fitScale({ width: 300, height: 300 }, { width: 0, height: 640 })).toThrow(RangeError);
    expect(() => fitScale({ width: 300, height: 300 }, { width: 600, height: Number.NaN })).toThrow(RangeError);
  });
});
