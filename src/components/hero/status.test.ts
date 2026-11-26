import { describe, expect, it } from "vitest";
import { IDLE_STATUS, classifySceneError, isCanvasShown, shouldKeepScene } from "./status";
import type { HeroStatus } from "./status";

const LIVE: HeroStatus = { phase: "live", reason: null };
const STILL: HeroStatus = { phase: "still", reason: null };
const LOADING: HeroStatus = { phase: "loading", reason: null };
const LOST: HeroStatus = { phase: "fallback", reason: "context-lost" };
const NO_GL: HeroStatus = { phase: "fallback", reason: "no-webgl2" };

describe("status do hero", () => {
  it("começa parado no pôster", () => {
    expect(IDLE_STATUS).toEqual({ phase: "idle", reason: null });
  });

  it("mostra o canvas só depois do primeiro frame (animado ou estático)", () => {
    expect(isCanvasShown(LIVE)).toBe(true);
    expect(isCanvasShown(STILL)).toBe(true);
    expect(isCanvasShown(IDLE_STATUS)).toBe(false);
    expect(isCanvasShown(LOADING)).toBe(false);
    expect(isCanvasShown(LOST)).toBe(false);
  });

  it("mantém a cena montada enquanto ela pode voltar", () => {
    expect(shouldKeepScene(LOADING)).toBe(true);
    expect(shouldKeepScene(LIVE)).toBe(true);
    expect(shouldKeepScene(STILL)).toBe(true);
    expect(shouldKeepScene(LOST)).toBe(true);
  });

  it("desmonta a cena antes de começar e em fallback definitivo", () => {
    expect(shouldKeepScene(IDLE_STATUS)).toBe(false);
    expect(shouldKeepScene(NO_GL)).toBe(false);
    expect(shouldKeepScene({ phase: "fallback", reason: "save-data" })).toBe(false);
  });
});

describe("classifySceneError", () => {
  it("reconhece falha ao baixar o chunk da cena", () => {
    const chunkError = new Error("Loading chunk 42 failed");
    chunkError.name = "ChunkLoadError";

    expect(classifySceneError(chunkError)).toBe("load-error");
  });

  it("trata qualquer outro erro como erro da cena", () => {
    expect(classifySceneError(new Error("shader"))).toBe("scene-error");
    expect(classifySceneError("texto solto")).toBe("scene-error");
    expect(classifySceneError(null)).toBe("scene-error");
  });
});
