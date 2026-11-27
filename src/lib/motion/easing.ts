/**
 * Matemática de animação sem dependência: interpolação, janelas de tempo e curvas.
 *
 * Tudo aqui é função pura de um número. É a base das timelines dos simuladores
 * (`timeline.ts`), da digitação (`typing.ts`) e do cursor falso (`cursor.ts`):
 * um relógio entrega o tempo, estas funções dizem como cada coisa está naquele instante.
 */

export type EasingFunction = (t: number) => number;

/** Prende `value` entre `min` e `max`. `NaN` vira `min`. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: \`min\` (${String(min)}) maior que \`max\` (${String(max)}).`);
  }
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Interpolação linear. `t` fora de 0..1 extrapola, de propósito (overshoot do `outBack`). */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Progresso 0..1 de `time` dentro da janela `[from, to]`: 0 antes, 1 depois.
 * É a peça que troca máquina de estados por tabela de janelas.
 */
export function windowProgress(time: number, from: number, to: number): number {
  if (!(to > from)) {
    throw new RangeError(`windowProgress: janela inválida [${String(from)}, ${String(to)}]. O fim precisa ser maior que o início.`);
  }
  return clamp01((time - from) / (to - from));
}

/** Degrau suave de Hermite entre `edge0` e `edge1`. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = windowProgress(value, edge0, edge1);
  return t * t * (3 - 2 * t);
}

const BACK_OVERSHOOT = 1.70158;
const CUBIC = 3;
const QUART = 4;

function linear(t: number): number {
  return clamp01(t);
}

function outCubic(t: number): number {
  return 1 - (1 - clamp01(t)) ** CUBIC;
}

function outQuart(t: number): number {
  return 1 - (1 - clamp01(t)) ** QUART;
}

function inOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x ** CUBIC : 1 - (-2 * x + 2) ** CUBIC / 2;
}

/** Passa um pouco de 1 e volta: bom para chip, selo e ícone que "nascem". */
function outBack(t: number): number {
  const x = clamp01(t) - 1;
  return 1 + (BACK_OVERSHOOT + 1) * x ** CUBIC + BACK_OVERSHOOT * x ** 2;
}

/**
 * Vocabulário de curvas das timelines. Entradas usam `outQuart` ou `outBack`;
 * deslocamento de cursor e digitação usam `inOutCubic`.
 */
export const EASINGS = {
  linear,
  outCubic,
  outQuart,
  inOutCubic,
  outBack,
} as const satisfies Readonly<Record<string, EasingFunction>>;

export type EasingName = keyof typeof EASINGS;

export function resolveEasing(ease: EasingName | EasingFunction | undefined): EasingFunction {
  if (ease === undefined) {
    return linear;
  }
  return typeof ease === "function" ? ease : EASINGS[ease];
}

const NEWTON_ITERATIONS = 8;
const BISECTION_ITERATIONS = 24;
const SLOPE_EPSILON = 1e-6;
const SOLVE_EPSILON = 1e-7;

function bezierAxis(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * p1 + 3 * inverse * t * t * p2 + t * t * t;
}

function bezierSlope(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return 3 * inverse * inverse * p1 + 6 * inverse * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/** Acha o parâmetro `t` da curva cujo x vale `x`: Newton primeiro, bisseção se a derivada zerar. */
function solveBezierParameter(x: number, x1: number, x2: number): number {
  let t = x;
  for (let iteration = 0; iteration < NEWTON_ITERATIONS; iteration += 1) {
    const slope = bezierSlope(t, x1, x2);
    if (Math.abs(slope) < SLOPE_EPSILON) {
      break;
    }
    const error = bezierAxis(t, x1, x2) - x;
    if (Math.abs(error) < SOLVE_EPSILON) {
      return t;
    }
    t = clamp01(t - error / slope);
  }
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration += 1) {
    t = (low + high) / 2;
    if (bezierAxis(t, x1, x2) < x) {
      low = t;
    } else {
      high = t;
    }
  }
  return t;
}

/**
 * A mesma curva de `cubic-bezier(x1, y1, x2, y2)` do CSS, como função.
 * Serve para o JS (timeline, `ease` do GSAP) usar exatamente a curva dos tokens.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  const points = [x1, y1, x2, y2];
  if (points.some((point) => !Number.isFinite(point)) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new RangeError(`cubicBezier: pontos inválidos (${points.join(", ")}). x1 e x2 ficam entre 0 e 1.`);
  }
  return (t) => {
    const x = clamp01(t);
    if (x === 0 || x === 1) {
      return x;
    }
    return bezierAxis(solveBezierParameter(x, x1, x2), y1, y2);
  };
}
