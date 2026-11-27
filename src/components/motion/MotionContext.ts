"use client";

import { createContext, useContext } from "react";
import type { FrameScheduler } from "@/lib/motion/clock";

export type ScrollTarget = string | number | HTMLElement;

export interface ScrollToOptions {
  /** Deslocamento em px somado ao destino (negativo para compensar cabeçalho fixo). */
  readonly offset?: number;
  /** Pula a animação. */
  readonly immediate?: boolean;
}

/** O que o `ScrollProvider` entrega aos componentes de cliente abaixo dele. */
export interface MotionRuntime {
  /**
   * Relógio compartilhado da página (o `gsap.ticker`). Passe em
   * `createSceneClock(el, { scheduler })` para a cena não abrir um segundo laço de frames (Piso P4).
   */
  readonly scheduler: FrameScheduler;
  /** Rola até um seletor, elemento ou posição, com Lenis quando ele está ligado e nativo quando não. */
  readonly scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
}

/** Disparado no `document` quando o motor (chunk lazy com GSAP e Lenis) não carrega. A página segue com rolagem nativa. */
export const MOTION_ERROR_EVENT = "forja:motion-error";

export const MotionContext = createContext<MotionRuntime | null>(null);

/** `null` fora de um `ScrollProvider`. */
export function useMotionRuntime(): MotionRuntime | null {
  return useContext(MotionContext);
}

/**
 * Agendador de frames da página, ou `undefined` fora de um `ScrollProvider`.
 * `undefined` faz `createClock` usar o próprio `requestAnimationFrame`: continua sendo um laço por cena.
 */
export function useMotionScheduler(): FrameScheduler | undefined {
  return useContext(MotionContext)?.scheduler;
}
