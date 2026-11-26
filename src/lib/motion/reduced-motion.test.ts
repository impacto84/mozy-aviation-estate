import { describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_QUERY, prefersReducedMotion, watchReducedMotion } from "./reduced-motion";
import type { MotionMediaSource } from "./reduced-motion";

type ChangeListener = (event: { readonly matches: boolean }) => void;

function createMediaSource(initial: boolean) {
  const listeners = new Set<ChangeListener>();
  const state = { matches: initial };
  const queries: string[] = [];
  const source: MotionMediaSource = {
    matchMedia(query) {
      queries.push(query);
      return {
        get matches() {
          return state.matches;
        },
        addEventListener: (_type, listener) => listeners.add(listener),
        removeEventListener: (_type, listener) => listeners.delete(listener),
      };
    },
  };
  const emit = (matches: boolean) => {
    state.matches = matches;
    for (const listener of listeners) {
      listener({ matches });
    }
  };
  return { source, emit, queries, listenerCount: () => listeners.size };
}

describe("prefersReducedMotion", () => {
  it("devolve true quando a media query casa", () => {
    const { source, queries } = createMediaSource(true);

    expect(prefersReducedMotion(source)).toBe(true);
    expect(queries).toEqual([REDUCED_MOTION_QUERY]);
  });

  it("devolve false quando a media query não casa", () => {
    const { source } = createMediaSource(false);

    expect(prefersReducedMotion(source)).toBe(false);
  });

  it("devolve false quando o ambiente não tem matchMedia (jsdom, navegador antigo)", () => {
    expect(prefersReducedMotion({})).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("watchReducedMotion", () => {
  it("avisa o valor inicial na hora", () => {
    const { source } = createMediaSource(true);
    const onChange = vi.fn();

    watchReducedMotion(onChange, source);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("avisa quando a preferência muda com a página aberta", () => {
    const { source, emit } = createMediaSource(false);
    const onChange = vi.fn();
    watchReducedMotion(onChange, source);

    emit(true);

    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("para de ouvir depois do cleanup", () => {
    const { source, emit, listenerCount } = createMediaSource(false);
    const onChange = vi.fn();
    const stop = watchReducedMotion(onChange, source);

    stop();
    emit(true);

    expect(listenerCount()).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("sem matchMedia avisa false uma vez e devolve cleanup inerte", () => {
    const onChange = vi.fn();

    const stop = watchReducedMotion(onChange, {});

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(() => stop()).not.toThrow();
  });
});
