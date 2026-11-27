// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CHAPTERS,
  captionPhase,
  clampProgress,
  coverRect,
  decodeWidthFor,
  findChapter,
  frameCounter,
  frameIndexFor,
  framePath,
  frameUrl,
  loadOrder,
  nearestLoaded,
  sampledFrames,
  stepFor,
} from "./chapters";

describe("pipeline direto de quadros", () => {
  it("frameUrl aponta para o WebP original, nunca para /_next/image", () => {
    const url = frameUrl("/frames/villa", 42);
    expect(url).toBe("/frames/villa/frame-0042.webp");
    expect(url).not.toContain("_next/image");
    expect(url).not.toContain("q=");
  });

  it("framePath completa quatro dígitos", () => {
    expect(framePath("/frames/approach", 1)).toBe("/frames/approach/frame-0001.webp");
    expect(framePath("/frames/hangar", 361)).toBe("/frames/hangar/frame-0361.webp");
  });
});

describe("densidade dos três atos (FORJA 1.1)", () => {
  it("mantém as contagens reais e os passos pedidos", () => {
    expect(CHAPTERS.map((chapter) => [chapter.id, chapter.count, chapter.step, chapter.phoneStep])).toEqual([
      ["approach", 121, 1, 2],
      ["villa", 722, 2, 3],
      ["hangar", 361, 1, 2],
    ]);
  });

  it("trilhas entre 360svh e 560svh em toda largura", () => {
    for (const chapter of CHAPTERS) {
      for (const height of [chapter.trackSvh, chapter.phoneTrackSvh]) {
        expect(height).toBeGreaterThanOrEqual(360);
        expect(height).toBeLessThanOrEqual(560);
      }
    }
  });

  it("só o Ato I pré-carrega na montagem", () => {
    expect(CHAPTERS.filter((chapter) => chapter.preload === "immediate").map((chapter) => chapter.id)).toEqual(["approach"]);
  });

  it("villa no desktop usa 361 quadros reais e sempre inclui o último", () => {
    const villa = findChapter("villa");
    const desktop = sampledFrames(villa, 1440);
    expect(desktop).toHaveLength(362);
    expect(desktop[0]).toBe(1);
    expect(desktop.at(-1)).toBe(722);
    expect(stepFor(villa, 390)).toBe(3);
    expect(sampledFrames(findChapter("approach"), 1440)).toHaveLength(121);
  });

  it("findChapter recusa id desconhecido", () => {
    expect(() => findChapter("x" as never)).toThrow("Capítulo desconhecido");
  });
});

describe("scrub", () => {
  it("loadOrder põe quadros-chave primeiro e cobre todos os índices uma vez", () => {
    const order = loadOrder(20, 8);
    expect(order.slice(0, 4)).toEqual([0, 8, 16, 19]);
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, index) => index));
    expect(loadOrder(0)).toEqual([]);
  });

  it("frameIndexFor limita o progresso e trata NaN", () => {
    expect(frameIndexFor(0.5, 121)).toBe(60);
    expect(frameIndexFor(2, 121)).toBe(120);
    expect(frameIndexFor(Number.NaN, 121)).toBe(0);
    expect(frameIndexFor(0.5, 0)).toBe(0);
    expect(clampProgress(-1)).toBe(0);
  });

  it("nearestLoaded devolve o vizinho mais próximo ou -1", () => {
    const loaded = new Set([2, 9]);
    expect(nearestLoaded(4, (index) => loaded.has(index), 12)).toBe(2);
    expect(nearestLoaded(7, (index) => loaded.has(index), 12)).toBe(9);
    expect(nearestLoaded(4, () => false, 12)).toBe(-1);
  });

  it("captionPhase troca nas fronteiras", () => {
    expect(captionPhase(0)).toBe("intro");
    expect(captionPhase(0.34)).toBe("mid");
    expect(captionPhase(0.68)).toBe("arrival");
  });

  it("decodeWidthFor cobre o canvas em cover e nunca amplia além do arquivo original", () => {
    expect(decodeWidthFor(2880, 1800, 1920, 1082)).toBe(1920);
    // desktop 1440x900: a largura manda
    expect(decodeWidthFor(1440, 900, 1600, 900)).toBe(1600);
    expect(decodeWidthFor(1280, 600, 1600, 900)).toBe(1280);
    // phone 390x844 em retrato: a altura manda (844 * 16/9 = 1.501)
    expect(decodeWidthFor(390, 844, 1600, 900)).toBe(1501);
    expect(decodeWidthFor(0, 0, 1600, 900)).toBe(1);
  });

  it("coverRect cobre o canvas mantendo a proporção", () => {
    const rect = coverRect(400, 800, 1600, 900);
    expect(rect.height).toBe(800);
    expect(rect.width).toBeCloseTo(1422.2, 1);
    expect(rect.x).toBeCloseTo(-511.1, 1);
  });

  it("frameCounter usa os dígitos da contagem", () => {
    expect(frameCounter(7, 121)).toBe("QDR 007/121");
    expect(frameCounter(42, 722)).toBe("QDR 042/722");
  });
});
