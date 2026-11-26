/**
 * Relógio de uma cena contínua (canvas WebGL, simulador, fundo animado) já ligado
 * às três condições do Piso:
 *
 *   P1  `prefers-reduced-motion: reduce` -> o laço não roda (use `renderStill` para um frame parado);
 *   P4  um relógio por cena               -> um único laço, o de `createClock`;
 *   P5  fora da viewport ou aba oculta    -> o laço para e retoma sozinho.
 *
 * Uso dentro de um efeito:
 *
 *   const clock = createSceneClock(section, { onFrame: ({ time }) => scene.render(time) });
 *   clock.setReady(true);        // cena criada, primeiro frame possível
 *   return () => clock.dispose();
 *
 * `onFrame` roda fora do React: grave em ref, uniform ou custom property, nunca em estado (P6).
 */

import { createClock } from "./clock";
import type { FrameCallback, FrameScheduler } from "./clock";
import { watchReducedMotion } from "./reduced-motion";
import { watchVisibility } from "./visibility";

type SceneGate = "ready" | "in-view" | "page-visible" | "motion-allowed" | "playing";

const SCENE_GATES: readonly SceneGate[] = ["ready", "in-view", "page-visible", "motion-allowed", "playing"];

export interface SceneClockOptions {
  readonly onFrame: FrameCallback;
  /** Erro lançado por `onFrame`: o relógio para e quem chama mostra o fallback. */
  readonly onError?: (error: unknown) => void;
  /** Avisa o valor inicial e cada troca de `prefers-reduced-motion` (`true` = pode animar). */
  readonly onMotionPreferenceChange?: (isMotionAllowed: boolean) => void;
  /** Margem do `IntersectionObserver`. O padrão é a viewport exata. */
  readonly rootMargin?: string;
  /** Tempo inicial em segundos; é o instante do frame parado de `renderStill`. */
  readonly initialTime?: number;
  readonly scheduler?: FrameScheduler;
}

export interface SceneClock {
  /** A cena existe e pode desenhar. Feche de novo quando o contexto GL se perder. */
  readonly setReady: (isReady: boolean) => void;
  /** Pausa e retomada pedidas pelo visitante (botão de pausar). */
  readonly setPlaying: (isPlaying: boolean) => void;
  readonly isRunning: () => boolean;
  readonly isMotionAllowed: () => boolean;
  readonly time: () => number;
  /** Um frame no tempo atual, sem ligar o laço: frame estático, resize em pausa, contexto restaurado. */
  readonly renderStill: () => void;
  readonly dispose: () => void;
}

export function createSceneClock(target: Element, options: SceneClockOptions): SceneClock {
  const clock = createClock<SceneGate>({
    gates: SCENE_GATES,
    onFrame: options.onFrame,
    onError: options.onError,
    scheduler: options.scheduler,
    initialTime: options.initialTime,
  });
  let isMotionAllowed = true;
  clock.setGate("playing", true);

  const stopVisibility = watchVisibility(
    target,
    ({ isInView, isPageVisible }) => {
      clock.setGate("in-view", isInView);
      clock.setGate("page-visible", isPageVisible);
    },
    { rootMargin: options.rootMargin },
  );
  const stopMotion = watchReducedMotion((isReduced) => {
    isMotionAllowed = !isReduced;
    clock.setGate("motion-allowed", isMotionAllowed);
    options.onMotionPreferenceChange?.(isMotionAllowed);
  });

  return {
    setReady: (isReady) => clock.setGate("ready", isReady),
    setPlaying: (isPlaying) => clock.setGate("playing", isPlaying),
    isRunning: clock.isRunning,
    isMotionAllowed: () => isMotionAllowed,
    time: clock.time,
    renderStill: clock.renderStill,
    dispose() {
      stopVisibility();
      stopMotion();
      clock.dispose();
    },
  };
}
