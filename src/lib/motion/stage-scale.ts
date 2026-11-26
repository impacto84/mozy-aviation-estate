/**
 * Palco de tamanho fixo: toda a geometria do simulador (inclusive o caminho do
 * cursor) é escrita em uma unidade fixa, e a responsividade é uma única
 * multiplicação. Este módulo calcula essa multiplicação.
 *
 *   const scale = fitScale({ width: host.clientWidth, height: host.clientHeight }, { width: 600, height: 640 });
 *   if (scale !== null) stage.style.setProperty("--sim-scale", String(scale));
 *
 * Chame dentro de um `ResizeObserver`. `contain` mostra o palco inteiro; `cover`
 * preenche o contêiner e corta as bordas.
 */

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type FitMode = "contain" | "cover";

function hasArea(size: Size): boolean {
  return Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0;
}

/**
 * Fator de escala para o palco caber no contêiner. Devolve `null` quando o
 * contêiner ainda não tem área (fora do layout, `display: none`): quem chama
 * mantém a escala anterior em vez de zerar o palco.
 */
export function fitScale(container: Size, stage: Size, mode: FitMode = "contain"): number | null {
  if (!hasArea(stage)) {
    throw new RangeError(`fitScale: palco inválido (${String(stage.width)} x ${String(stage.height)}). Largura e altura maiores que zero.`);
  }
  if (!hasArea(container)) {
    return null;
  }
  const horizontal = container.width / stage.width;
  const vertical = container.height / stage.height;
  return mode === "cover" ? Math.max(horizontal, vertical) : Math.min(horizontal, vertical);
}
