/**
 * Breakpoints e larguras de verificação do FORJA (CONSTITUTION.md, seção 4).
 * Fonte única em TypeScript: testes, playwright.config.ts e scripts leem daqui.
 * Em CSS use os números literais (media query não aceita var()).
 */

export type ViewportName = "desktop" | "tablet" | "phone";

export interface ViewportSpec {
  readonly name: ViewportName;
  readonly width: number;
  readonly height: number;
}

/** Largura mínima (px) em que cada faixa começa. Abaixo de `tabletMin` é phone. */
export const BREAKPOINTS = {
  tabletMin: 768,
  desktopMin: 1200,
} as const;

/** Viewports em que toda verificação visual roda. */
export const VIEWPORTS: readonly ViewportSpec[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 810, height: 1080 },
  { name: "phone", width: 390, height: 844 },
];

export function viewportClass(width: number): ViewportName {
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError(`Largura de viewport inválida: ${String(width)}. Esperado número positivo finito.`);
  }
  if (width >= BREAKPOINTS.desktopMin) {
    return "desktop";
  }
  if (width >= BREAKPOINTS.tabletMin) {
    return "tablet";
  }
  return "phone";
}
