/**
 * Timeline declarativa: uma tabela de cenas com janela `[from, to]` e curva.
 *
 * Não há máquina de estados nem `setTimeout`. Um relógio entrega o progresso `p`
 * do laço (0..1) e `sample(p)` devolve o progresso local de cada cena, já com a curva.
 * O visual inteiro é função pura desse quadro, então:
 *   - o laço fecha sozinho (p volta a 0 e tudo volta junto);
 *   - qualquer instante pode ser desenhado isolado (frame parado, teste, scrubber);
 *   - duas cenas nunca ficam em estados incoerentes, porque não guardam estado.
 *
 *   const timeline = defineTimeline({
 *     duration: 12,
 *     scenes: { type: { from: 1, to: 3, ease: "inOutCubic" }, send: { from: 3.2, to: 3.6, ease: "outQuart" } },
 *   });
 *   const frame = timeline.sample(loopProgress(clockSeconds, timeline.duration));
 *   frame.type; // 0..1
 */

import { clamp01, resolveEasing, smoothstep, windowProgress } from "./easing";
import type { EasingFunction, EasingName } from "./easing";

/** Janela de uma cena, em segundos desde o início do laço. */
export interface SceneWindow {
  readonly from: number;
  readonly to: number;
  /** Curva aplicada ao progresso local. Sem ela, linear. */
  readonly ease?: EasingName | EasingFunction;
}

export interface TimelineSpec<Scene extends string> {
  /** Duração de um laço, em segundos. */
  readonly duration: number;
  readonly scenes: Readonly<Record<Scene, SceneWindow>>;
}

/** Progresso local (0..1, já com a curva; `outBack` pode passar de 1) de cada cena em um instante. */
export type TimelineFrame<Scene extends string> = Readonly<Record<Scene, number>>;

export interface Timeline<Scene extends string> {
  readonly duration: number;
  readonly sceneNames: readonly Scene[];
  /** Quadro no progresso `p` do laço (0..1). */
  readonly sample: (p: number) => TimelineFrame<Scene>;
  /** Progresso de uma cena só. */
  readonly progressOf: (scene: Scene, p: number) => number;
  /** Progresso do laço (0..1) em que a cena começa e termina: útil para amarrar outra pista. */
  readonly span: (scene: Scene) => readonly [number, number];
}

interface ResolvedScene {
  readonly from: number;
  readonly to: number;
  readonly ease: EasingFunction;
}

function assertValidDuration(duration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError(`defineTimeline: \`duration\` inválida (${String(duration)}). Use segundos, maior que zero.`);
  }
}

function resolveScene(name: string, window: SceneWindow, duration: number): ResolvedScene {
  const { from, to } = window;
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to > duration || !(to > from)) {
    throw new RangeError(
      `defineTimeline: cena "${name}" com janela inválida [${String(from)}, ${String(to)}]. Use 0 <= from < to <= ${String(duration)}.`,
    );
  }
  return { from, to, ease: resolveEasing(window.ease) };
}

export function defineTimeline<Scene extends string>(spec: TimelineSpec<Scene>): Timeline<Scene> {
  assertValidDuration(spec.duration);
  const sceneNames = Object.keys(spec.scenes) as Scene[];
  if (sceneNames.length === 0) {
    throw new RangeError("defineTimeline: informe ao menos uma cena em `scenes`.");
  }
  const resolved = new Map<Scene, ResolvedScene>(
    sceneNames.map((name) => [name, resolveScene(name, spec.scenes[name], spec.duration)]),
  );
  const sceneOf = (scene: Scene): ResolvedScene => {
    const found = resolved.get(scene);
    if (found === undefined) {
      throw new RangeError(`Timeline: cena desconhecida "${scene}". Declaradas: ${sceneNames.join(", ")}.`);
    }
    return found;
  };
  const progressOf = (scene: Scene, p: number): number => {
    const { from, to, ease } = sceneOf(scene);
    const local = windowProgress(clamp01(p) * spec.duration, from, to);
    // Pontas exatas: cena que não começou vale 0 e cena terminada vale 1, sem resíduo de ponto flutuante.
    return local === 0 || local === 1 ? local : ease(local);
  };
  return {
    duration: spec.duration,
    sceneNames,
    progressOf,
    sample: (p) => Object.fromEntries(sceneNames.map((name) => [name, progressOf(name, p)])) as TimelineFrame<Scene>,
    span: (scene) => {
      const { from, to } = sceneOf(scene);
      return [from / spec.duration, to / spec.duration];
    },
  };
}

/** Progresso do laço (0..1) a partir do tempo do relógio: o módulo é o que faz o laço. */
export function loopProgress(elapsedSeconds: number, durationSeconds: number): number {
  assertValidDuration(durationSeconds);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return 0;
  }
  return (elapsedSeconds % durationSeconds) / durationSeconds;
}

export interface LoopFadeOptions {
  /** Fração do laço gasta entrando (0..0.5). */
  readonly fadeIn: number;
  /** Fração do laço gasta saindo (0..0.5). */
  readonly fadeOut: number;
}

/**
 * Opacidade do palco nas pontas do laço: em vez de corte seco quando `p` volta a 0,
 * o palco some no fim e reaparece no começo.
 */
export function loopFade(p: number, options: LoopFadeOptions): number {
  const { fadeIn, fadeOut } = options;
  const isValid = (fraction: number): boolean => Number.isFinite(fraction) && fraction > 0 && fraction <= 0.5;
  if (!isValid(fadeIn) || !isValid(fadeOut)) {
    throw new RangeError(`loopFade: frações inválidas (${String(fadeIn)}, ${String(fadeOut)}). Use valores entre 0 e 0,5.`);
  }
  const progress = clamp01(p);
  return Math.min(smoothstep(0, fadeIn, progress), 1 - smoothstep(1 - fadeOut, 1, progress));
}
