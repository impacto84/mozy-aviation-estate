import { describe, expect, it } from "vitest";
import { BREAKPOINTS, VIEWPORTS, viewportClass } from "./breakpoints";

describe("viewportClass", () => {
  it("classifica 390 como phone", () => {
    expect(viewportClass(390)).toBe("phone");
  });

  it("classifica o limite 767 como phone e 768 como tablet", () => {
    expect(viewportClass(767)).toBe("phone");
    expect(viewportClass(768)).toBe("tablet");
  });

  it("classifica o limite 1199 como tablet e 1200 como desktop", () => {
    expect(viewportClass(1199)).toBe("tablet");
    expect(viewportClass(1200)).toBe("desktop");
  });

  it("lança RangeError quando a largura não é um número positivo finito", () => {
    expect(() => viewportClass(0)).toThrow(RangeError);
    expect(() => viewportClass(-10)).toThrow(RangeError);
    expect(() => viewportClass(Number.NaN)).toThrow(RangeError);
    expect(() => viewportClass(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("VIEWPORTS", () => {
  it("tem as três larguras de verificação da constituição", () => {
    expect(VIEWPORTS.map((viewport) => viewport.width)).toEqual([1440, 810, 390]);
  });

  it("cada largura de verificação cai na classe do próprio nome", () => {
    for (const viewport of VIEWPORTS) {
      expect(viewportClass(viewport.width)).toBe(viewport.name);
    }
  });

  it("expõe os limites usados nas media queries", () => {
    expect(BREAKPOINTS).toEqual({ tabletMin: 768, desktopMin: 1200 });
  });
});
