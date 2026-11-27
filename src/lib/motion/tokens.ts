/**
 * Tokens de movimento em TypeScript. Espelham `src/styles/tokens.css`
 * (`--duration-*`, `--ease-*`); o teste ao lado lê o CSS e falha se os dois divergirem.
 *
 * Em CSS use os custom properties. Aqui ficam os mesmos valores para o que roda
 * em JS: tweens do GSAP (`duration` em segundos, `ease` como função) e timelines.
 */

import { cubicBezier } from "./easing";
import type { EasingFunction } from "./easing";

export type BezierPoints = readonly [number, number, number, number];

const MS_PER_SECOND = 1000;

/** `--duration-fast`, `--duration-base`, `--duration-slow`, em milissegundos. */
export const MOTION_DURATION_MS = {
  fast: 160,
  base: 320,
  slow: 720,
} as const;

export type MotionDurationName = keyof typeof MOTION_DURATION_MS;

/** `--ease-out` e `--ease-in-out`, como pontos de `cubic-bezier()`. */
export const MOTION_EASE_POINTS = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const satisfies Readonly<Record<string, BezierPoints>>;

export type MotionEaseName = keyof typeof MOTION_EASE_POINTS;

/** As curvas dos tokens como função: passe em `ease` do GSAP ou em uma janela de timeline. */
export const MOTION_EASE: Readonly<Record<MotionEaseName, EasingFunction>> = {
  out: cubicBezier(...MOTION_EASE_POINTS.out),
  inOut: cubicBezier(...MOTION_EASE_POINTS.inOut),
};

/** Intervalo entre irmãos que entram em sequência (reveal em grade, chips). */
export const MOTION_STAGGER_MS = 70;

/** Duração do token em segundos, a unidade do GSAP e das timelines. */
export function durationSeconds(name: MotionDurationName): number {
  return MOTION_DURATION_MS[name] / MS_PER_SECOND;
}

/** O token como texto de CSS, para estilo inline calculado (`transition-timing-function`). */
export function cssCubicBezier(name: MotionEaseName): string {
  return `cubic-bezier(${MOTION_EASE_POINTS[name].join(", ")})`;
}
