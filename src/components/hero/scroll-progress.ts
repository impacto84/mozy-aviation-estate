/**
 * Progresso de rolagem de uma seção, de 0 (topo da seção no topo da viewport)
 * a 1 (a seção saiu inteira por cima).
 *
 * É um "valor externo": a cena só lê `source.current` dentro do próprio frame.
 * Quem escreve pode ser este rastreador ou qualquer outra fonte com o mesmo
 * formato (um `ScrollTrigger` do GSAP gravando em `{ current }`, por exemplo).
 * Não há laço aqui: a medida acontece no evento de rolagem (Piso P4).
 */

import { clamp01 } from "./scene-math";

/** Só leitura para quem consome. Valor entre 0 e 1. */
export interface ProgressSource {
  readonly current: number;
}

export interface ScrollProgressTracker {
  readonly source: ProgressSource;
  readonly stop: () => void;
}

interface SectionRect {
  readonly top: number;
  readonly height: number;
}

export function computeScrollProgress(rect: SectionRect): number {
  if (!(rect.height > 0)) {
    return 0;
  }
  return clamp01(-rect.top / rect.height);
}

export function trackScrollProgress(element: Element): ScrollProgressTracker {
  const view = element.ownerDocument.defaultView;
  // Exceção documentada à imutabilidade: valor por frame mora em um objeto mutável, como uma ref.
  const state = { current: computeScrollProgress(element.getBoundingClientRect()) };
  const measure = (): void => {
    state.current = computeScrollProgress(element.getBoundingClientRect());
  };
  view?.addEventListener("scroll", measure, { passive: true });
  view?.addEventListener("resize", measure, { passive: true });
  return {
    source: state,
    stop() {
      view?.removeEventListener("scroll", measure);
      view?.removeEventListener("resize", measure);
    },
  };
}
