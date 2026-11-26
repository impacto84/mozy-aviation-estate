import { describe, expect, it, vi } from "vitest";
import {
  MAX_PIXEL_RATIO,
  acquireWebGL2,
  capPixelRatio,
  hasWebGL2Support,
  measureCanvas,
  readSaveData,
  releaseWebGL,
} from "./support";

describe("readSaveData", () => {
  it("devolve true só quando navigator.connection.saveData é true", () => {
    expect(readSaveData({ connection: { saveData: true } })).toBe(true);
    expect(readSaveData({ connection: { saveData: false } })).toBe(false);
  });

  it("trata dado ausente ou malformado como false", () => {
    expect(readSaveData(undefined)).toBe(false);
    expect(readSaveData(null)).toBe(false);
    expect(readSaveData({})).toBe(false);
    expect(readSaveData({ connection: null })).toBe(false);
    expect(readSaveData({ connection: { saveData: "on" } })).toBe(false);
    expect(readSaveData("navigator")).toBe(false);
  });
});

describe("capPixelRatio (PERF-DPR-CAP)", () => {
  it("mantém DPR entre 1 e o teto", () => {
    expect(capPixelRatio(1)).toBe(1);
    expect(capPixelRatio(1.5)).toBe(1.5);
    expect(capPixelRatio(2)).toBe(MAX_PIXEL_RATIO);
  });

  it("corta DPR acima de 2", () => {
    expect(capPixelRatio(3)).toBe(2);
    expect(capPixelRatio(4.5)).toBe(2);
  });

  it("usa 1 para valor inválido ou abaixo de 1", () => {
    expect(capPixelRatio(0.5)).toBe(1);
    expect(capPixelRatio(Number.NaN)).toBe(1);
    expect(capPixelRatio(undefined)).toBe(1);
    expect(capPixelRatio("2")).toBe(1);
  });
});

describe("measureCanvas", () => {
  it("devolve o tamanho CSS e a razão de pixels já limitada", () => {
    expect(measureCanvas({ width: 390, height: 780 }, 3)).toEqual({ width: 390, height: 780, pixelRatio: 2 });
  });

  it("arredonda para pixel inteiro e nunca devolve zero", () => {
    expect(measureCanvas({ width: 810.6, height: 0 }, 1)).toEqual({ width: 811, height: 1, pixelRatio: 1 });
  });

  it("trata medida inválida como 1 px", () => {
    expect(measureCanvas({ width: Number.NaN, height: -20 }, 1)).toEqual({ width: 1, height: 1, pixelRatio: 1 });
  });
});

describe("acquireWebGL2", () => {
  it("pede webgl2 com os atributos informados e devolve o contexto", () => {
    const context = { drawingBufferWidth: 1 };
    const getContext = vi.fn().mockReturnValue(context);
    const attributes = { alpha: true };

    const result = acquireWebGL2({ getContext }, attributes);

    expect(getContext).toHaveBeenCalledWith("webgl2", attributes);
    expect(result).toBe(context);
  });

  it("devolve null quando o navegador não entrega contexto", () => {
    expect(acquireWebGL2({ getContext: () => null }, {})).toBeNull();
    expect(acquireWebGL2({ getContext: () => undefined }, {})).toBeNull();
  });

  it("devolve null quando getContext lança", () => {
    const getContext = () => {
      throw new Error("bloqueado");
    };

    expect(acquireWebGL2({ getContext }, {})).toBeNull();
  });
});

describe("releaseWebGL", () => {
  it("perde o contexto pela extensão WEBGL_lose_context", () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn().mockReturnValue({ loseContext });

    releaseWebGL({ getExtension });

    expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("não falha quando a extensão não existe", () => {
    expect(() => releaseWebGL({ getExtension: () => null })).not.toThrow();
  });
});

describe("hasWebGL2Support", () => {
  it("devolve true e solta o contexto de sondagem", () => {
    const loseContext = vi.fn();
    const createElement = vi.fn().mockReturnValue({
      getContext: () => ({ getExtension: () => ({ loseContext }) }),
    });

    expect(hasWebGL2Support({ createElement })).toBe(true);
    expect(createElement).toHaveBeenCalledWith("canvas");
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("devolve false quando getContext devolve null", () => {
    const createElement = () => ({ getContext: () => null });

    expect(hasWebGL2Support({ createElement })).toBe(false);
  });
});
