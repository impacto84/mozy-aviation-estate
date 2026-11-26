/** Contas pequenas usadas dentro do laço de frame. Sem alocação, sem estado. */

export function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/**
 * Aproximação exponencial de `current` até `target`, independente da taxa de frames.
 * `lambda` é a rapidez (maior = mais rápido); `delta` é o tempo do frame em segundos.
 * Com `delta` zero (frame parado) o valor não muda.
 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}
