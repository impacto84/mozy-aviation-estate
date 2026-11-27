import { afterEach, describe, expect, it, vi } from "vitest";
import { watchVisibility } from "./visibility";
import type { VisibilityState } from "./visibility";

interface ObserverRecord {
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit | undefined;
  readonly observed: Element[];
  isDisconnected: boolean;
}

function installIntersectionObserver(): ObserverRecord[] {
  const records: ObserverRecord[] = [];
  class FakeIntersectionObserver {
    private readonly record: ObserverRecord;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.record = { callback, options, observed: [], isDisconnected: false };
      records.push(this.record);
    }

    observe(element: Element): void {
      this.record.observed.push(element);
    }

    disconnect(): void {
      this.record.isDisconnected = true;
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return records;
}

function emitIntersection(record: ObserverRecord, flags: readonly boolean[]): void {
  const entries = flags.map((isIntersecting) => ({ isIntersecting }) as IntersectionObserverEntry);
  record.callback(entries, {} as IntersectionObserver);
}

function setDocumentHidden(isHidden: boolean): void {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => isHidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "hidden");
});

describe("watchVisibility", () => {
  it("começa fora da tela até o observer responder", () => {
    installIntersectionObserver();
    const states: VisibilityState[] = [];

    watchVisibility(document.createElement("div"), (state) => states.push(state));

    expect(states).toEqual([{ isInView: false, isPageVisible: true }]);
  });

  it("avisa quando o alvo entra e sai da viewport", () => {
    const records = installIntersectionObserver();
    const target = document.createElement("div");
    const states: VisibilityState[] = [];
    watchVisibility(target, (state) => states.push(state));
    const record = records[0];
    if (record === undefined) {
      throw new Error("observer não foi criado");
    }

    emitIntersection(record, [true]);
    emitIntersection(record, [false]);

    expect(record.observed).toEqual([target]);
    expect(states.map((state) => state.isInView)).toEqual([false, true, false]);
  });

  it("usa a última entrada quando o observer entrega várias de uma vez", () => {
    const records = installIntersectionObserver();
    const states: VisibilityState[] = [];
    watchVisibility(document.createElement("div"), (state) => states.push(state));
    const record = records[0];
    if (record === undefined) {
      throw new Error("observer não foi criado");
    }

    emitIntersection(record, [false, true]);
    emitIntersection(record, []);

    expect(states.at(-1)).toEqual({ isInView: true, isPageVisible: true });
    expect(states).toHaveLength(2);
  });

  it("não repete o aviso quando nada mudou", () => {
    const records = installIntersectionObserver();
    const onChange = vi.fn();
    watchVisibility(document.createElement("div"), onChange);
    const record = records[0];
    if (record === undefined) {
      throw new Error("observer não foi criado");
    }

    emitIntersection(record, [true]);
    emitIntersection(record, [true]);

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("avisa quando a aba fica oculta e quando volta", () => {
    installIntersectionObserver();
    const states: VisibilityState[] = [];
    watchVisibility(document.createElement("div"), (state) => states.push(state));

    setDocumentHidden(true);
    setDocumentHidden(false);

    expect(states.map((state) => state.isPageVisible)).toEqual([true, false, true]);
  });

  it("repassa rootMargin e threshold ao observer", () => {
    const records = installIntersectionObserver();

    watchVisibility(document.createElement("div"), () => undefined, { rootMargin: "200px 0px", threshold: 0.25 });

    expect(records[0]?.options).toEqual({ rootMargin: "200px 0px", threshold: 0.25 });
  });

  it("o cleanup desconecta o observer e para de ouvir a aba", () => {
    const records = installIntersectionObserver();
    const onChange = vi.fn();
    const stop = watchVisibility(document.createElement("div"), onChange);

    stop();
    setDocumentHidden(true);

    expect(records[0]?.isDisconnected).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("sem IntersectionObserver trata o alvo como visível", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const states: VisibilityState[] = [];

    const stop = watchVisibility(document.createElement("div"), (state) => states.push(state));
    setDocumentHidden(true);
    stop();

    expect(states).toEqual([
      { isInView: true, isPageVisible: true },
      { isInView: true, isPageVisible: false },
    ]);
  });
});
