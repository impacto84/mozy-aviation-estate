/**
 * Dublês de navegador para os testes do hero em jsdom: IntersectionObserver,
 * ResizeObserver, matchMedia, readyState e Save-Data. Só para arquivos *.test.*.
 */

import { vi } from "vitest";

type MotionListener = (event: { readonly matches: boolean }) => void;

export interface HeroTestEnvironmentOptions {
  readonly isReducedMotion?: boolean;
  readonly isSaveData?: boolean;
}

export interface HeroTestEnvironment {
  readonly enterView: () => void;
  readonly setReducedMotion: (isReduced: boolean) => void;
  readonly triggerResize: () => void;
  /** Cumpre as quatro condições de início (load, viewport, frame, ócio). Requer timers falsos. */
  readonly activate: () => void;
}

interface ObserverCallbacks {
  readonly intersection: IntersectionObserverCallback[];
  readonly resize: ResizeObserverCallback[];
}

function stubObservers(): ObserverCallbacks {
  const callbacks: ObserverCallbacks = { intersection: [], resize: [] };
  class FakeIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      callbacks.intersection.push(callback);
    }

    observe(): void {}

    disconnect(): void {}
  }
  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callbacks.resize.push(callback);
    }

    observe(): void {}

    disconnect(): void {}
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  return callbacks;
}

function stubReducedMotion(isReducedInitially: boolean): (isReduced: boolean) => void {
  const listeners = new Set<MotionListener>();
  const media = { matches: isReducedInitially };
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return media.matches;
    },
    addEventListener: (_type: string, listener: MotionListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MotionListener) => listeners.delete(listener),
  }));
  return (isReduced) => {
    media.matches = isReduced;
    for (const listener of listeners) {
      listener({ matches: isReduced });
    }
  };
}

export function installHeroTestEnvironment(options: HeroTestEnvironmentOptions = {}): HeroTestEnvironment {
  const callbacks = stubObservers();
  const setReducedMotion = stubReducedMotion(options.isReducedMotion ?? false);
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: options.isSaveData ?? false },
  });
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "complete" });

  const enterView = (): void => {
    for (const callback of callbacks.intersection) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  };
  return {
    enterView,
    setReducedMotion,
    triggerResize() {
      for (const callback of callbacks.resize) {
        callback([], {} as ResizeObserver);
      }
    },
    activate() {
      enterView();
      vi.runAllTimers();
    },
  };
}

export function resetHeroTestEnvironment(): void {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "connection");
  Reflect.deleteProperty(document, "readyState");
  document.body.replaceChildren();
}

/** Host com as quatro cores da paleta em custom properties, como o CSS do hero entrega. */
export function createStageHost(colors: Readonly<Record<string, string>> = DEFAULT_HOST_COLORS): HTMLDivElement {
  const host = document.createElement("div");
  for (const [name, value] of Object.entries(colors)) {
    host.style.setProperty(name, value);
  }
  document.body.append(host);
  return host;
}

export const DEFAULT_HOST_COLORS: Readonly<Record<string, string>> = {
  "--hero-color-base": "#ffffff",
  "--hero-color-soft": "#8080ff",
  "--hero-color-accent": "#0000ff",
  "--hero-color-ink": "#000000",
};

export const FAKE_TIMER_TARGETS = ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] as const;
