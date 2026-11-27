/**
 * Reveal na rolagem, seguro por construção: o conteúdo nasce visível.
 *
 * Nada no CSS esconde o elemento por conta própria. Quem esconde é este módulo,
 * depois que o JavaScript rodou, e só quando faz sentido:
 *   - com `prefers-reduced-motion: reduce`: não esconde (Piso P1);
 *   - sem `IntersectionObserver`: não esconde;
 *   - elemento que já está na tela ou acima dela: não esconde (nada pisca na primeira dobra).
 * Só o que está abaixo da dobra recebe `data-reveal-state="pending"`, e ganha
 * `"in"` na primeira vez que aparece. A transição é do CSS (`Reveal.module.css`):
 * não há laço de frames nem tween, então não há relógio para pausar.
 *
 * Sem JavaScript, com erro de script ou com movimento reduzido, o atributo nunca
 * é escrito e o conteúdo fica como veio do servidor: visível (`MOTION-STUCK-HIDDEN`).
 */

import { prefersReducedMotion } from "./reduced-motion";
import type { MotionMediaSource } from "./reduced-motion";

export const REVEAL_STATE_ATTRIBUTE = "data-reveal-state";

export type RevealState = "pending" | "in";

export interface RevealOptions {
  /** Margem do observer. O padrão dispara quando o elemento entra 10% acima da borda de baixo. */
  readonly rootMargin?: string;
  readonly threshold?: number;
  /** Fonte de `matchMedia`, para teste. O padrão é `window`. */
  readonly media?: MotionMediaSource;
}

const DEFAULT_ROOT_MARGIN = "0px 0px -10% 0px";
const DEFAULT_THRESHOLD = 0;

function isBelowTheFold(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (view === null) {
    return false;
  }
  return element.getBoundingClientRect().top >= view.innerHeight;
}

/**
 * Arma o reveal de um elemento. Chame dentro de um efeito e devolva a limpeza.
 * A limpeza remove o atributo, o que devolve o elemento ao estado visível.
 */
export function armReveal(element: HTMLElement, options: RevealOptions = {}): () => void {
  const canObserve = typeof IntersectionObserver === "function";
  if (!canObserve || prefersReducedMotion(options.media) || !isBelowTheFold(element)) {
    return () => undefined;
  }
  element.setAttribute(REVEAL_STATE_ATTRIBUTE, "pending" satisfies RevealState);
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        element.setAttribute(REVEAL_STATE_ATTRIBUTE, "in" satisfies RevealState);
        observer.disconnect();
      }
    },
    { rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN, threshold: options.threshold ?? DEFAULT_THRESHOLD },
  );
  observer.observe(element);
  return () => {
    observer.disconnect();
    element.removeAttribute(REVEAL_STATE_ATTRIBUTE);
  };
}
