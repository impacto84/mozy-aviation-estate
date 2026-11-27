/**
 * Uniforms tipados das cenas em shader. As cores vêm da paleta lida dos tokens
 * (`palette.ts`); os números de aparência têm padrão e faixa com nome, e toda
 * sobrescrita é validada aqui.
 *
 * `value` é mutável de propósito: é o único lugar onde o valor por frame mora
 * (Piso P6: nada de estado do React por frame).
 */

import { BREAKPOINTS, viewportClass } from "@/lib/breakpoints";
import type { ViewportName } from "@/lib/breakpoints";
import { srgbToLinear } from "./palette";
import type { HeroPalette, Rgb } from "./palette";
import type { SceneSize } from "./support";

export interface Uniform<T> {
  value: T;
}

export type Resolution = readonly [number, number];

interface Range {
  readonly min: number;
  readonly max: number;
}

function clampToRange(value: number | undefined, fallback: number, range: Range): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, range.min), range.max);
}

/** Tamanho do buffer de desenho em pixels físicos. */
export function toBufferResolution(size: SceneSize): Resolution {
  return [Math.floor(size.width * size.pixelRatio), Math.floor(size.height * size.pixelRatio)];
}

/**
 * 1 quando o hero está no layout de desktop (texto à esquerda, luz à direita),
 * 0 no layout empilhado (texto em cima, luz embaixo). Usa o mesmo corte das
 * media queries do CSS, para o canvas e o pôster concordarem em qualquer largura.
 */
export function resolveSideLayout(cssWidth: number): number {
  const isValidWidth = Number.isFinite(cssWidth) && cssWidth > 0;
  return isValidWidth && viewportClass(cssWidth) === "desktop" ? 1 : 0;
}

/* Shader de faixas ---------------------------------------------------------- */

export interface ShaderHeroParams {
  /** Quantas faixas cabem na largura da tela. */
  readonly bandCount: number;
  /** Rapidez do movimento; 0 congela. */
  readonly flowSpeed: number;
  /** Amplitude do grão, em fração do branco. */
  readonly grain: number;
}

export const SHADER_HERO_DEFAULTS: ShaderHeroParams = { bandCount: 7, flowSpeed: 0.12, grain: 0.03 };

const SHADER_HERO_RANGES: Readonly<Record<keyof ShaderHeroParams, Range>> = {
  bandCount: { min: 2, max: 24 },
  flowSpeed: { min: 0, max: 1 },
  grain: { min: 0, max: 0.12 },
};

export function resolveShaderParams(overrides: Partial<ShaderHeroParams> = {}): ShaderHeroParams {
  return {
    bandCount: clampToRange(overrides.bandCount, SHADER_HERO_DEFAULTS.bandCount, SHADER_HERO_RANGES.bandCount),
    flowSpeed: clampToRange(overrides.flowSpeed, SHADER_HERO_DEFAULTS.flowSpeed, SHADER_HERO_RANGES.flowSpeed),
    grain: clampToRange(overrides.grain, SHADER_HERO_DEFAULTS.grain, SHADER_HERO_RANGES.grain),
  };
}

export type ShaderHeroUniforms = {
  readonly uTime: Uniform<number>;
  readonly uProgress: Uniform<number>;
  readonly uResolution: Uniform<Resolution>;
  readonly uSideLayout: Uniform<number>;
  /** Cores em sRGB linear: o shader mistura em linear e codifica no fim. */
  readonly uColorBase: Uniform<Rgb>;
  readonly uColorSoft: Uniform<Rgb>;
  readonly uColorAccent: Uniform<Rgb>;
  readonly uBandCount: Uniform<number>;
  readonly uFlow: Uniform<number>;
  readonly uGrain: Uniform<number>;
};

export function createShaderUniforms(
  palette: HeroPalette,
  params: ShaderHeroParams,
  size: SceneSize,
): ShaderHeroUniforms {
  return {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uResolution: { value: toBufferResolution(size) },
    uSideLayout: { value: resolveSideLayout(size.width) },
    uColorBase: { value: srgbToLinear(palette.base) },
    uColorSoft: { value: srgbToLinear(palette.soft) },
    uColorAccent: { value: srgbToLinear(palette.accent) },
    uBandCount: { value: params.bandCount },
    uFlow: { value: params.flowSpeed },
    uGrain: { value: params.grain },
  };
}

/* Campo de partículas -------------------------------------------------------- */

export interface ParticleFieldParams {
  /** Pontos por linha e por coluna da malha. O total é o produto. */
  readonly columns: number;
  readonly rows: number;
  /** Diâmetro do ponto em px de CSS a uma unidade de distância da câmera. */
  readonly pointSize: number;
  readonly waveHeight: number;
  readonly flowSpeed: number;
}

type ParticleAppearance = Omit<ParticleFieldParams, "columns" | "rows">;
type ParticleBudget = Pick<ParticleFieldParams, "columns" | "rows">;

export const PARTICLE_FIELD_DEFAULTS: ParticleAppearance = { pointSize: 24, waveHeight: 0.42, flowSpeed: 0.5 };

/** Orçamento por faixa de largura: menos pontos em tela menor (GPU de celular). */
const PARTICLE_BUDGETS: Readonly<Record<ViewportName, ParticleBudget>> = {
  phone: { columns: 56, rows: 44 },
  tablet: { columns: 84, rows: 54 },
  desktop: { columns: 128, rows: 64 },
};

export function resolveParticleParams(cssWidth: number): ParticleFieldParams {
  const isValidWidth = Number.isFinite(cssWidth) && cssWidth > 0;
  const budget = PARTICLE_BUDGETS[viewportClass(isValidWidth ? cssWidth : BREAKPOINTS.tabletMin - 1)];
  return { ...budget, ...PARTICLE_FIELD_DEFAULTS };
}

export type ParticleFieldUniforms = {
  readonly uTime: Uniform<number>;
  readonly uProgress: Uniform<number>;
  readonly uResolution: Uniform<Resolution>;
  readonly uSideLayout: Uniform<number>;
  readonly uPixelRatio: Uniform<number>;
  /** Altura da viewport do canvas em px de CSS: mantém o tamanho do ponto proporcional à tela. */
  readonly uViewportHeight: Uniform<number>;
  /** Cores em sRGB: o ponto é chapado, não há mistura que peça linear. */
  readonly uColorAccent: Uniform<Rgb>;
  readonly uColorInk: Uniform<Rgb>;
  readonly uPointSize: Uniform<number>;
  readonly uWaveHeight: Uniform<number>;
  readonly uFlow: Uniform<number>;
};

export function createParticleUniforms(
  palette: HeroPalette,
  params: ParticleFieldParams,
  size: SceneSize,
): ParticleFieldUniforms {
  return {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uResolution: { value: toBufferResolution(size) },
    uSideLayout: { value: resolveSideLayout(size.width) },
    uPixelRatio: { value: size.pixelRatio },
    uViewportHeight: { value: size.height },
    uColorAccent: { value: palette.accent },
    uColorInk: { value: palette.ink },
    uPointSize: { value: params.pointSize },
    uWaveHeight: { value: params.waveHeight },
    uFlow: { value: params.flowSpeed },
  };
}
