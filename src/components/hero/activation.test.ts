import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitForHeroStart } from "./activation";

interface ObserverControl {
  readonly intersect: (isIntersecting: boolean) => void;
  readonly isDisconnected: () => boolean;
}

function installIntersectionObserver(): ObserverControl {
  let callback: IntersectionObserverCallback = () => undefined;
  let isDisconnected = false;
  class FakeIntersectionObserver {
    constructor(handler: IntersectionObserverCallback) {
      callback = handler;
    }

    observe(): void {}

    disconnect(): void {
      isDisconnected = true;
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return {
    intersect: (isIntersecting) =>
      callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
    isDisconnected: () => isDisconnected,
  };
}

function setReadyState(state: DocumentReadyState): void {
  Object.defineProperty(document, "readyState", { configurable: true, get: () => state });
}

function mountHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "readyState");
  document.body.replaceChildren();
});

describe("waitForHeroStart", () => {
  it("nunca chama onStart de forma síncrona", () => {
    installIntersectionObserver();
    setReadyState("complete");
    const onStart = vi.fn();

    waitForHeroStart(mountHost(), onStart);

    expect(onStart).not.toHaveBeenCalled();
  });

  it("espera o load, a entrada na viewport, um frame pintado e um momento ocioso", () => {
    const observer = installIntersectionObserver();
    setReadyState("loading");
    const onStart = vi.fn();
    waitForHeroStart(mountHost(), onStart);

    vi.runAllTimers();
    expect(onStart).not.toHaveBeenCalled();
    setReadyState("complete");
    window.dispatchEvent(new Event("load"));
    vi.runAllTimers();
    expect(onStart).not.toHaveBeenCalled();
    observer.intersect(false);
    vi.runAllTimers();
    expect(onStart).not.toHaveBeenCalled();
    observer.intersect(true);
    vi.runAllTimers();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(observer.isDisconnected()).toBe(true);
  });

  it("usa requestIdleCallback quando o navegador tem", () => {
    const observer = installIntersectionObserver();
    setReadyState("complete");
    let idleCallback: (() => void) | null = null;
    const requestIdleCallback = vi.fn((callback: () => void) => {
      idleCallback = callback;
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const onStart = vi.fn();
    waitForHeroStart(mountHost(), onStart);
    observer.intersect(true);
    vi.runAllTimers();

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: expect.any(Number) });
    expect(onStart).not.toHaveBeenCalled();
    (idleCallback as (() => void) | null)?.();

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("segue em frente sem IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    setReadyState("complete");
    const onStart = vi.fn();

    waitForHeroStart(mountHost(), onStart);
    vi.runAllTimers();

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("cancelar antes do load impede o início e solta o listener", () => {
    installIntersectionObserver();
    setReadyState("loading");
    const onStart = vi.fn();
    const cancel = waitForHeroStart(mountHost(), onStart);

    cancel();
    setReadyState("complete");
    window.dispatchEvent(new Event("load"));
    vi.runAllTimers();

    expect(onStart).not.toHaveBeenCalled();
  });

  it("cancelar enquanto espera a viewport desconecta o observer", () => {
    const observer = installIntersectionObserver();
    setReadyState("complete");
    const onStart = vi.fn();
    const cancel = waitForHeroStart(mountHost(), onStart);

    cancel();
    const wasDisconnectedByCancel = observer.isDisconnected();
    observer.intersect(true);
    vi.runAllTimers();

    expect(wasDisconnectedByCancel).toBe(true);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("cancelar durante a espera do frame ou do ócio impede o início", () => {
    const observer = installIntersectionObserver();
    setReadyState("complete");
    const onStart = vi.fn();
    const cancel = waitForHeroStart(mountHost(), onStart);
    observer.intersect(true);

    cancel();
    vi.runAllTimers();

    expect(onStart).not.toHaveBeenCalled();
  });

  it("não faz nada para um elemento fora de um documento com janela", () => {
    const detachedDocument = document.implementation.createHTMLDocument("sem janela");
    const onStart = vi.fn();

    const cancel = waitForHeroStart(detachedDocument.createElement("div"), onStart);
    vi.runAllTimers();

    expect(onStart).not.toHaveBeenCalled();
    expect(() => cancel()).not.toThrow();
  });
});
