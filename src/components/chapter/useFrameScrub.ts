"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { MOTION_ERROR_EVENT } from "@/components/motion/MotionContext";
import {
  captionPhase,
  coverRect,
  frameIndexFor,
  frameUrl,
  frameWidthFor,
  nearestLoaded,
  sampledFrames,
} from "@/lib/chapters";
import type { ChapterSource } from "@/lib/chapters";
import { createFrameLoader } from "./frame-loader";
import type { FrameLoader } from "./frame-loader";

export type ScrubMode = "still" | "scrub";

interface FrameScrubOptions {
  readonly chapter: ChapterSource;
  readonly trackRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly hudRef: RefObject<HTMLDivElement | null>;
}

const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";
const LOAD_CONCURRENCY = 6;
/** Quadros decodificados de cada lado da posição atual (memória limitada). */
const DECODE_WINDOW = 8;
const PRELOAD_MARGIN = "60% 0px";
const MAX_PIXEL_RATIO = 2;

interface ScrubElements {
  readonly track: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly hud: HTMLDivElement;
}

/** Desenha o quadro do progresso atual. Estado mutável só aqui dentro (fora do React). */
function createPainter(elements: ScrubElements, chapter: ChapterSource, frames: readonly number[]) {
  let loader: FrameLoader | null = null;
  let progress = 0;
  let lastDrawn = -1;
  const counter = elements.hud.querySelector<HTMLElement>("[data-scrub-counter]");
  const meter = elements.hud.querySelector<HTMLElement>("[data-scrub-meter]");

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
    if (counter !== null) {
      counter.textContent = `QDR ${String(frames[index] ?? 0).padStart(3, "0")}/${chapter.count}`;
    }
  };

  return {
    setLoader: (next: FrameLoader) => {
      loader = next;
    },
    setProgress: (next: number) => {
      progress = next;
      elements.hud.dataset.phase = captionPhase(next);
      meter?.style.setProperty("--scrub-progress", next.toFixed(4));
      draw();
    },
    redraw: () => {
      lastDrawn = -1;
      draw();
    },
    draw,
    dispose: () => {
      loader?.dispose();
      loader = null;
      delete elements.canvas.dataset.ready;
      delete elements.hud.dataset.phase;
    },
  };
}

type ScrubRefs = Omit<FrameScrubOptions, "chapter">;

function resolveElements(refs: ScrubRefs): ScrubElements | null {
  const track = refs.trackRef.current;
  const canvas = refs.canvasRef.current;
  const hud = refs.hudRef.current;
  const context = canvas?.getContext("2d") ?? null;
  return track === null || canvas === null || hud === null || context === null ? null : { track, canvas, context, hud };
}

/**
 * Liga o scrub de quadros: mede o canvas, carrega os quadros quando a seção se
 * aproxima e desenha conforme o progresso do ScrollTrigger. Devolve o modo
 * (`still` até hidratar e com movimento reduzido).
 */
export function useFrameScrub(options: FrameScrubOptions): ScrubMode {
  const [mode, setMode] = useState<ScrubMode>("still");
  const { chapter, trackRef, canvasRef, hudRef } = options;

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
    const elements = resolveElements({ trackRef, canvasRef, hudRef });
    if (elements === null) {
      return undefined;
    }
    const frames = sampledFrames(chapter, window.innerWidth);
    const painter = createPainter(elements, chapter, frames);

    const resizeObserver = new ResizeObserver(() => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      elements.canvas.width = Math.round(elements.canvas.clientWidth * ratio);
      elements.canvas.height = Math.round(elements.canvas.clientHeight * ratio);
      painter.redraw();
    });
    resizeObserver.observe(elements.canvas);

    const startLoading = (): void => {
      const width = frameWidthFor(elements.canvas.clientWidth, window.devicePixelRatio || 1);
      const urls = frames.map((frame) => frameUrl(chapter.dir, frame, width));
      const targetWidth = Math.min(Math.max(elements.canvas.width, 1), width);
      painter.setLoader(
        createFrameLoader({ urls, concurrency: LOAD_CONCURRENCY, targetWidth, window: DECODE_WINDOW, onFrame: () => painter.draw() }),
      );
    };
    const intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          intersection.disconnect();
          startLoading();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    intersection.observe(elements.track);

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
      intersection.disconnect();
      resizeObserver.disconnect();
      painter.dispose();
    };
  }, [chapter, mode, trackRef, canvasRef, hudRef]);

  return mode;
}
