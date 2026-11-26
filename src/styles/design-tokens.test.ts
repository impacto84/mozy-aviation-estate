// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Integridade dos tokens (Piso DESIGN-TOKENS-ONLY): todo `var(--…)` usado em
 * `src/**\/*.css` precisa existir. Um token inexistente não quebra o build: o
 * navegador só descarta a declaração em silêncio (foi assim que `--space-16`
 * sumiu e os pesos do scorecard colidiram com o texto em /terrenos).
 *
 * Regras:
 *  1. Nomes do sistema de design (prefixos abaixo) só valem se declarados em
 *     `src/styles/tokens.css` ou `src/app/globals.css`, mesmo com fallback.
 *  2. Propriedade local de um CSS Module vale se o próprio arquivo a declara.
 *  3. Gancho opcional com fallback (`var(--glass-blur, var(--space-6))`) vale.
 *  4. Propriedade escrita em tempo de execução ou contrato entre módulos só vale
 *     se estiver na lista explícita E a origem declarada realmente a escrever.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const GLOBAL_SOURCES = ["src/styles/tokens.css", "src/app/globals.css"] as const;

const DESIGN_SYSTEM_PREFIXES = [
  "--color-",
  "--font-",
  "--text-",
  "--leading-",
  "--tracking-",
  "--weight-",
  "--space-",
  "--container-",
  "--measure",
  "--column-",
  "--target-",
  "--header-",
  "--sidebar-",
  "--radius-",
  "--border-",
  "--focus-",
  "--shadow-",
  "--duration-",
  "--ease-",
  "--z-",
  "--consent-offset",
] as const;

/** Propriedade → arquivo que a escreve (style inline, setProperty ou declaração em outro módulo). */
const EXTERNAL_PROVIDERS: Readonly<Record<string, string>> = {
  "--x": "src/components/atlas/SatelliteAtlas.tsx",
  "--y": "src/components/atlas/SatelliteAtlas.tsx",
  "--share": "src/components/aviation/FleetSimulator.tsx",
  "--scrub-progress": "src/components/chapter/useFrameScrub.ts",
  "--reveal-index": "src/components/motion/Reveal.tsx",
  "--marquee-duration": "src/components/motion/marquee-runtime.ts",
  "--glass-refraction-filter": "src/components/glass/GlassBackdrop.tsx",
  "--nf-display": "src/app/fonts.ts",
  "--nf-sans": "src/app/fonts.ts",
  "--nf-mono": "src/app/fonts.ts",
  "--glass-text-muted": "src/components/glass/Glass.module.css",
  "--hero-color-base": "src/components/home/HomeHero.module.css",
  "--hero-color-soft": "src/components/home/HomeHero.module.css",
  "--hero-color-accent": "src/components/home/HomeHero.module.css",
  "--hero-color-ink": "src/components/home/HomeHero.module.css",
};

function listCss(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listCss(path);
    }
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

/** Propriedades declaradas (`--x: …`) e registradas (`@property --x`). */
function declaredIn(css: string): Set<string> {
  const clean = stripComments(css);
  const names = [...clean.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g), ...clean.matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1] ?? "");
  return new Set(names.filter((name) => name !== ""));
}

interface Reference {
  readonly name: string;
  readonly hasFallback: boolean;
}

function referencesIn(css: string): Reference[] {
  return [...stripComments(css).matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)].map((match) => ({ name: match[1] ?? "", hasFallback: match[2] === "," }));
}

const GLOBAL_TOKENS = new Set(GLOBAL_SOURCES.flatMap((path) => [...declaredIn(read(path))]));
const CSS_FILES = listCss(SRC).map((path) => relative(ROOT, path));

function isDesignSystemName(name: string): boolean {
  return DESIGN_SYSTEM_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function problemsIn(file: string): string[] {
  const css = read(file);
  const local = declaredIn(css);
  return referencesIn(css).flatMap(({ name, hasFallback }) => {
    if (GLOBAL_TOKENS.has(name)) {
      return [];
    }
    if (isDesignSystemName(name)) {
      return [`${file}: ${name} não existe em tokens.css nem em globals.css`];
    }
    if (local.has(name) || hasFallback || name in EXTERNAL_PROVIDERS) {
      return [];
    }
    return [`${file}: ${name} não é declarado em lugar nenhum`];
  });
}

describe("integridade dos tokens CSS (DESIGN-TOKENS-ONLY)", () => {
  it("encontra os arquivos de tokens e as folhas de estilo", () => {
    expect(GLOBAL_TOKENS.has("--space-4")).toBe(true);
    expect(GLOBAL_TOKENS.has("--column-kpi")).toBe(true);
    expect(CSS_FILES.length).toBeGreaterThan(10);
  });

  it.each(CSS_FILES)("%s só referencia tokens declarados", (file) => {
    expect(problemsIn(file)).toEqual([]);
  });

  it.each(Object.entries(EXTERNAL_PROVIDERS))("%s é escrita de fato pela origem declarada (%s)", (name, provider) => {
    const source = read(provider);
    const isWritten = provider.endsWith(".css") ? declaredIn(source).has(name) : source.includes(`"${name}"`);

    expect(isWritten).toBe(true);
  });

  it("acusa token do sistema inexistente, mesmo com fallback", () => {
    const sample = ".a { gap: var(--space-px, var(--border-width)); padding: var(--space-4); }";
    const unknown = referencesIn(sample).filter(({ name }) => !GLOBAL_TOKENS.has(name) && isDesignSystemName(name));

    expect(unknown.map(({ name }) => name)).toEqual(["--space-px"]);
  });
});
