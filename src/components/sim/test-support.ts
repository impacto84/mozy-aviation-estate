/**
 * Dublês de navegador para os testes de motion e dos simuladores em jsdom:
 * IntersectionObserver, ResizeObserver, matchMedia e um agendador de frames manual.
 * Só para arquivos *.test.*; não é importado por código de produção.
 */

import { vi } from "vitest";
import type { FrameScheduler } from "@/lib/motion/clock";

type MotionListener = (event: { readonly matches: boolean }) => void;

export interface BrowserStubsOptions {
  readonly isReducedMotion?: boolean;
  /** Resposta para `(hover: none) and (pointer: coarse)`. */
  readonly isTouchOnly?: boolean;
}

export interface BrowserStubs {
  readonly enterView: () => void;
  readonly leaveView: () => void;
  readonly setReducedMotion: (isReduced: boolean) => void;
  readonly triggerResize: () => void;
  /** Observers criados e ainda não desconectados, e ouvintes de `matchMedia` ainda registrados. */
  readonly activeCounts: () => { readonly intersection: number; readonly resize: number; readonly media: number };
}

const REDUCED_MOTION_FRAGMENT = "prefers-reduced-motion";
const NO_PREFERENCE_FRAGMENT = "no-preference";

/** Classe de observer falso que registra o callback enquanto não é desconectada. */
function createObserverClass<Callback>(registry: Set<Callback>) {
  return class FakeObserver {
    constructor(private readonly callback: Callback) {
      registry.add(callback);
    }

    observe(): void {}

    unobserve(): void {}

    disconnect(): void {
      registry.delete(this.callback);
    }
  };
}

interface MediaState {
  isReduced: boolean;
}

function createMatchMedia(state: MediaState, listeners: Set<MotionListener>, isTouchOnly: boolean) {
  return (query: string) => {
    const isMotionQuery = query.includes(REDUCED_MOTION_FRAGMENT);
    const wantsMotion = query.includes(NO_PREFERENCE_FRAGMENT);
    return {
      media: query,
      get matches() {
        if (!isMotionQuery) {
          return isTouchOnly;
        }
        return wantsMotion ? !state.isReduced : state.isReduced;
      },
      addEventListener: (_type: string, listener: MotionListener) => (isMotionQuery ? listeners.add(listener) : undefined),
      removeEventListener: (_type: string, listener: MotionListener) => listeners.delete(listener),
    };
  };
}

export function installBrowserStubs(options: BrowserStubsOptions = {}): BrowserStubs {
  const intersection = new Set<IntersectionObserverCallback>();
  const resize = new Set<ResizeObserverCallback>();
  const mediaListeners = new Set<MotionListener>();
  const media: MediaState = { isReduced: options.isReducedMotion ?? false };

  vi.stubGlobal("IntersectionObserver", createObserverClass(intersection));
  vi.stubGlobal("ResizeObserver", createObserverClass(resize));
  vi.stubGlobal("matchMedia", createMatchMedia(media, mediaListeners, options.isTouchOnly ?? false));

  const notifyIntersection = (isIntersecting: boolean): void => {
    for (const callback of [...intersection]) {
      callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  };
  return {
    enterView: () => notifyIntersection(true),
    leaveView: () => notifyIntersection(false),
    setReducedMotion(isReduced) {
      media.isReduced = isReduced;
      for (const listener of [...mediaListeners]) {
        listener({ matches: isReduced });
      }
    },
    triggerResize() {
      for (const callback of [...resize]) {
        callback([], {} as ResizeObserver);
      }
    },
    activeCounts: () => ({ intersection: intersection.size, resize: resize.size, media: mediaListeners.size }),
  };
}

export function resetBrowserStubs(): void {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
}

export interface ManualScheduler {
  readonly scheduler: FrameScheduler;
  /** Roda os frames pendentes com o timestamp dado (ms). */
  readonly flush: (timestampMs: number) => void;
  readonly pendingCount: () => number;
  readonly requestCount: () => number;
}

export function createManualScheduler(): ManualScheduler {
  const pending = new Map<number, (timestampMs: number) => void>();
  let nextHandle = 1;
  let requests = 0;
  return {
    scheduler: {
      request(callback) {
        const handle = nextHandle;
        nextHandle += 1;
        requests += 1;
        pending.set(handle, callback);
        return handle;
      },
      cancel(handle) {
        pending.delete(handle);
      },
    },
    flush(timestampMs) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) {
        callback(timestampMs);
      }
    },
    pendingCount: () => pending.size,
    requestCount: () => requests,
  };
}

/** Dá tamanho de layout a um elemento em jsdom (que não faz layout). */
export function setLayoutSize(element: HTMLElement, width: number, height: number): void {
  for (const [name, value] of [
    ["clientWidth", width],
    ["offsetWidth", width],
    ["clientHeight", height],
    ["offsetHeight", height],
  ] as const) {
    Object.defineProperty(element, name, { configurable: true, get: () => value });
  }
}
