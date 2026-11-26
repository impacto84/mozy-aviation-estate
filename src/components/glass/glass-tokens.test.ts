import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCssColor } from "@/components/hero/palette";
import { WCAG_AA_TEXT, compositeOver, minimumTintAlpha, worstCaseContrast } from "./contrast";
import type { GlassLayer, Rgb } from "./contrast";

/**
 * Prova de contraste do vidro com os tokens reais: lê `tokens.css` e
 * `Glass.module.css` e refaz a conta do pior fundo. Se alguém baixar o alfa da
 * tinta, subir o brilho ou trocar os tokens por um par que não fecha, falha aqui,
 * em segundos, antes do teste de navegador.
 */

type Scheme = "light" | "dark";

const SCHEMES: readonly Scheme[] = ["light", "dark"];
/** O vitest roda com a raiz do projeto como diretório de trabalho. */
const TOKENS_CSS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");
const GLASS_CSS = readFileSync(resolve(process.cwd(), "src/components/glass/Glass.module.css"), "utf8");
const PERCENT = 100;

function capture(source: string, pattern: RegExp, what: string): readonly string[] {
  const match = pattern.exec(source);
  if (match === null) {
    throw new Error(`Não encontrei ${what}.`);
  }
  return match.slice(1);
}

/** Corpo de um bloco de regra de tokens.css (sem chaves aninhadas). */
function ruleBody(selector: string): string {
  const start = TOKENS_CSS.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`Não encontrei o bloco ${selector}.`);
  }
  const open = TOKENS_CSS.indexOf("{", start);
  return TOKENS_CSS.slice(open + 1, TOKENS_CSS.indexOf("}", open));
}

/**
 * O site alterna superfícies por `data-surface`: o esquema escuro é o `:root` (void),
 * o claro é a superfície ivory. Um token do esquema claro que a superfície não
 * redefine herda o valor do `:root`.
 */
const SCHEME_BLOCKS: Readonly<Record<Scheme, readonly string[]>> = {
  dark: [ruleBody(":root")],
  light: [ruleBody('[data-surface="ivory"]'), ruleBody(":root")],
};
const ROOT_BLOCK = ruleBody(":root");

/** Cor de um token semântico em um esquema: `--color-x: var(--literal)` → literal OKLCH. */
function tokenColor(token: string, scheme: Scheme): Rgb {
  const block = SCHEME_BLOCKS[scheme].find((body) => new RegExp(`${token}:\\s*var\\(`).test(body)) ?? "";
  const [literal] = capture(block, new RegExp(`${token}:\\s*var\\((--[\\w-]+)\\)`), `${token} (${scheme})`);
  const [value] = capture(ROOT_BLOCK, new RegExp(`${literal}:\\s*([^;]+);`), `o literal ${literal}`);
  const parsed = parseCssColor(value ?? "");
  if (parsed === null) {
    throw new Error(`Não sei converter ${literal}: ${value}.`);
  }
  return { r: parsed[0], g: parsed[1], b: parsed[2] };
}

/** Padrão de um token do vidro escrito como `--_glass-x: var(--glass-x, 80%)`. */
function glassPercent(name: string): number {
  const [value] = capture(GLASS_CSS, new RegExp(`--_${name}:\\s*var\\(--${name},\\s*([\\d.]+)%\\)`), `o padrão de --${name}`);
  return Number(value) / PERCENT;
}

/** Fatia de `--color-text` na mistura de `--glass-text-muted`. */
function mutedTextShare(): number {
  const pattern = /--glass-text-muted:\s*color-mix\(in oklab,\s*var\(--color-text\)\s*([\d.]+)%,\s*var\(--_glass-tint\)\)/;
  const [value] = capture(GLASS_CSS, pattern, "a mistura de --glass-text-muted");
  return Number(value) / PERCENT;
}

interface GlassColors {
  readonly text: Rgb;
  readonly mutedText: Rgb;
  readonly standardMutedText: Rgb;
  readonly tint: GlassLayer;
  readonly sheen: GlassLayer;
}

function glassColors(scheme: Scheme): GlassColors {
  const text = tokenColor("--color-text", scheme);
  const tintColor = tokenColor("--color-surface", scheme);
  // O brilho usa a cor clara do esquema: --color-bg no claro, --color-text no escuro.
  const highlight = tokenColor(scheme === "light" ? "--color-bg" : "--color-text", scheme);
  return {
    text,
    // color-mix(in oklab) entre dois cinzas neutros é, na prática, a mistura linear em sRGB codificado.
    mutedText: compositeOver(tintColor, { color: text, alpha: mutedTextShare() }),
    standardMutedText: tokenColor("--color-text-muted", scheme),
    tint: { color: tintColor, alpha: glassPercent("glass-tint-alpha") },
    sheen: { color: highlight, alpha: glassPercent("glass-sheen-alpha") },
  };
}

