/**
 * Conta do marquee: a velocidade é dada em px/s, não em duração, para a faixa
 * andar no mesmo ritmo em qualquer largura. A duração do ciclo sai da distância
 * medida (largura de um grupo de itens mais o vão).
 */

/** Velocidade padrão da faixa de logos, em px por segundo. Lenta o bastante para ler os nomes. */
export const MARQUEE_DEFAULT_SPEED = 40;

/**
 * Duração de um ciclo, em segundos. Devolve `null` quando a distância ainda não
 * foi medida (grupo fora do layout): quem chama mantém a duração padrão do CSS.
 */
export function marqueeDurationSeconds(distancePx: number, speedPxPerSecond: number): number | null {
  if (!Number.isFinite(speedPxPerSecond) || speedPxPerSecond <= 0) {
    throw new RangeError(`marqueeDurationSeconds: velocidade inválida (${String(speedPxPerSecond)}). Use px por segundo, maior que zero.`);
  }
  if (!Number.isFinite(distancePx) || distancePx <= 0) {
    return null;
  }
  return distancePx / speedPxPerSecond;
}
