/**
 * Motor de rolagem suave em um relógio só (Piso P4).
 *
 * O Lenis não roda `requestAnimationFrame` próprio: quem chama `raf()` é o ticker
 * do GSAP, o mesmo que move os tweens e as cenas (`ticker-scheduler.ts`). A cada
 * passo da rolagem, o ScrollTrigger é avisado (`onScroll`). Resultado: um único
 * laço de frames na página, e rolagem, pin e scrub sempre no mesmo quadro.
 *
 * Este módulo não importa gsap nem lenis: recebe os dois por parâmetro, o que
 * mantém a regra testável sem navegador. A cola com as bibliotecas de verdade
 * está em `src/components/motion/scroll-runtime.ts`.
 */

/** O pedaço do `gsap.ticker` que o motor usa. O tempo vem em segundos. */
export interface EngineTicker {
  readonly add: (listener: (timeSeconds: number) => void) => unknown;
  readonly remove: (listener: (timeSeconds: number) => void) => unknown;
  readonly lagSmoothing: (thresholdMs: number, adjustedLagMs?: number) => unknown;
}

/** O pedaço do Lenis que o motor usa. */
export interface SmoothScroller {
  readonly raf: (timeMs: number) => void;
  readonly on: (event: "scroll", listener: () => void) => unknown;
  readonly destroy: () => void;
}

interface VisibilitySource {
  readonly hidden: boolean;
  readonly addEventListener: (type: "visibilitychange", listener: () => void) => void;
  readonly removeEventListener: (type: "visibilitychange", listener: () => void) => void;
}

export interface SmoothScrollDeps<Scroller extends SmoothScroller> {
  readonly ticker: EngineTicker;
  /** Cria o Lenis com `autoRaf: false`. */
  readonly createScroller: () => Scroller;
  /** Chamado a cada passo da rolagem suave: `ScrollTrigger.update`. */
  readonly onScroll: () => void;
  /** `document`: com a aba oculta o motor sai do ticker (Piso P5). */
  readonly page: VisibilitySource;
}

export interface SmoothScroll<Scroller extends SmoothScroller> {
  readonly scroller: Scroller;
  readonly stop: () => void;
}

export interface SmoothScrollEnvironment {
  readonly isReducedMotion: boolean;
  /** `(hover: none) and (pointer: coarse)`: aparelho só de toque. */
  readonly isTouchOnly: boolean;
  /** Liga o Lenis também em aparelho de toque. O padrão é rolagem nativa. */
  readonly shouldSmoothTouch?: boolean;
}

const MS_PER_SECOND = 1000;
/** Padrões do GSAP para `lagSmoothing`, devolvidos quando o motor para. */
const GSAP_LAG_THRESHOLD_MS = 500;
const GSAP_ADJUSTED_LAG_MS = 33;

/**
 * Decide se a página usa rolagem suave.
 *   - movimento reduzido: nunca (Piso P1);
 *   - aparelho só de toque: não por padrão. Ali o Lenis não suaviza nada e só
 *     manteria um laço de frames ligado à toa; o ScrollTrigger funciona com a rolagem nativa.
 */
export function shouldSmoothScroll(environment: SmoothScrollEnvironment): boolean {
  if (environment.isReducedMotion) {
    return false;
  }
  return !environment.isTouchOnly || environment.shouldSmoothTouch === true;
}

/** Liga o Lenis ao ticker. Devolve o scroller e a função que desfaz tudo. */
export function startSmoothScroll<Scroller extends SmoothScroller>(deps: SmoothScrollDeps<Scroller>): SmoothScroll<Scroller> {
  const { ticker, page } = deps;
  const scroller = deps.createScroller();
  let isStopped = false;

  const step = (timeSeconds: number): void => scroller.raf(timeSeconds * MS_PER_SECOND);
  const syncWithPage = (): void => {
    ticker.remove(step);
    if (!isStopped && !page.hidden) {
      ticker.add(step);
    }
  };

  scroller.on("scroll", deps.onScroll);
  // Depois de um travamento, o tempo do ticker não deve "pular" para alcançar o relógio:
  // a rolagem suave ficaria fora de fase com o que o usuário rolou.
  ticker.lagSmoothing(0);
  page.addEventListener("visibilitychange", syncWithPage);
  syncWithPage();

  return {
    scroller,
    stop() {
      if (isStopped) {
        return;
      }
      isStopped = true;
      page.removeEventListener("visibilitychange", syncWithPage);
      ticker.remove(step);
      ticker.lagSmoothing(GSAP_LAG_THRESHOLD_MS, GSAP_ADJUSTED_LAG_MS);
      scroller.destroy();
    },
  };
}

export interface ContentResizeOptions {
  /** Espera depois da última mudança antes de avisar. */
  readonly debounceMs?: number;
}

const DEFAULT_RESIZE_DEBOUNCE_MS = 200;

/**
 * Avisa quando a altura do conteúdo muda (fonte que carregou, imagem, acordeão).
 * O ScrollTrigger só recalcula sozinho em `resize` e `load` da janela; sem isto,
 * início e fim dos triggers ficam medidos com a altura antiga.
 *
 *   const stop = watchContentResize(document.body, () => ScrollTrigger.refresh());
 */
export function watchContentResize(target: HTMLElement, onResize: () => void, options: ContentResizeOptions = {}): () => void {
  if (typeof ResizeObserver !== "function") {
    return () => undefined;
  }
  const debounceMs = options.debounceMs ?? DEFAULT_RESIZE_DEBOUNCE_MS;
  let lastHeight = target.scrollHeight;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const report = (): void => {
    timer = null;
    const height = target.scrollHeight;
    if (height !== lastHeight) {
      lastHeight = height;
      onResize();
    }
  };
  const observer = new ResizeObserver(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(report, debounceMs);
  });
  observer.observe(target);

  return () => {
    observer.disconnect();
    if (timer !== null) {
      clearTimeout(timer);
    }
  };
}
