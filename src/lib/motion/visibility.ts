/**
 * Visibilidade de uma cena: está na viewport e a aba está à vista?
 * Base do Piso P5 (check `MOTION-OFFSCREEN`): animação contínua pausa fora da tela e com a aba oculta.
 *
 * Use dentro de um efeito e devolva a limpeza:
 *
 *   const stop = watchVisibility(section, ({ isInView, isPageVisible }) => { ... });
 *   return stop;
 */

export interface VisibilityState {
  readonly isInView: boolean;
  readonly isPageVisible: boolean;
}

export interface VisibilityOptions {
  /** Margem do `IntersectionObserver`. O padrão é a viewport exata. */
  readonly rootMargin?: string;
  readonly threshold?: number;
}

const DEFAULT_ROOT_MARGIN = "0px";
const DEFAULT_THRESHOLD = 0;

/**
 * Chama `onChange` na hora com o estado inicial e de novo a cada mudança real.
 * Antes de o observer responder, o alvo conta como fora da tela. Em navegador
 * sem `IntersectionObserver`, o alvo conta como sempre visível.
 */
export function watchVisibility(
  target: Element,
  onChange: (state: VisibilityState) => void,
  options: VisibilityOptions = {},
): () => void {
  const ownerDocument = target.ownerDocument;
  const hasObserver = typeof IntersectionObserver === "function";
  let current: VisibilityState = { isInView: !hasObserver, isPageVisible: !ownerDocument.hidden };

  const update = (next: VisibilityState): void => {
    if (next.isInView === current.isInView && next.isPageVisible === current.isPageVisible) {
      return;
    }
    current = next;
    onChange(current);
  };

  const handlePageVisibility = (): void => update({ ...current, isPageVisible: !ownerDocument.hidden });
  ownerDocument.addEventListener("visibilitychange", handlePageVisibility);

  const observer = hasObserver
    ? new IntersectionObserver(
        (entries) => {
          const latest = entries.at(-1);
          if (latest !== undefined) {
            update({ ...current, isInView: latest.isIntersecting });
          }
        },
        { rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN, threshold: options.threshold ?? DEFAULT_THRESHOLD },
      )
    : null;
  observer?.observe(target);
  onChange(current);

  return () => {
    observer?.disconnect();
    ownerDocument.removeEventListener("visibilitychange", handlePageVisibility);
  };
}
