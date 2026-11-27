/**
 * Ciclo de vida comum a todo hero com canvas. Não sabe nada de ogl nem de three:
 * recebe uma função `render` e decide quando ela roda.
 *
 *   espera o pôster pintar (activation) -> "loading"
 *   attach(render): desenha o primeiro frame -> "live" (ou "still" com movimento reduzido)
 *   suspend(): contexto perdido -> "fallback" até um novo attach
 *   fail(): fallback definitivo, com o motivo
 *
 * O laço é o de `createSceneClock`: um por cena, parado fora da viewport, com a
 * aba oculta, com movimento reduzido e quando o visitante pausa.
 */

import { createSceneClock } from "@/lib/motion/scene-clock";
import type { FrameScheduler } from "@/lib/motion/clock";
import type { SceneClock } from "@/lib/motion/scene-clock";
import { waitForHeroStart } from "./activation";
import type { SceneRender } from "./scene-contract";
import { trackScrollProgress } from "./scroll-progress";
import type { ProgressSource } from "./scroll-progress";
import { HERO_FALLBACK_EVENT } from "./status";
import type { HeroFallbackDetail, HeroFallbackReason, HeroPhase, HeroStatus } from "./status";
import { readSaveData } from "./support";

/** Instante (s) do frame parado: longe do zero para a cena já estar "aberta". */
const DEFAULT_STILL_TIME_SECONDS = 12;

export interface StageRuntimeOptions {
  /** Sempre chamado de forma assíncrona em relação à criação: seguro para `setState`. */
  readonly onStatus: (status: HeroStatus) => void;
  /** Fonte externa de progresso de rolagem. Sem ela, o runtime mede a rolagem do próprio host. */
  readonly progress?: ProgressSource;
  readonly stillTime?: number;
  /**
   * Relógio compartilhado da página (o do `ScrollProvider`). Sem ele, a cena usa o
   * próprio `requestAnimationFrame`. Com rolagem suave na página, passe sempre:
   * dois laços para a mesma dobra violam o Piso P4.
   */
  readonly scheduler?: FrameScheduler;
}

export interface StageRuntime {
  /** `true` quando a cena pode ser carregada; `false` se o hero fica no pôster (Save-Data, desmontado). */
  readonly whenActive: Promise<boolean>;
  readonly progress: ProgressSource;
  readonly attach: (render: SceneRender) => void;
  readonly suspend: () => void;
  readonly fail: (reason: HeroFallbackReason, error: unknown) => void;
  /** Redesenha no tempo atual (depois de um resize, por exemplo). */
  readonly redraw: () => void;
  readonly setPlaying: (isPlaying: boolean) => void;
  readonly dispose: () => void;
}

/** Métodos em arrow function: podem ser repassados soltos (ponte para a cena React) sem perder o `this`. */
class HeroStageRuntime implements StageRuntime {
  readonly whenActive: Promise<boolean>;
  readonly progress: ProgressSource;
  readonly setPlaying: (isPlaying: boolean) => void;
  private readonly clock: SceneClock;
  private readonly stopTracking: () => void;
  private readonly cancelStart: () => void;
  private resolveActive: (isActive: boolean) => void = () => undefined;
  private render: SceneRender | null = null;
  private isClosed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: StageRuntimeOptions,
  ) {
    const tracker = options.progress === undefined ? trackScrollProgress(host) : null;
    this.progress = options.progress ?? tracker?.source ?? { current: 0 };
    this.stopTracking = tracker?.stop ?? (() => undefined);
    this.clock = createSceneClock(host, {
      initialTime: options.stillTime ?? DEFAULT_STILL_TIME_SECONDS,
      onFrame: (frame) => this.render?.({ time: frame.time, delta: frame.delta, progress: this.progress.current }),
      onError: (error) => this.fail("scene-error", error),
      onMotionPreferenceChange: (isMotionAllowed) => this.handleMotionPreference(isMotionAllowed),
      scheduler: options.scheduler,
    });
    this.setPlaying = this.clock.setPlaying;
    this.whenActive = new Promise<boolean>((resolve) => {
      this.resolveActive = resolve;
    });
    this.cancelStart = waitForHeroStart(host, () => this.handleStart());
  }

  readonly attach = (nextRender: SceneRender): void => {
    if (this.isClosed) {
      return;
    }
    this.render = nextRender;
    // Primeiro frame antes de anunciar: o canvas só aparece com algo desenhado.
    this.clock.renderStill();
    if (this.render !== null) {
      this.emit(this.clock.isMotionAllowed() ? "live" : "still");
      this.clock.setReady(true);
    }
  };

  readonly suspend = (): void => {
    if (this.isClosed || this.render === null) {
      return;
    }
    this.render = null;
    this.clock.setReady(false);
    this.emit("fallback", "context-lost");
  };

  readonly fail = (reason: HeroFallbackReason, error: unknown): void => {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    this.render = null;
    this.clock.setReady(false);
    this.emit("fallback", reason);
    const detail: HeroFallbackDetail = { reason, error };
    this.host.dispatchEvent(new CustomEvent(HERO_FALLBACK_EVENT, { bubbles: true, detail }));
  };

  readonly redraw = (): void => {
    if (this.render !== null) {
      this.clock.renderStill();
    }
  };

  readonly dispose = (): void => {
    this.isClosed = true;
    this.render = null;
    this.cancelStart();
    this.resolveActive(false);
    this.stopTracking();
    this.clock.dispose();
  };

  private emit(phase: HeroPhase, reason: HeroFallbackReason | null = null): void {
    this.options.onStatus({ phase, reason });
  }

  private handleMotionPreference(isMotionAllowed: boolean): void {
    if (this.render !== null) {
      this.emit(isMotionAllowed ? "live" : "still");
    }
  }

  private handleStart(): void {
    if (readSaveData(this.host.ownerDocument.defaultView?.navigator)) {
      this.fail("save-data", null);
      this.resolveActive(false);
      return;
    }
    this.emit("loading");
    this.resolveActive(true);
  }
}

export function createStageRuntime(host: HTMLElement, options: StageRuntimeOptions): StageRuntime {
  return new HeroStageRuntime(host, options);
}
