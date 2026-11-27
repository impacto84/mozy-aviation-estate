/**
 * Digitação com sub-caractere: a contagem de caracteres é fracionária e o próximo
 * caractere entra com opacidade igual à fração. Com uma curva `inOutCubic` no
 * progresso, o texto acelera no meio, desacelera no fim e cada letra faz fade em
 * vez de "pipocar".
 *
 *   const typeQuestion = createTypist("Minha entrega pode ser na sexta?");
 *   const { settled, entering, enteringOpacity } = typeQuestion(frame.typing);
 *
 * Quem desenha grava `settled` em um nó de texto e `entering` em um `<span>` com
 * `opacity`. Nada de estado do React por frame (Piso P6).
 */

import { clamp01 } from "./easing";

export interface TypedFrame {
  /** Texto já digitado por inteiro. */
  readonly settled: string;
  /** Caractere que está entrando, ou vazio. */
  readonly entering: string;
  /** Opacidade do caractere que está entrando (0..1). */
  readonly enteringOpacity: number;
  /** Quantidade fracionária de caracteres digitados. */
  readonly count: number;
}

export type Typist = (progress: number) => TypedFrame;

interface Segmenter {
  readonly segment: (text: string) => Iterable<{ readonly segment: string }>;
}

function createSegmenter(): Segmenter | null {
  return typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
}

/**
 * Divide o texto em caracteres como o leitor os vê: letra acentuada e emoji contam
 * como um só. Sem `Intl.Segmenter`, cai para pontos de código.
 */
export function splitGraphemes(text: string, segmenter: Segmenter | null = createSegmenter()): readonly string[] {
  if (segmenter === null) {
    return Array.from(text);
  }
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

function buildPrefixes(graphemes: readonly string[]): readonly string[] {
  const prefixes: string[] = [""];
  for (const grapheme of graphemes) {
    prefixes.push(`${prefixes.at(-1) ?? ""}${grapheme}`);
  }
  return prefixes;
}

/**
 * Prepara um texto para ser digitado. A função devolvida é pura e barata: os
 * prefixos são montados uma vez, então o laço de frames não corta string.
 */
export function createTypist(text: string): Typist {
  const graphemes = splitGraphemes(text);
  const prefixes = buildPrefixes(graphemes);
  const total = graphemes.length;
  return (progress) => {
    const count = clamp01(progress) * total;
    const whole = Math.floor(count);
    const fraction = count - whole;
    return {
      settled: prefixes[whole] ?? text,
      entering: fraction > 0 ? (graphemes[whole] ?? "") : "",
      enteringOpacity: fraction,
      count,
    };
  };
}
