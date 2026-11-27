import { describe, expect, it } from "vitest";
import { isRecord, parseJson, stringEntries } from "./guards";

describe("guards", () => {
  it("isRecord aceita só objeto simples", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1])).toBe(false);
    expect(isRecord("texto")).toBe(false);
  });

  it("stringEntries descarta o que não é texto", () => {
    expect(stringEntries({ a: "x", b: 1, c: null, d: "y" })).toEqual([
      ["a", "x"],
      ["d", "y"],
    ]);
  });

  it("parseJson devolve undefined em vez de lançar", () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson("{quebrado")).toBeUndefined();
  });
});
