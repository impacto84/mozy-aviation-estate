/**
 * Parte em JavaScript do marquee. A animação é do CSS (`Marquee.module.css`);
 * daqui saem só duas coisas, escritas direto no DOM, sem estado do React:
 *   - `data-marquee-idle`: fora da viewport ou com a aba oculta, a faixa pausa (Piso P5);
 *   - `--marquee-duration`: duração calculada da largura medida, para a velocidade em px/s ser a mesma em qualquer tela.
 */

import { marqueeDurationSeconds } from "@/lib/motion/marquee";
import { watchVisibility } from "@/lib/motion/visibility";

export const MARQUEE_IDLE_ATTRIBUTE = "data-marquee-idle";
export const MARQUEE_DURATION_PROPERTY = "--marquee-duration";

const DURATION_DIGITS = 2;

function measureCycleDistance(group: HTMLElement): number {
  const viewport = group.parentElement;
  const gap = viewport === null ? 0 : Number.parseFloat(getComputedStyle(viewport).columnGap);
  return group.getBoundingClientRect().width + (Number.isFinite(gap) ? gap : 0);
}

/** Liga a pausa fora da tela e a duração por velocidade. Devolve a limpeza. */
export function startMarquee(root: HTMLElement, group: HTMLElement, speedPxPerSecond: number): () => void {
  const applyDuration = (): void => {
    const duration = marqueeDurationSeconds(measureCycleDistance(group), speedPxPerSecond);
    if (duration !== null) {
      root.style.setProperty(MARQUEE_DURATION_PROPERTY, `${duration.toFixed(DURATION_DIGITS)}s`);
    }
  };
  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(applyDuration) : null;
  resizeObserver?.observe(group);
  applyDuration();

  const stopWatchingVisibility = watchVisibility(root, ({ isInView, isPageVisible }) => {
    root.setAttribute(MARQUEE_IDLE_ATTRIBUTE, String(!(isInView && isPageVisible)));
  });

  return () => {
    resizeObserver?.disconnect();
    stopWatchingVisibility();
    root.setAttribute(MARQUEE_IDLE_ATTRIBUTE, "false");
    root.style.removeProperty(MARQUEE_DURATION_PROPERTY);
  };
}
