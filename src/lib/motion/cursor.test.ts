import { describe, expect, it } from "vitest";
import { defineCursorPath, distanceTo } from "./cursor";

const START = { x: 0, y: 0 };
const FIRST = { x: 100, y: 0 };
const SECOND = { x: 100, y: 50 };

const PATH = defineCursorPath({
  start: START,
  moves: [
    { from: 1, to: 2, target: FIRST },
    { from: 3, to: 4, target: SECOND, ease: "inOutCubic" },
  ],
  clicks: [{ at: 2.2, duration: 0.4 }, { at: 5 }],
});

describe("defineCursorPath", () => {
  it("fica no ponto inicial antes do primeiro trecho", () => {
    expect(PATH(0)).toEqual({ x: 0, y: 0, press: 0 });
  });

  it("interpola dentro do trecho e para no alvo", () => {
    expect(PATH(1.5).x).toBeCloseTo(50);
    expect(PATH(2).x).toBeCloseTo(100);
    expect(PATH(2.7)).toMatchObject({ x: 100, y: 0 });
  });

  it("parte do alvo anterior no trecho seguinte, com a curva pedida", () => {
    expect(PATH(3.5)).toMatchObject({ x: 100, y: 25 });
    expect(PATH(3.25).y).toBeLessThan(12.5);
    expect(PATH(9)).toMatchObject({ x: 100, y: 50 });
  });

  it("desce e solta o botão na janela do clique", () => {
    expect(PATH(2.2).press).toBeCloseTo(0);
    expect(PATH(2.4).press).toBeCloseTo(1);
    expect(PATH(2.6).press).toBeCloseTo(0);
    expect(PATH(2.9).press).toBeCloseTo(0);
  });

  it("usa a duração padrão do clique", () => {
    expect(PATH(5.14).press).toBeCloseTo(1);
    expect(PATH(5.4).press).toBeCloseTo(0);
  });

  it("curva o trajeto com `arc`, sem mexer nas pontas", () => {
    const arched = defineCursorPath({ start: START, moves: [{ from: 0, to: 2, target: FIRST, arc: 20 }] });

    expect(arched(1)).toMatchObject({ x: 50, y: 20 });
    expect(arched(0).y).toBeCloseTo(0);
    expect(arched(2).y).toBeCloseTo(0);
  });

  it("aceita trecho que não sai do lugar", () => {
    const still = defineCursorPath({ start: FIRST, moves: [{ from: 0, to: 1, target: FIRST, arc: 10 }] });

    expect(still(0.5)).toMatchObject({ x: 100, y: 0 });
  });

  it("funciona sem cliques", () => {
    expect(defineCursorPath({ start: START, moves: [] })(3)).toEqual({ x: 0, y: 0, press: 0 });
  });

  it.each([
    ["início não finito", { start: { x: Number.NaN, y: 0 }, moves: [] }],
    ["janela invertida", { start: START, moves: [{ from: 2, to: 1, target: FIRST }] }],
    ["alvo não finito", { start: START, moves: [{ from: 0, to: 1, target: { x: 0, y: Number.POSITIVE_INFINITY } }] }],
    [
      "trechos sobrepostos",
      {
        start: START,
        moves: [
          { from: 0, to: 2, target: FIRST },
          { from: 1, to: 3, target: SECOND },
        ],
      },
    ],
    ["clique sem instante", { start: START, moves: [], clicks: [{ at: Number.NaN }] }],
    ["clique com duração zero", { start: START, moves: [], clicks: [{ at: 1, duration: 0 }] }],
  ])("recusa %s", (_label, spec) => {
    expect(() => defineCursorPath(spec)).toThrow(RangeError);
  });
});

describe("distanceTo", () => {
  it("mede a distância entre o cursor e o alvo", () => {
    expect(distanceTo({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
