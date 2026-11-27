import { afterEach, describe, expect, it, vi } from "vitest";
import { createTypist, splitGraphemes } from "./typing";

describe("createTypist", () => {
  const type = createTypist("abcd");

  it("começa vazio e termina com o texto inteiro", () => {
    expect(type(0)).toEqual({ settled: "", entering: "", enteringOpacity: 0, count: 0 });
    expect(type(1)).toEqual({ settled: "abcd", entering: "", enteringOpacity: 0, count: 4 });
  });

  it("entrega o próximo caractere com opacidade igual à fração", () => {
    const frame = type(0.375);

    expect(frame.settled).toBe("a");
    expect(frame.entering).toBe("b");
    expect(frame.enteringOpacity).toBeCloseTo(0.5);
    expect(frame.count).toBeCloseTo(1.5);
  });

  it("não deixa caractere entrando quando a contagem é inteira", () => {
    expect(type(0.5)).toEqual({ settled: "ab", entering: "", enteringOpacity: 0, count: 2 });
  });

  it("prende o progresso entre 0 e 1", () => {
    expect(type(-2).settled).toBe("");
    expect(type(5).settled).toBe("abcd");
    expect(type(Number.NaN).count).toBe(0);
  });

  it("nunca mostra mais do que o texto e cresce de forma monótona", () => {
    const sentence = createTypist("Pode sim! Tenho sexta, das 9h às 12h.");
    let previous = 0;
    for (let step = 0; step <= 200; step += 1) {
      const frame = sentence(step / 200);
      expect(frame.settled.length + frame.entering.length).toBeLessThanOrEqual(37);
      expect(frame.count).toBeGreaterThanOrEqual(previous);
      previous = frame.count;
    }
  });

  it("trata texto vazio", () => {
    expect(createTypist("")(0.5)).toEqual({ settled: "", entering: "", enteringOpacity: 0, count: 0 });
  });

  it("conta letra acentuada e emoji como um caractere", () => {
    const accented = createTypist("ação");
    const emoji = createTypist("ok 👍🏽");

    expect(accented(0.5).settled).toBe("aç");
    expect(emoji(1).count).toBe(4);
    expect(emoji(0.875).entering).toBe("👍🏽");
  });
});

describe("splitGraphemes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("funciona em navegador sem Intl.Segmenter", () => {
    vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });

    expect(splitGraphemes("olá")).toEqual(["o", "l", "á"]);
    expect(createTypist("olá")(1).settled).toBe("olá");
  });

  it("cai para pontos de código quando não há segmentador", () => {
    expect(splitGraphemes("aé😀", null)).toEqual(["a", "é", "😀"]);
  });

  it("usa o segmentador recebido", () => {
    const segmenter = { segment: (text: string) => text.split("-").map((segment) => ({ segment })) };

    expect(splitGraphemes("ab-cd", segmenter)).toEqual(["ab", "cd"]);
  });
});
