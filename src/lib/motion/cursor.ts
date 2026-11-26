/**
 * Cursor falso como dado, não como evento. O caminho é uma lista de trechos com
 * janela de tempo; em qualquer instante `cursorAt(time)` diz onde o cursor está
 * e quanto está "pressionando". O hover e o clique da UI falsa são derivados
 * dessa posição, então cursor e interface nunca saem de sincronia.
 *
 *   const cursorAt = defineCursorPath({
 *     start: { x: 640, y: 700 },
 *     moves: [{ from: 2.4, to: 3.2, target: SEND_BUTTON, ease: "inOutCubic", arc: 18 }],
 *     clicks: [{ at: 3.3 }],
 *   });
 *   const { x, y, press } = cursorAt(time);
 *
 * Coordenadas na unidade do palco (ver `stage-scale.ts`).
 */

import { lerp, resolveEasing, windowProgress } from "./easing";
import type { EasingFunction, EasingName } from "./easing";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface CursorMove {
  /** Janela do deslocamento, em segundos. O cursor chega em `target` em `to`. */
  readonly from: number;
  readonly to: number;
  readonly target: Point;
  readonly ease?: EasingName | EasingFunction;
  /** Barriga do arco, perpendicular ao trajeto, na unidade do palco. Mão humana não anda em linha reta. */
  readonly arc?: number;
}

export interface CursorClick {
  /** Instante em que o botão começa a descer, em segundos. */
  readonly at: number;
  /** Duração do aperto (desce e volta). */
  readonly duration?: number;
}

export interface CursorPathSpec {
  readonly start: Point;
  readonly moves: readonly CursorMove[];
  readonly clicks?: readonly CursorClick[];
}

export interface CursorFrame {
  readonly x: number;
  readonly y: number;
  /** 0 solto, 1 no fundo do clique. */
  readonly press: number;
}

export type CursorPath = (time: number) => CursorFrame;

const DEFAULT_CLICK_SECONDS = 0.28;

interface ResolvedMove {
  readonly from: number;
  readonly to: number;
  readonly origin: Point;
  readonly target: Point;
  readonly ease: EasingFunction;
  readonly arc: number;
}

function isPoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function resolveMoves(spec: CursorPathSpec): readonly ResolvedMove[] {
  if (!isPoint(spec.start)) {
    throw new RangeError("defineCursorPath: `start` precisa de x e y finitos.");
  }
  const resolved: ResolvedMove[] = [];
  let origin = spec.start;
  let previousEnd = Number.NEGATIVE_INFINITY;
  spec.moves.forEach((move, index) => {
    const isWindowValid = Number.isFinite(move.from) && Number.isFinite(move.to) && move.to > move.from;
    if (!isWindowValid || move.from < previousEnd || !isPoint(move.target)) {
      throw new RangeError(
        `defineCursorPath: trecho ${index} inválido. Cada trecho precisa de from < to, alvo finito e começar depois do anterior.`,
      );
    }
    resolved.push({ from: move.from, to: move.to, origin, target: move.target, ease: resolveEasing(move.ease), arc: move.arc ?? 0 });
    origin = move.target;
    previousEnd = move.to;
  });
  return resolved;
}

function positionOn(move: ResolvedMove, time: number): Point {
  const progress = move.ease(windowProgress(time, move.from, move.to));
  const deltaX = move.target.x - move.origin.x;
  const deltaY = move.target.y - move.origin.y;
  const distance = Math.hypot(deltaX, deltaY);
  const bulge = distance === 0 ? 0 : (Math.sin(Math.PI * progress) * move.arc) / distance;
  return {
    x: lerp(move.origin.x, move.target.x, progress) - deltaY * bulge,
    y: lerp(move.origin.y, move.target.y, progress) + deltaX * bulge,
  };
}

function pressAt(clicks: readonly CursorClick[], time: number): number {
  let press = 0;
  for (const click of clicks) {
    const duration = click.duration ?? DEFAULT_CLICK_SECONDS;
    press = Math.max(press, Math.sin(Math.PI * windowProgress(time, click.at, click.at + duration)));
  }
  return press;
}

export function defineCursorPath(spec: CursorPathSpec): CursorPath {
  const moves = resolveMoves(spec);
  const clicks = spec.clicks ?? [];
  if (clicks.some((click) => !Number.isFinite(click.at) || (click.duration !== undefined && !(click.duration > 0)))) {
    throw new RangeError("defineCursorPath: clique inválido. Use `at` finito e `duration` maior que zero.");
  }
  return (time) => {
    const current = moves.findLast((move) => time >= move.from);
    const position = current === undefined ? spec.start : positionOn(current, time);
    return { x: position.x, y: position.y, press: pressAt(clicks, time) };
  };
}

/** Distância do cursor a um alvo: é dela que sai o hover da UI falsa. */
export function distanceTo(cursor: Point, target: Point): number {
  return Math.hypot(cursor.x - target.x, cursor.y - target.y);
}
