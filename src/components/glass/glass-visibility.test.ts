import { afterEach, describe, expect, it, vi } from "vitest";
import { GLASS_IDLE_ATTRIBUTE, GLASS_VISIBILITY_MARGIN, watchGlassVisibility } from "./glass-visibility";

interface FakeObserver {
  readonly options: IntersectionObserverInit | undefined;
  readonly observed: Element[];
  isConnected: boolean;
  readonly notify: (isIntersecting: boolean) => void;
}

function installFakeObserver(): FakeObserver[] {
  const created: FakeObserver[] = [];
  class FakeIntersectionObserver {
    private readonly record: FakeObserver;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.record = {
        options,
        observed: [],
        isConnected: true,
        notify: (isIntersecting) =>
          callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver),
      };
      created.push(this.record);
    }

    observe(target: Element): void {
      this.record.observed.push(target);
    }

    disconnect(): void {
      this.record.isConnected = false;
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return created;
}

function createLayer(): HTMLElement {
  const layer = document.createElement("span");
  document.body.append(layer);
  return layer;
}

describe("watchGlassVisibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("não marca nada antes de o observer responder: o vidro nasce ligado", () => {
    installFakeObserver();
    const layer = createLayer();

    watchGlassVisibility(layer);

    expect(layer.hasAttribute(GLASS_IDLE_ATTRIBUTE)).toBe(false);
  });

  it("observa a própria camada, com margem para religar antes de ela aparecer", () => {
    const observers = installFakeObserver();
    const layer = createLayer();

    watchGlassVisibility(layer);

    expect(observers).toHaveLength(1);
    expect(observers[0]?.observed).toEqual([layer]);
    expect(observers[0]?.options?.rootMargin).toBe(GLASS_VISIBILITY_MARGIN);
  });

  it("marca a camada como ociosa quando ela sai da área observada", () => {
    const observers = installFakeObserver();
    const layer = createLayer();
    watchGlassVisibility(layer);

    observers[0]?.notify(false);

    expect(layer.getAttribute(GLASS_IDLE_ATTRIBUTE)).toBe("true");
  });

  it("tira a marca quando a camada volta", () => {
    const observers = installFakeObserver();
    const layer = createLayer();
    watchGlassVisibility(layer);
    observers[0]?.notify(false);

    observers[0]?.notify(true);

    expect(layer.hasAttribute(GLASS_IDLE_ATTRIBUTE)).toBe(false);
  });

  it("a limpeza desconecta o observer e devolve a camada ao estado ligado", () => {
    const observers = installFakeObserver();
    const layer = createLayer();
    const stop = watchGlassVisibility(layer);
    observers[0]?.notify(false);

    stop();

    expect(observers[0]?.isConnected).toBe(false);
    expect(layer.hasAttribute(GLASS_IDLE_ATTRIBUTE)).toBe(false);
  });

  it("sem IntersectionObserver, o vidro fica sempre ligado", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const layer = createLayer();

    const stop = watchGlassVisibility(layer);

    expect(layer.hasAttribute(GLASS_IDLE_ATTRIBUTE)).toBe(false);
    expect(() => stop()).not.toThrow();
  });
});
