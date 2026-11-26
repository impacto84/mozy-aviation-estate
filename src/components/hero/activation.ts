/**
 * Quando o hero pode começar a carregar a cena (Piso P3, check `GL-LAZY-THREE`).
 *
 * A cena só entra depois que o pôster e o texto já estão na tela. A ordem é:
 *   1. `load` da página (CSS, fontes e imagem do pôster já chegaram);
 *   2. o hero está na viewport (não vale baixar 3D para algo fora da tela);
 *   3. um frame foi pintado;
 *   4. a thread principal está ociosa.
 * Assim o chunk da cena nunca disputa rede nem CPU com o LCP.
 */

type Cancel = () => void;
type Step = (view: Window, host: Element, done: () => void) => Cancel;

/** Teto de espera pelo ócio: depois disso a cena carrega mesmo com a thread ocupada. */
const IDLE_TIMEOUT_MS = 1500;
/** Sem `requestIdleCallback` (Safari), espera este tempo depois do frame pintado. */
const IDLE_FALLBACK_DELAY_MS = 200;
/** Começa a carregar um pouco antes de o hero entrar na tela. */
const START_ROOT_MARGIN = "200px";

const noop: Cancel = () => undefined;

const whenLoaded: Step = (view, _host, done) => {
  if (view.document.readyState === "complete") {
    done();
    return noop;
  }
  view.addEventListener("load", done, { once: true });
  return () => view.removeEventListener("load", done);
};

const whenInView: Step = (_view, host, done) => {
  if (typeof IntersectionObserver !== "function") {
    done();
    return noop;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        done();
      }
    },
    { rootMargin: START_ROOT_MARGIN },
  );
  observer.observe(host);
  return () => observer.disconnect();
};

const whenPainted: Step = (view, _host, done) => {
  const handle = view.requestAnimationFrame(() => done());
  return () => view.cancelAnimationFrame(handle);
};

const whenIdle: Step = (view, _host, done) => {
  if (typeof view.requestIdleCallback === "function") {
    const handle = view.requestIdleCallback(() => done(), { timeout: IDLE_TIMEOUT_MS });
    return () => view.cancelIdleCallback(handle);
  }
  const handle = view.setTimeout(done, IDLE_FALLBACK_DELAY_MS);
  return () => view.clearTimeout(handle);
};

const START_STEPS: readonly Step[] = [whenLoaded, whenInView, whenPainted, whenIdle];

/**
 * Chama `onStart` uma vez, sempre de forma assíncrona, quando as quatro condições
 * foram cumpridas. Devolve a função que cancela a espera (use no cleanup do efeito).
 */
export function waitForHeroStart(host: Element, onStart: () => void): Cancel {
  const view = host.ownerDocument.defaultView;
  if (view === null) {
    return noop;
  }
  let isCancelled = false;
  let cancelCurrentStep = noop;

  const runStep = (index: number): void => {
    if (isCancelled) {
      return;
    }
    const step = START_STEPS[index];
    if (step === undefined) {
      onStart();
      return;
    }
    // Um passo já cumprido chama `done` na hora: o cancelamento que vale é o do passo seguinte.
    let hasCompleted = false;
    const cancelStep = step(view, host, () => {
      hasCompleted = true;
      runStep(index + 1);
    });
    if (!hasCompleted) {
      cancelCurrentStep = cancelStep;
    }
  };
  runStep(0);

  return () => {
    isCancelled = true;
    cancelCurrentStep();
  };
}
