import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldSmoothScroll, startSmoothScroll, watchContentResize } from "./scroll-engine";

type TickListener = (timeSeconds: number) => void;

function createDeps(isHiddenInitially = false) {
  const listeners: TickListener[] = [];
  const pageListeners = new Set<() => void>();
  const page = {
    hidden: isHiddenInitially,
    addEventListener: (_type: "visibilitychange", listener: () => void) => pageListeners.add(listener),
    removeEventListener: (_type: "visibilitychange", listener: () => void) => pageListeners.delete(listener),
  };
  const scroller = { raf: vi.fn(), on: vi.fn(), destroy: vi.fn() };
  const ticker = {
    add: vi.fn((listener: TickListener) => listeners.push(listener)),
    remove: vi.fn((listener: TickListener) => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }),
    lagSmoothing: vi.fn(),
  };
  const onScroll = vi.fn();
  return {
    deps: { ticker, createScroller: () => scroller, onScroll, page },
    scroller,
    ticker,
    onScroll,
    tick: (timeSeconds: number) => listeners.forEach((listener) => listener(timeSeconds)),
    listenerCount: () => listeners.length,
    pageListenerCount: () => pageListeners.size,
    setHidden(isHidden: boolean) {
      page.hidden = isHidden;
      pageListeners.forEach((listener) => listener());
    },
  };
}

describe("shouldSmoothScroll", () => {
  it("liga em aparelho com ponteiro fino e movimento permitido", () => {
    expect(shouldSmoothScroll({ isReducedMotion: false, isTouchOnly: false })).toBe(true);
  });

  it("nunca liga com movimento reduzido", () => {
    expect(shouldSmoothScroll({ isReducedMotion: true, isTouchOnly: false })).toBe(false);
    expect(shouldSmoothScroll({ isReducedMotion: true, isTouchOnly: true, shouldSmoothTouch: true })).toBe(false);
  });

  it("fica na rolagem nativa em aparelho só de toque, a menos que peçam o contrário", () => {
    expect(shouldSmoothScroll({ isReducedMotion: false, isTouchOnly: true })).toBe(false);
    expect(shouldSmoothScroll({ isReducedMotion: false, isTouchOnly: true, shouldSmoothTouch: true })).toBe(true);
  });
});

describe("startSmoothScroll", () => {
  it("move o Lenis pelo ticker, com o tempo em milissegundos", () => {
    const { deps, scroller, tick, listenerCount } = createDeps();

    startSmoothScroll(deps);
    tick(2.5);

    expect(listenerCount()).toBe(1);
    expect(scroller.raf).toHaveBeenCalledExactlyOnceWith(2500);
  });

  it("avisa o ScrollTrigger a cada passo da rolagem e desliga o lag smoothing", () => {
    const { deps, scroller, ticker, onScroll } = createDeps();

    startSmoothScroll(deps);

    expect(scroller.on).toHaveBeenCalledExactlyOnceWith("scroll", onScroll);
    expect(ticker.lagSmoothing).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("sai do ticker com a aba oculta e volta quando ela reaparece", () => {
    const { deps, scroller, tick, listenerCount, setHidden } = createDeps();
    startSmoothScroll(deps);

    setHidden(true);
    tick(1);

    expect(listenerCount()).toBe(0);
    expect(scroller.raf).not.toHaveBeenCalled();
    setHidden(false);
    expect(listenerCount()).toBe(1);
  });

  it("não entra no ticker se a aba já começa oculta", () => {
    const { deps, listenerCount } = createDeps(true);

    startSmoothScroll(deps);

    expect(listenerCount()).toBe(0);
  });

  it("stop tira o ouvinte, destrói o Lenis e devolve o lag smoothing padrão", () => {
    const { deps, scroller, ticker, listenerCount, pageListenerCount, setHidden } = createDeps();
    const engine = startSmoothScroll(deps);

    engine.stop();
    setHidden(false);

    expect(listenerCount()).toBe(0);
    expect(pageListenerCount()).toBe(0);
    expect(scroller.destroy).toHaveBeenCalledOnce();
    expect(ticker.lagSmoothing).toHaveBeenLastCalledWith(500, 33);
  });

  it("stop duas vezes não destrói duas vezes", () => {
    const { deps, scroller } = createDeps();
    const engine = startSmoothScroll(deps);

    engine.stop();
    engine.stop();

    expect(scroller.destroy).toHaveBeenCalledOnce();
  });

  it("expõe o scroller criado", () => {
    const { deps, scroller } = createDeps();

    expect(startSmoothScroll(deps).scroller).toBe(scroller);
  });
});

describe("watchContentResize", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function installResizeObserver() {
    let notify: () => void = () => undefined;
    const disconnect = vi.fn();
    class FakeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        notify = () => callback([], this as unknown as ResizeObserver);
      }

      observe(): void {}

      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    return { notify: () => notify(), disconnect };
  }

  function createTarget(initialHeight: number) {
    const target = document.createElement("div");
    let height = initialHeight;
    Object.defineProperty(target, "scrollHeight", { get: () => height });
    return { target, setHeight: (next: number) => (height = next) };
  }

  it("avisa uma vez depois que a altura muda e assenta", () => {
    vi.useFakeTimers();
    const { notify } = installResizeObserver();
    const { target, setHeight } = createTarget(1000);
    const onResize = vi.fn();
    watchContentResize(target, onResize, { debounceMs: 100 });

    setHeight(1400);
    notify();
    vi.advanceTimersByTime(60);
    notify();
    vi.advanceTimersByTime(60);
    expect(onResize).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);

    expect(onResize).toHaveBeenCalledOnce();
  });

  it("não avisa quando a altura não mudou", () => {
    vi.useFakeTimers();
    const { notify } = installResizeObserver();
    const { target } = createTarget(1000);
    const onResize = vi.fn();
    watchContentResize(target, onResize);

    notify();
    vi.runAllTimers();

    expect(onResize).not.toHaveBeenCalled();
  });

  it("a limpeza desconecta o observer e cancela o aviso pendente", () => {
    vi.useFakeTimers();
    const { notify, disconnect } = installResizeObserver();
    const { target, setHeight } = createTarget(1000);
    const onResize = vi.fn();
    const stop = watchContentResize(target, onResize);

    setHeight(2000);
    notify();
    stop();
    vi.runAllTimers();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(onResize).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("não faz nada em navegador sem ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const onResize = vi.fn();

    const stop = watchContentResize(document.createElement("div"), onResize);

    expect(() => stop()).not.toThrow();
    expect(onResize).not.toHaveBeenCalled();
  });
});
