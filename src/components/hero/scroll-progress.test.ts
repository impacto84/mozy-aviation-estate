import { afterEach, describe, expect, it, vi } from "vitest";
import { computeScrollProgress, trackScrollProgress } from "./scroll-progress";

interface MutableRect {
  top: number;
  height: number;
}

function elementWithRect(rect: MutableRect): HTMLElement {
  const element = document.createElement("section");
  document.body.append(element);
  element.getBoundingClientRect = () => rect as DOMRect;
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("computeScrollProgress", () => {
  it("é 0 com o topo da seção no topo da viewport ou abaixo dele", () => {
    expect(computeScrollProgress({ top: 0, height: 800 })).toBe(0);
    expect(computeScrollProgress({ top: 120, height: 800 })).toBe(0);
  });

  it("cresce conforme a seção sobe e chega a 1 quando ela saiu inteira", () => {
    expect(computeScrollProgress({ top: -200, height: 800 })).toBe(0.25);
    expect(computeScrollProgress({ top: -800, height: 800 })).toBe(1);
    expect(computeScrollProgress({ top: -2000, height: 800 })).toBe(1);
  });

  it("é 0 para seção sem altura ou medida inválida", () => {
    expect(computeScrollProgress({ top: -50, height: 0 })).toBe(0);
    expect(computeScrollProgress({ top: Number.NaN, height: 800 })).toBe(0);
  });
});

describe("trackScrollProgress", () => {
  it("mede na criação e atualiza a cada rolagem", () => {
    const rect = { top: 0, height: 1000 };
    const element = elementWithRect(rect);
    const tracker = trackScrollProgress(element);
    expect(tracker.source.current).toBe(0);

    rect.top = -500;
    window.dispatchEvent(new Event("scroll"));

    expect(tracker.source.current).toBe(0.5);
    tracker.stop();
  });

  it("atualiza também no resize", () => {
    const rect = { top: -100, height: 1000 };
    const element = elementWithRect(rect);
    const tracker = trackScrollProgress(element);

    rect.height = 400;
    window.dispatchEvent(new Event("resize"));

    expect(tracker.source.current).toBe(0.25);
    tracker.stop();
  });

  it("usa listener passivo e para de ouvir depois de stop", () => {
    const add = vi.spyOn(window, "addEventListener");
    const rect = { top: 0, height: 1000 };
    const element = elementWithRect(rect);
    const tracker = trackScrollProgress(element);

    tracker.stop();
    rect.top = -900;
    window.dispatchEvent(new Event("scroll"));

    expect(add).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
    expect(tracker.source.current).toBe(0);
  });
});
