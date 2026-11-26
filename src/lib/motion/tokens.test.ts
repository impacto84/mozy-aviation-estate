import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MOTION_DURATION_MS, MOTION_EASE, MOTION_EASE_POINTS, MOTION_STAGGER_MS, cssCubicBezier, durationSeconds } from "./tokens";

/** O vitest roda com a raiz do projeto como diretório de trabalho. */
const TOKENS_CSS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

function cssValue(property: string): string {
  const match = new RegExp(`${property}:\\s*([^;]+);`).exec(TOKENS_CSS);
  if (match?.[1] === undefined) {
    throw new Error(`tokens.css não declara ${property}.`);
  }
  return match[1].trim();
}

describe("tokens de movimento", () => {
  it.each([
    ["--duration-fast", MOTION_DURATION_MS.fast],
    ["--duration-base", MOTION_DURATION_MS.base],
    ["--duration-slow", MOTION_DURATION_MS.slow],
  ])("%s do CSS é igual ao valor em TypeScript", (property, expectedMs) => {
    expect(cssValue(property)).toBe(`${expectedMs}ms`);
  });

  it.each([
    ["--ease-out", "out"],
    ["--ease-in-out", "inOut"],
  ] as const)("%s do CSS é igual à curva em TypeScript", (property, name) => {
    expect(cssValue(property)).toBe(cssCubicBezier(name));
  });

  it("entrega a duração em segundos", () => {
    expect(durationSeconds("fast")).toBe(0.16);
    expect(durationSeconds("slow")).toBe(0.72);
  });

  it("expõe as curvas como funções que respeitam as pontas", () => {
    for (const name of Object.keys(MOTION_EASE_POINTS) as (keyof typeof MOTION_EASE_POINTS)[]) {
      expect(MOTION_EASE[name](0)).toBe(0);
      expect(MOTION_EASE[name](1)).toBe(1);
    }
    expect(MOTION_EASE.out(0.3)).toBeGreaterThan(0.7);
    expect(MOTION_EASE.inOut(0.5)).toBeCloseTo(0.5, 3);
  });

  it("tem um intervalo de stagger curto", () => {
    expect(MOTION_STAGGER_MS).toBeGreaterThan(0);
    expect(MOTION_STAGGER_MS).toBeLessThan(MOTION_DURATION_MS.fast);
  });
});
