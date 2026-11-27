import { afterEach, describe, expect, it, vi } from "vitest";
import type { FrameInfo, FrameScheduler } from "./clock";
import { createSceneClock } from "./scene-clock";

type TickCallback = (timestampMs: number) => void;
type MotionListener = (event: { readonly matches: boolean }) => void;

function createScheduler() {
  const pending = new Map<number, TickCallback>();
  let nextHandle = 1;
  const scheduler: FrameScheduler = {
    request(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      pending.set(handle, callback);
      return handle;
    },
    cancel(handle) {
      pending.delete(handle);
    },
  };
  const flush = (timestampMs: number) => {
    const callbacks = [...pending.values()];
    pending.clear();
    for (const callback of callbacks) {
      callback(timestampMs);
    }
  };
  return { scheduler, flush, pendingCount: () => pending.size };
}

function installEnvironment(isReducedInitially: boolean) {
  let intersect: (isIntersecting: boolean) => void = () => undefined;
  let isObserverDisconnected = false;
  class FakeIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      intersect = (isIntersecting) =>
        callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    }

    observe(): void {}

    disconnect(): void {
      isObserverDisconnected = true;
    }
  }
  const listeners = new Set<MotionListener>();
  const media = { matches: isReducedInitially };
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return media.matches;
    },
    addEventListener: (_type: string, listener: MotionListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MotionListener) => listeners.delete(listener),
  }));
  return {
    enterView: () => intersect(true),
    leaveView: () => intersect(false),
    setReducedMotion(isReduced: boolean) {
      media.matches = isReduced;
      for (const listener of listeners) {
        listener({ matches: isReduced });
      }
    },
    isObserverDisconnected: () => isObserverDisconnected,
    motionListenerCount: () => listeners.size,
  };
}

function setDocumentHidden(isHidden: boolean): void {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => isHidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

function setup(isReducedInitially = false) {
  const environment = installEnvironment(isReducedInitially);
  const { scheduler, flush, pendingCount } = createScheduler();
  const frames: FrameInfo[] = [];
  const onMotionPreferenceChange = vi.fn();
  const clock = createSceneClock(document.createElement("section"), {
    scheduler,
    onFrame: (frame) => frames.push(frame),
    onMotionPreferenceChange,
  });
  return { environment, flush, pendingCount, frames, clock, onMotionPreferenceChange };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "hidden");
});

describe("createSceneClock", () => {
  it("só roda com a cena pronta, na viewport, aba visível e movimento permitido", () => {
    const { environment, clock } = setup();

    expect(clock.isRunning()).toBe(false);
    clock.setReady(true);
    expect(clock.isRunning()).toBe(false);
    environment.enterView();

    expect(clock.isRunning()).toBe(true);
  });

  it("para ao sair da viewport e retoma ao voltar (MOTION-OFFSCREEN)", () => {
    const { environment, clock, pendingCount } = setup();
    clock.setReady(true);
    environment.enterView();

    environment.leaveView();
    expect(clock.isRunning()).toBe(false);
    expect(pendingCount()).toBe(0);
    environment.enterView();

    expect(clock.isRunning()).toBe(true);
  });

  it("para com a aba oculta e retoma quando ela volta", () => {
    const { environment, clock } = setup();
    clock.setReady(true);
    environment.enterView();

    setDocumentHidden(true);
    expect(clock.isRunning()).toBe(false);
    setDocumentHidden(false);

    expect(clock.isRunning()).toBe(true);
  });

  it("nunca roda com movimento reduzido (MOTION-REDUCED)", () => {
    const { environment, clock, onMotionPreferenceChange } = setup(true);

    clock.setReady(true);
    environment.enterView();

    expect(clock.isRunning()).toBe(false);
    expect(clock.isMotionAllowed()).toBe(false);
    expect(onMotionPreferenceChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("reage à troca da preferência de movimento com a página aberta", () => {
    const { environment, clock, onMotionPreferenceChange } = setup();
    clock.setReady(true);
    environment.enterView();

    environment.setReducedMotion(true);
    expect(clock.isRunning()).toBe(false);
    environment.setReducedMotion(false);

    expect(clock.isRunning()).toBe(true);
    expect(onMotionPreferenceChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it("setPlaying(false) pausa a pedido do visitante e setPlaying(true) retoma", () => {
    const { environment, clock } = setup();
    clock.setReady(true);
    environment.enterView();

    clock.setPlaying(false);
    expect(clock.isRunning()).toBe(false);
    clock.setPlaying(true);

    expect(clock.isRunning()).toBe(true);
  });

  it("entrega os frames do relógio e mantém o tempo entre pausas", () => {
    const { environment, clock, flush, frames } = setup();
    clock.setReady(true);
    environment.enterView();
    flush(0);
    flush(50);

    environment.leaveView();
    environment.enterView();
    flush(9000);

    expect(frames.at(-1)).toEqual({ time: 0.05, delta: 0 });
    expect(clock.time()).toBeCloseTo(0.05);
  });

  it("renderStill desenha um frame mesmo parado, no tempo inicial pedido", () => {
    installEnvironment(true);
    const frames: FrameInfo[] = [];
    const clock = createSceneClock(document.createElement("section"), {
      initialTime: 8,
      onFrame: (frame) => frames.push(frame),
    });

    clock.renderStill();

    expect(frames).toEqual([{ time: 8, delta: 0 }]);
  });

  it("repassa erro de frame para onError e para", () => {
    const environment = installEnvironment(false);
    const { scheduler, flush } = createScheduler();
    const onError = vi.fn();
    const clock = createSceneClock(document.createElement("section"), {
      scheduler,
      onError,
      onFrame: () => {
        throw new Error("contexto perdido");
      },
    });
    clock.setReady(true);
    environment.enterView();

    flush(0);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(clock.isRunning()).toBe(false);
  });

  it("dispose para o laço e solta observer e listeners", () => {
    const { environment, clock, pendingCount } = setup();
    clock.setReady(true);
    environment.enterView();

    clock.dispose();
    environment.enterView();

    expect(pendingCount()).toBe(0);
    expect(clock.isRunning()).toBe(false);
    expect(environment.isObserverDisconnected()).toBe(true);
    expect(environment.motionListenerCount()).toBe(0);
  });
});
