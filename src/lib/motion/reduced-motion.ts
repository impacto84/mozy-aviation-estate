/**
 * Preferência de movimento reduzido (Piso P1, check `MOTION-REDUCED`).
 *
 * Em CSS use `@media (prefers-reduced-motion: no-preference)` para ligar o movimento.
 * Em JS (laço de GL, Lenis, simulador) use estas duas funções, sempre dentro de um efeito.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface MotionMediaChange {
  readonly matches: boolean;
}

interface MotionMediaQuery {
  readonly matches: boolean;
  readonly addEventListener: (type: "change", listener: (event: MotionMediaChange) => void) => void;
  readonly removeEventListener: (type: "change", listener: (event: MotionMediaChange) => void) => void;
}

/** O pedaço de `window` que este módulo usa. `matchMedia` é opcional: jsdom e navegadores antigos não têm. */
export interface MotionMediaSource {
  readonly matchMedia?: (query: string) => MotionMediaQuery;
}

function resolveQuery(source: MotionMediaSource | undefined): MotionMediaQuery | null {
  const view = source ?? (typeof window === "undefined" ? undefined : window);
  if (view === undefined || typeof view.matchMedia !== "function") {
    return null;
  }
  return view.matchMedia(REDUCED_MOTION_QUERY);
}

/** `true` quando o visitante pediu menos movimento. Sem `matchMedia`, assume que não pediu. */
export function prefersReducedMotion(source?: MotionMediaSource): boolean {
  return resolveQuery(source)?.matches ?? false;
}

/**
 * Chama `onChange` na hora com o valor atual e de novo a cada mudança da preferência.
 * Devolve a função de limpeza.
 */
export function watchReducedMotion(onChange: (isReduced: boolean) => void, source?: MotionMediaSource): () => void {
  const query = resolveQuery(source);
  if (query === null) {
    onChange(false);
    return () => undefined;
  }
  const handleChange = (event: MotionMediaChange): void => onChange(event.matches);
  onChange(query.matches);
  query.addEventListener("change", handleChange);
  return () => query.removeEventListener("change", handleChange);
}
