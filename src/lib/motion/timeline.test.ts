import { describe, expect, it } from "vitest";
import { defineTimeline, loopFade, loopProgress } from "./timeline";
import type { TimelineSpec } from "./timeline";

const TIMELINE = defineTimeline({
  duration: 10,
  scenes: {
    intro: { from: 0, to: 2 },
    typing: { from: 2, to: 6, ease: "inOutCubic" },
    pop: { from: 6, to: 7, ease: "outBack" },
    custom: { from: 8, to: 10, ease: (t) => t * t },
  },
});

describe("defineTimeline", () => {
  it("devolve o progresso local de cada cena no instante pedido", () => {
    const frame = TIMELINE.sample(0.1);

    expect(frame.intro).toBe(0.5);
    expect(frame.typing).toBe(0);
    expect(frame.pop).toBe(0);
  });

  it("mantém em 1 as cenas que já terminaram e em 0 as que não começaram", () => {
    const frame = TIMELINE.sample(0.65);

    expect(frame.intro).toBe(1);
    expect(frame.typing).toBe(1);
    expect(frame.pop).toBeGreaterThan(0);
    expect(frame.custom).toBe(0);
  });

  it("aplica a curva de cada cena", () => {
    expect(TIMELINE.progressOf("typing", 0.4)).toBeCloseTo(0.5);
    expect(TIMELINE.progressOf("typing", 0.3)).toBeLessThan(0.25);
    expect(TIMELINE.progressOf("pop", 0.67)).toBeGreaterThan(1);
    expect(TIMELINE.progressOf("custom", 0.9)).toBeCloseTo(0.25);
  });

  it("é função pura: o mesmo progresso dá o mesmo quadro, em qualquer ordem", () => {
    const first = TIMELINE.sample(0.42);
    TIMELINE.sample(0.9);
    TIMELINE.sample(0.05);

    expect(TIMELINE.sample(0.42)).toEqual(first);
  });

  it("prende o progresso do laço entre 0 e 1", () => {
    expect(TIMELINE.sample(-1)).toEqual(TIMELINE.sample(0));
    expect(TIMELINE.sample(3)).toEqual(TIMELINE.sample(1));
  });

  it("expõe a duração, os nomes e o trecho do laço de cada cena", () => {
    expect(TIMELINE.duration).toBe(10);
    expect(TIMELINE.sceneNames).toEqual(["intro", "typing", "pop", "custom"]);
    expect(TIMELINE.span("typing")).toEqual([0.2, 0.6]);
  });

  it("recusa cena desconhecida", () => {
    expect(() => TIMELINE.progressOf("ghost" as "intro", 0.5)).toThrow(/cena desconhecida "ghost"/);
    expect(() => TIMELINE.span("ghost" as "intro")).toThrow(RangeError);
  });

  it.each<[string, TimelineSpec<string>]>([
    ["duração zero", { duration: 0, scenes: { a: { from: 0, to: 1 } } }],
    ["duração não finita", { duration: Number.POSITIVE_INFINITY, scenes: { a: { from: 0, to: 1 } } }],
    ["sem cenas", { duration: 5, scenes: {} }],
    ["janela invertida", { duration: 5, scenes: { a: { from: 3, to: 2 } } }],
    ["janela vazia", { duration: 5, scenes: { a: { from: 2, to: 2 } } }],
    ["janela antes do zero", { duration: 5, scenes: { a: { from: -1, to: 2 } } }],
    ["janela depois do fim", { duration: 5, scenes: { a: { from: 1, to: 6 } } }],
    ["janela com NaN", { duration: 5, scenes: { a: { from: Number.NaN, to: 2 } } }],
  ])("recusa %s", (_label, spec) => {
    expect(() => defineTimeline(spec)).toThrow(RangeError);
  });

  it("diz qual cena está errada", () => {
    expect(() => defineTimeline({ duration: 5, scenes: { ok: { from: 0, to: 1 }, broken: { from: 4, to: 9 } } })).toThrow(
      /cena "broken"/,
    );
  });
});

describe("loopProgress", () => {
  it("converte tempo em progresso e recomeça a cada volta", () => {
    expect(loopProgress(0, 8)).toBe(0);
    expect(loopProgress(2, 8)).toBe(0.25);
    expect(loopProgress(10, 8)).toBe(0.25);
    expect(loopProgress(8, 8)).toBe(0);
  });

  it("trata tempo negativo ou inválido como início", () => {
    expect(loopProgress(-3, 8)).toBe(0);
    expect(loopProgress(Number.NaN, 8)).toBe(0);
  });

  it("recusa duração inválida", () => {
    expect(() => loopProgress(1, 0)).toThrow(RangeError);
    expect(() => loopProgress(1, Number.NaN)).toThrow(RangeError);
  });
});

describe("loopFade", () => {
  const FADE = { fadeIn: 0.1, fadeOut: 0.1 };

  it("é zero nas pontas e um no miolo", () => {
    expect(loopFade(0, FADE)).toBe(0);
    expect(loopFade(1, FADE)).toBe(0);
    expect(loopFade(0.5, FADE)).toBe(1);
    expect(loopFade(0.1, FADE)).toBe(1);
    expect(loopFade(0.9, FADE)).toBe(1);
  });

  it("sobe na entrada e desce na saída", () => {
    expect(loopFade(0.05, FADE)).toBeCloseTo(0.5);
    expect(loopFade(0.95, FADE)).toBeCloseTo(0.5);
    expect(loopFade(0.97, FADE)).toBeLessThan(loopFade(0.93, FADE));
  });

  it("recusa frações fora de 0..0,5", () => {
    expect(() => loopFade(0.5, { fadeIn: 0, fadeOut: 0.1 })).toThrow(RangeError);
    expect(() => loopFade(0.5, { fadeIn: 0.1, fadeOut: 0.6 })).toThrow(RangeError);
    expect(() => loopFade(0.5, { fadeIn: Number.NaN, fadeOut: 0.1 })).toThrow(RangeError);
  });
});
