"use client";

import "lenis/dist/lenis.css";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { MOTION_ERROR_EVENT, MotionContext } from "./MotionContext";
import type { MotionRuntime } from "./MotionContext";
import { browserScheduler, pageScheduler } from "./page-scheduler";
import type { ScrollRuntime } from "./scroll-runtime";

export interface ScrollProviderProps {
  readonly children: ReactNode;
  /** Liga a rolagem suave também em aparelho só de toque. O padrão é rolagem nativa ali. */
  readonly shouldSmoothTouch?: boolean;
}

/**
 * Motor de rolagem da página: Lenis, ScrollTrigger e as cenas contínuas no mesmo
 * relógio (o ticker do GSAP). Envolva o conteúdo da página ou do layout uma vez.
 *
 * - GSAP, ScrollTrigger e Lenis chegam em um chunk lazy, depois da hidratação:
 *   não entram no JS inicial da rota. Até chegarem, a rolagem é a nativa e as
 *   cenas rodam no `requestAnimationFrame` do navegador.
 * - `prefers-reduced-motion: reduce`: nada de Lenis; a rolagem é a nativa (Piso P1).
 * - Sem JavaScript: os filhos já vieram no HTML do servidor; nada depende deste componente para aparecer.
 * - Não guarda estado: o valor do contexto nunca muda, então não re-renderiza os filhos.
 */
export function ScrollProvider({ children, shouldSmoothTouch = false }: ScrollProviderProps) {
  const runtimeRef = useRef<ScrollRuntime | null>(null);
  const value = useMemo<MotionRuntime>(
    () => ({
      scheduler: pageScheduler,
      scrollTo: (target, options) => runtimeRef.current?.scrollTo(target, options),
    }),
    [],
  );

  useEffect(() => {
    let isCancelled = false;
    import("./scroll-runtime")
      .then((engine) => {
        if (isCancelled) {
          return;
        }
        pageScheduler.use(engine.sharedScheduler);
        runtimeRef.current = engine.startScrollRuntime({ shouldSmoothTouch });
      })
      .catch((error: unknown) => {
        pageScheduler.use(browserScheduler);
        document.dispatchEvent(new CustomEvent(MOTION_ERROR_EVENT, { detail: { error } }));
      });
    return () => {
      isCancelled = true;
      runtimeRef.current?.stop();
      runtimeRef.current = null;
      pageScheduler.use(browserScheduler);
    };
  }, [shouldSmoothTouch]);

  return <MotionContext value={value}>{children}</MotionContext>;
}
