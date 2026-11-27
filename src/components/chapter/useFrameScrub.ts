"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { MOTION_ERROR_EVENT } from "@/components/motion/MotionContext";
import {
  captionPhase,
  clampProgress,
  coverRect,
  decodeWidthFor,
  frameCounter,
  frameIndexFor,
  frameUrl,
  nearestLoaded,
  sampledFrames,
} from "@/lib/chapters";
import type { ChapterSource } from "@/lib/chapters";
import { createFrameLoader } from "./frame-loader";
import type { FrameLoader } from "./frame-loader";

export type ScrubMode = "still" | "scrub";

interface FrameScrubOptions {
  readonly chapter: ChapterSource;
  /** Trilha alta (o ScrollTrigger mede o progresso nela). */
  readonly trackRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Palco sticky: recebe `--act-progress` e `data-phase`; contém o contador e a barra. */
  readonly stageRef: RefObject<HTMLDivElement | null>;
}

const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";
const LOAD_CONCURRENCY = 6;
/** Quadros decodificados de cada lado da posição atual (memória limitada). */
const DECODE_WINDOW = 6;
/** A partir de quando um ato `near` começa a baixar quadros. */
const PRELOAD_MARGIN = "150% 0px";
/** Fora desta margem o ato solta os bitmaps decodificados (os blobs ficam). */
const ACTIVE_MARGIN = "40% 0px";
const MAX_PIXEL_RATIO = 2;
const PROGRESS_DIGITS = 4;

interface ScrubElements {
  readonly track: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly stage: HTMLDivElement;
}

/**
 * Desenha o quadro do progresso atual. Estado mutável só aqui dentro (fora do React):
 * nada por quadro passa por `setState` (Piso P6). Nunca limpa o canvas: se o quadro
 * alvo ainda não decodificou, mantém o mais próximo já pronto (zero piscada).
 */
function createPainter(elements: ScrubElements, chapter: ChapterSource, frames: readonly number[]) {
  let loader: FrameLoader | null = null;
  let progress = 0;
  let lastDrawn = -1;
  const counter = elements.stage.querySelector<HTMLElement>("[data-scrub-counter]");

  const draw = (): void => {
    if (loader === null) {
      return;
    }
    const current = loader;
    const target = frameIndexFor(progress, frames.length);
    current.focus(target);
    const index = nearestLoaded(target, current.isDecoded, frames.length);
    const bitmap = index < 0 ? undefined : current.bitmapAt(index);
    if (bitmap === undefined || index === lastDrawn) {
      return;
    }
    const { canvas, context } = elements;
    const rect = coverRect(canvas.width, canvas.height, bitmap.width, bitmap.height);
    context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height);
    lastDrawn = index;
    canvas.dataset.ready = "true";
    canvas.dataset.frame = String(frames[index] ?? 0);
    if (counter !== null) {
      counter.textContent = frameCounter(frames[index] ?? 0, chapter.count);
    }
  };

  return {
    hasLoader: () => loader !== null,
    setLoader: (next: FrameLoader) => {
      loader = next;
      draw();
    },
    setProgress: (next: number) => {
      progress = clampProgress(next);
      elements.stage.dataset.phase = captionPhase(progress);
      elements.stage.style.setProperty("--act-progress", progress.toFixed(PROGRESS_DIGITS));
      draw();
    },
    redraw: () => {
      lastDrawn = -1;
      draw();
    },
    release: () => {
      loader?.focus(-1_000_000);
    },
    draw,
    dispose: () => {
      loader?.dispose();
      loader = null;
      delete elements.canvas.dataset.ready;
      delete elements.canvas.dataset.frame;
    },
  };
}

type ScrubRefs = Omit<FrameScrubOptions, "chapter">;

