/**
 * Cola entre as regras de `src/lib/motion/` e as bibliotecas de verdade: GSAP,
 * ScrollTrigger e Lenis. É o único arquivo do motor que importa as três.
 *
 * Tudo aqui roda dentro de efeito ou handler, nunca no render nem no servidor.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { FrameScheduler } from "@/lib/motion/clock";
import { prefersReducedMotion, watchReducedMotion } from "@/lib/motion/reduced-motion";
import { shouldSmoothScroll, startSmoothScroll, watchContentResize } from "@/lib/motion/scroll-engine";
import type { SmoothScroll } from "@/lib/motion/scroll-engine";
import { silenceKeepAlive } from "@/lib/motion/scroll-trigger";
import { createTickerScheduler } from "@/lib/motion/ticker-scheduler";
import type { ScrollTarget, ScrollToOptions } from "./MotionContext";

export interface ScrollRuntimeOptions {
  /** Liga o Lenis também em aparelho só de toque. O padrão é rolagem nativa ali. */
  readonly shouldSmoothTouch?: boolean;
  /** Suavização do Lenis (0..1). Menor é mais "pesado". */
  readonly lerp?: number;
}

export interface ScrollRuntime {
  readonly isSmooth: () => boolean;
  readonly scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
  readonly stop: () => void;
}

const TOUCH_ONLY_QUERY = "(hover: none) and (pointer: coarse)";
const DEFAULT_LERP = 0.1;
/**
 * De quantos em quantos frames o GSAP confere se pode desligar o ticker. O padrão
 * (120) deixa o laço girando até 2 s depois do último tween ou da última cena.
 */
const TICKER_IDLE_CHECK_FRAMES = 10;

/** Relógio compartilhado: toda cena contínua sob o `ScrollProvider` roda neste agendador. */
export const sharedScheduler: FrameScheduler = createTickerScheduler(gsap.ticker);

let isScrollTriggerReady = false;

/**
 * Registra o ScrollTrigger uma vez, sem o laço de keep-alive dele (ver
 * `src/lib/motion/scroll-trigger.ts`). Chame dentro de um efeito, antes de criar
 * qualquer trigger. Nunca use `gsap.registerPlugin(ScrollTrigger)` direto.
 */
export function ensureScrollTrigger(): typeof ScrollTrigger {
  if (isScrollTriggerReady) {
    return ScrollTrigger;
  }
  isScrollTriggerReady = true;
  gsap.config({ autoSleep: TICKER_IDLE_CHECK_FRAMES });
  silenceKeepAlive(window, (hasCaptured) => {
    gsap.registerPlugin(ScrollTrigger);
    if (!hasCaptured()) {
      // Alguém registrou antes (outro módulo, HMR): religa para capturar o laço que já roda.
      ScrollTrigger.disable(false);
      ScrollTrigger.enable();
    }
  });
  return ScrollTrigger;
}

function isTouchOnlyDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(TOUCH_ONLY_QUERY).matches;
}

/** Rolagem nativa. Seletor que não acha elemento não rola: é o mesmo comportamento do Lenis. */
function scrollNatively(target: ScrollTarget, options: ScrollToOptions): void {
  const behavior: ScrollBehavior = options.immediate === true || prefersReducedMotion() ? "auto" : "smooth";
  const offset = options.offset ?? 0;
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior });
    return;
  }
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (element === null) {
    return;
  }
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + offset, behavior });
}

/**
 * Liga o motor: ScrollTrigger sem laço próprio, Lenis no ticker do GSAP quando a
 * página pode ter rolagem suave, e refresh dos triggers quando a altura do
 * conteúdo muda. Acompanha `prefers-reduced-motion` com a página aberta.
 */
export function startScrollRuntime(options: ScrollRuntimeOptions = {}): ScrollRuntime {
  const scrollTrigger = ensureScrollTrigger();
  let smooth: SmoothScroll<Lenis> | null = null;

  const stopSmooth = (): void => {
    smooth?.stop();
    smooth = null;
  };
  const stopWatchingMotion = watchReducedMotion((isReducedMotion) => {
    stopSmooth();
    const environment = { isReducedMotion, isTouchOnly: isTouchOnlyDevice(), shouldSmoothTouch: options.shouldSmoothTouch };
    if (shouldSmoothScroll(environment)) {
      smooth = startSmoothScroll({
        ticker: gsap.ticker,
        createScroller: () => new Lenis({ autoRaf: false, anchors: true, lerp: options.lerp ?? DEFAULT_LERP }),
        onScroll: scrollTrigger.update,
        page: document,
      });
    }
  });
  const stopWatchingContent = watchContentResize(document.body, () => scrollTrigger.refresh());

  return {
    isSmooth: () => smooth !== null,
    scrollTo(target, scrollOptions = {}) {
      if (smooth === null) {
        scrollNatively(target, scrollOptions);
        return;
      }
      smooth.scroller.scrollTo(target, { offset: scrollOptions.offset, immediate: scrollOptions.immediate });
    },
    stop() {
      stopWatchingMotion();
      stopWatchingContent();
      stopSmooth();
    },
  };
}
