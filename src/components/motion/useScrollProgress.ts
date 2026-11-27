"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { MOTION_ERROR_EVENT } from "./MotionContext";

export interface ScrollProgressOptions {
  /** Início e fim no formato do ScrollTrigger. O padrão cobre a travessia do elemento pela viewport. */
  readonly start?: string;
  readonly end?: string;
  /** Custom property escrita no elemento com o progresso (0..1). */
  readonly cssVariable?: string;
}

/** Objeto estável com o progresso atual. Leia `current` dentro do laço de frames de uma cena, nunca no render. */
export interface ScrollProgress {
  readonly current: number;
}

const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";
const DEFAULT_START = "top bottom";
const DEFAULT_END = "bottom top";
const DEFAULT_VARIABLE = "--scroll-progress";
const PROGRESS_DIGITS = 4;

/**
 * Progresso de rolagem de um elemento (0..1), medido pelo ScrollTrigger no mesmo
 * frame do Lenis. O valor vai para uma custom property e para um objeto estável;
 * nunca para estado do React (Piso P6).
 *
 * O GSAP é carregado dentro do efeito (chunk lazy). Com movimento reduzido, sem
 * JavaScript ou antes de o chunk chegar, a custom property não existe: escreva o
 * CSS com o estado final como padrão, `var(--scroll-progress, 1)`.
 */
export function useScrollProgress(targetRef: RefObject<HTMLElement | null>, options: ScrollProgressOptions = {}): ScrollProgress {
  const progressRef = useRef(0);
  const { start = DEFAULT_START, end = DEFAULT_END, cssVariable = DEFAULT_VARIABLE } = options;

  useEffect(() => {
    const target = targetRef.current;
    if (target === null) {
      return undefined;
    }
    let revert: (() => void) | null = null;
    let isCancelled = false;
    Promise.all([import("gsap"), import("./scroll-runtime")])
      .then(([{ gsap }, engine]) => {
        if (isCancelled) {
          return;
        }
        const scrollTrigger = engine.ensureScrollTrigger();
        const media = gsap.matchMedia();
        media.add(MOTION_ALLOWED_QUERY, () => {
          const trigger = scrollTrigger.create({
            trigger: target,
            start,
            end,
            onUpdate: (self) => {
              progressRef.current = self.progress;
              target.style.setProperty(cssVariable, self.progress.toFixed(PROGRESS_DIGITS));
            },
          });
          return () => {
            trigger.kill();
            target.style.removeProperty(cssVariable);
          };
        });
        revert = () => media.revert();
      })
      .catch((error: unknown) => {
        document.dispatchEvent(new CustomEvent(MOTION_ERROR_EVENT, { detail: { error } }));
      });
    return () => {
      isCancelled = true;
      revert?.();
    };
  }, [targetRef, start, end, cssVariable]);

  return progressRef;
}