function resolveElements(refs: ScrubRefs): ScrubElements | null {
  const track = refs.trackRef.current;
  const canvas = refs.canvasRef.current;
  const stage = refs.stageRef.current;
  const context = canvas?.getContext("2d", { alpha: false }) ?? null;
  return track === null || canvas === null || stage === null || context === null ? null : { track, canvas, context, stage };
}

type Callback = () => void;

/** Dispara `start` depois do evento `load` (a pré-carga nunca disputa banda com o LCP). */
function afterPageLoad(start: Callback): Callback {
  if (document.readyState === "complete") {
    start();
    return () => undefined;
  }
  window.addEventListener("load", start, { once: true });
  return () => window.removeEventListener("load", start);
}

function sizeCanvas(canvas: HTMLCanvasElement): void {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
}

/**
 * Liga o scrub de quadros de um ato: mede o canvas (DPR <= 2), baixa os quadros
 * (Ato I logo após o `load`; os outros quando a trilha se aproxima) e desenha
 * conforme o progresso do ScrollTrigger, no relógio único do Lenis/GSAP.
 * Devolve o modo (`still` até hidratar e com movimento reduzido).
 */
export function useFrameScrub(options: FrameScrubOptions): ScrubMode {
  const [mode, setMode] = useState<ScrubMode>("still");
  const { chapter, trackRef, canvasRef, stageRef } = options;

  useEffect(() => {
    const query = window.matchMedia(MOTION_ALLOWED_QUERY);
    const sync = (): void => setMode(query.matches ? "scrub" : "still");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (mode !== "scrub") {
      return undefined;
    }
    const elements = resolveElements({ trackRef, canvasRef, stageRef });
    if (elements === null) {
      return undefined;
    }
    const frames = sampledFrames(chapter, window.innerWidth);
    const painter = createPainter(elements, chapter, frames);
    sizeCanvas(elements.canvas);

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvas(elements.canvas);
      painter.redraw();
    });
    resizeObserver.observe(elements.canvas);

    const startLoading = (): void => {
      if (painter.hasLoader()) {
        return;
      }
      const urls = frames.map((frame) => frameUrl(chapter.dir, frame));
      painter.setLoader(
        createFrameLoader({
          urls,
          concurrency: LOAD_CONCURRENCY,
          targetWidth: () => decodeWidthFor(elements.canvas.width, elements.canvas.height, chapter.width, chapter.height),
          window: DECODE_WINDOW,
          onFrame: () => painter.draw(),
        }),
      );
    };

    const cancelLoadWait = chapter.preload === "immediate" ? afterPageLoad(startLoading) : () => undefined;
    const preload = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preload.disconnect();
          startLoading();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    preload.observe(elements.track);

    const activity = new IntersectionObserver(
      (entries) => {
        if (entries.every((entry) => !entry.isIntersecting)) {
          painter.release();
        } else {
          painter.redraw();
        }
      },
      { rootMargin: ACTIVE_MARGIN },
    );
    activity.observe(elements.track);

    let revert: (() => void) | null = null;
    let isCancelled = false;
    Promise.all([import("gsap"), import("@/components/motion/scroll-runtime")])
      .then(([{ gsap }, engine]) => {
        if (isCancelled) {
          return;
        }
        const scrollTrigger = engine.ensureScrollTrigger();
        const media = gsap.matchMedia();
        media.add(MOTION_ALLOWED_QUERY, () => {
          const trigger = scrollTrigger.create({
            trigger: elements.track,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => painter.setProgress(self.progress),
          });
          painter.setProgress(trigger.progress);
          return () => trigger.kill();
        });
        revert = () => media.revert();
      })
      .catch((error: unknown) => {
        document.dispatchEvent(new CustomEvent(MOTION_ERROR_EVENT, { detail: { error } }));
      });

    return () => {
      isCancelled = true;
      revert?.();
      cancelLoadWait();
      preload.disconnect();
      activity.disconnect();
      resizeObserver.disconnect();
      painter.dispose();
    };
  }, [chapter, mode, trackRef, canvasRef, stageRef]);

  return mode;
}
