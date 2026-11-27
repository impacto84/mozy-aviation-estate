// @vitest-environment node
import { describe, expect, it } from "vitest";
import { TOTAL_UNITS, findTier, percent, unitShare } from "./simulator-model";

describe("simulator-model", () => {
  it("soma as 60 residências e calcula a participação", () => {
    expect(TOTAL_UNITS).toBe(60);
    expect(unitShare(findTier("Runway Signature"))).toBe(0.5);
    expect(percent(unitShare(findTier("Founder Estates")))).toBe("20%");
  });

  it("recusa coleção desconhecida", () => {
    expect(() => findTier("X" as never)).toThrow("Coleção desconhecida");
  });
});