/** O brilho cobre só parte do vidro: o pior caso é o menor entre ter e não ter brilho. */
function worstOnGlass(text: Rgb, colors: GlassColors): number {
  return Math.min(worstCaseContrast(text, [colors.tint]), worstCaseContrast(text, [colors.tint, colors.sheen]));
}

describe("tokens do vidro: contraste garantido pela tinta", () => {
  it("lê do CSS os padrões que a conta usa", () => {
    expect(glassPercent("glass-tint-alpha")).toBeGreaterThan(0);
    expect(glassPercent("glass-tint-alpha")).toBeLessThanOrEqual(1);
    expect(glassPercent("glass-sheen-alpha")).toBeLessThan(glassPercent("glass-tint-alpha"));
    expect(mutedTextShare()).toBeGreaterThan(0.5);
  });

  it.each(SCHEMES)("esquema %s: --color-text passa em AA contra qualquer fundo", (scheme) => {
    const colors = glassColors(scheme);

    expect(worstOnGlass(colors.text, colors)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it.each(SCHEMES)("esquema %s: --glass-text-muted passa em AA contra qualquer fundo", (scheme) => {
    const colors = glassColors(scheme);

    expect(worstOnGlass(colors.mutedText, colors)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it.each(SCHEMES)("esquema %s: o alfa da tinta está acima do mínimo calculado, com folga", (scheme) => {
    const colors = glassColors(scheme);
    const minimum = minimumTintAlpha(colors.mutedText, colors.tint.color, { layersAbove: [colors.sheen] });

    expect(minimum).not.toBeNull();
    expect(colors.tint.alpha).toBeGreaterThan(minimum ?? 1);
  });

  it("o --color-text-muted comum não é garantido sobre o vidro: por isso existe --glass-text-muted", () => {
    const failing = SCHEMES.filter((scheme) => {
      const colors = glassColors(scheme);
      return worstOnGlass(colors.standardMutedText, colors) < WCAG_AA_TEXT;
    });

    expect(failing.length).toBeGreaterThan(0);
  });
});

describe("Glass.module.css: estrutura que o Piso P7 exige", () => {
  /** Remove os blocos de uma at-rule (`@supports`, `@media`), casando chaves. */
  function withoutBlocks(css: string, atRule: string): string {
    let rest = css;
    for (let start = rest.indexOf(atRule); start !== -1; start = rest.indexOf(atRule)) {
      const open = rest.indexOf("{", start);
      let depth = 1;
      let index = open + 1;
      while (depth > 0 && index < rest.length) {
        depth += rest[index] === "{" ? 1 : rest[index] === "}" ? -1 : 0;
        index += 1;
      }
      rest = rest.slice(0, start) + rest.slice(index);
    }
    return rest;
  }

  const outside = withoutBlocks(GLASS_CSS.replace(/\/\*[\s\S]*?\*\//g, ""), "@supports");
  /** O que vale para todo navegador, sem condição nenhuma: nem `@supports`, nem `@media`. */
  const unconditional = withoutBlocks(outside, "@media");

  it("fora de @supports, backdrop-filter só aparece como none", () => {
    const values = [...outside.matchAll(/backdrop-filter:\s*([^;]+);/g)].map((match) => match[1]);

    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value === "none")).toBe(true);
  });

  it("a camada .backdrop tem fundo opaco declarado fora de @supports e fora de @media", () => {
    // Em `outside` a regra de `prefers-reduced-transparency` também casaria; o fallback do Piso P7 é o incondicional.
    expect(unconditional).toMatch(/\.backdrop\s*\{\s*background:\s*var\(--_glass-solid\);/);
  });

  it("fora de @supports nenhuma regra deixa a camada .backdrop transparente", () => {
    const backgrounds = [...outside.matchAll(/\.backdrop(?:\[[^\]]*\])?\s*\{[^}]*?background:\s*([^;]+);/g)].map((match) => match[1]);

    expect(backgrounds.length).toBeGreaterThan(0);
    expect(backgrounds.filter((value) => value === "transparent" || value === "none")).toEqual([]);
  });

  it("o vidro só liga com backdrop-filter e color-mix juntos", () => {
    expect(GLASS_CSS).toMatch(/@supports \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\) and \(color: color-mix\(/);
  });

  it("não usa cor literal nem medida literal: tudo vem de token", () => {
    const declarations = GLASS_CSS.replace(/\/\*[\s\S]*?\*\//g, "");

    expect(declarations).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/);
    expect(declarations).not.toMatch(/(?<![\w.-])\d*\.?\d+(?:rem|em)\b/);
  });

  it("toda transição fica dentro de prefers-reduced-motion: no-preference", () => {
    const beforeMotionQuery = GLASS_CSS.slice(0, GLASS_CSS.indexOf("@media (prefers-reduced-motion: no-preference)"));

    expect(GLASS_CSS).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(beforeMotionQuery).not.toMatch(/\btransition\s*:/);
  });
});
