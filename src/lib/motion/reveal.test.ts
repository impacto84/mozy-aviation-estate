import { afterEach, describe, expect, it, vi } from "vitest";
import { REVEAL_STATE_ATTRIBUTE, armReveal } from "./reveal";

const VIEWPORT_HEIGHT = 768;

interface ObserverRecord {
  readonly options: IntersectionObserverInit | undefined;
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly notify: (isIntersecting: boolean) => void;
}

function installObserver(): ObserverRecord[] {
  const records: ObserverRecord[] = [];
  class FakeIntersectionObserver {
    readonly disconnect = vi.fn();

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      records.push({
        options,
        disconnect: this.disconnect,
        notify: (isIntersecting) =>
          callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver),
      });
    }

    observe(): void {}
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return records;
}

function createElementAt(top: number): HTMLElement {
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(element);
  return element;
}

const MOTION_ALLOWED = { matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) };
const MOTION_REDUCED = { matchMedia: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }) };

describe("armReveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("esconde o que está abaixo da dobra e revela quando entra na tela", () => {
    const records = installObserver();
    const element = createElementAt(VIEWPORT_HEIGHT + 200);

    armReveal(element, { media: MOTION_ALLOWED });
    expect(element.getAttribute(REVEAL_STATE_ATTRIBUTE)).toBe("pending");
    records[0]?.notify(true);

    expect(element.getAttribute(REVEAL_STATE_ATTRIBUTE)).toBe("in");
    expect(records[0]?.disconnect).toHaveBeenCalledOnce();
  });

  it("continua pendente enquanto o observer diz que está fora da tela", () => {
    const records = installObserver();
    const element = createElementAt(VIEWPORT_HEIGHT + 200);

    armReveal(element, { media: MOTION_ALLOWED });
    records[0]?.notify(false);

    expect(element.getAttribute(REVEAL_STATE_ATTRIBUTE)).toBe("pending");
  });

  it("não esconde o que já está na primeira dobra", () => {
    const records = installObserver();
    const element = createElementAt(120);

    armReveal(element, { media: MOTION_ALLOWED });

    expect(element.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
    expect(records).toHaveLength(0);
  });

  it("não esconde o que ficou acima da tela (página recarregada no meio)", () => {
    installObserver();
    const element = createElementAt(-900);

    armReveal(element, { media: MOTION_ALLOWED });

    expect(element.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
  });

  it("não esconde nada com movimento reduzido", () => {
    const records = installObserver();
    const element = createElementAt(VIEWPORT_HEIGHT + 200);

    armReveal(element, { media: MOTION_REDUCED });

    expect(element.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
    expect(records).toHaveLength(0);
  });

  it("não esconde nada sem IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const element = createElementAt(VIEWPORT_HEIGHT + 200);

    const stop = armReveal(element, { media: MOTION_ALLOWED });

    expect(element.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
    expect(() => stop()).not.toThrow();
  });

  it("não esconde elemento de documento sem janela", () => {
    installObserver();
    const detached = document.implementation.createHTMLDocument("").createElement("div");

    armReveal(detached, { media: MOTION_ALLOWED });

    expect(detached.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
  });

  it("a limpeza desconecta o observer e devolve o elemento ao estado visível", () => {
    const records = installObserver();
    const element = createElementAt(VIEWPORT_HEIGHT + 200);

    const stop = armReveal(element, { media: MOTION_ALLOWED });
    stop();

    expect(records[0]?.disconnect).toHaveBeenCalledOnce();
    expect(element.hasAttribute(REVEAL_STATE_ATTRIBUTE)).toBe(false);
  });

  it("usa a margem padrão e aceita outra", () => {
    const records = installObserver();

    armReveal(createElementAt(VIEWPORT_HEIGHT + 200), { media: MOTION_ALLOWED });
    armReveal(createElementAt(VIEWPORT_HEIGHT + 200), { media: MOTION_ALLOWED, rootMargin: "0px", threshold: 0.4 });

    expect(records[0]?.options).toEqual({ rootMargin: "0px 0px -10% 0px", threshold: 0 });
    expect(records[1]?.options).toEqual({ rootMargin: "0px", threshold: 0.4 });
  });
});
