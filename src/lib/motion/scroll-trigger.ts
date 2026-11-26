/**
 * O laço escondido do ScrollTrigger.
 *
 * Ao ser habilitado, o ScrollTrigger do GSAP liga um `requestAnimationFrame` que
 * se reagenda para sempre e não faz nada (`_rafBugFix`, um paliativo de repintura
 * para navegadores antigos). Esse laço roda em toda página, inclusive com
 * `prefers-reduced-motion: reduce`, com a aba oculta e sem nenhum trigger criado.
 * Fere o Piso P1 e P4 e derruba `MOTION-REDUCED` e `MOTION-SINGLE-CLOCK` no gate.
 *
 * `silenceKeepAlive` habilita o ScrollTrigger capturando esse primeiro pedido de
 * frame. A função capturada é o próprio laço: enquanto o filtro existe, todo
 * pedido dela é descartado, o que também mata um laço que já estivesse rodando.
 * Dois frames depois o filtro sai e `requestAnimationFrame` volta a ser o que era.
 *
 * Conferido com gsap 3.15.1 (teste em `components/motion/scroll-runtime.test.ts`
 * e e2e). Ao subir o gsap, rode os dois de novo.
 */

/** O pedaço de `window` que este módulo troca por um instante. */
export interface FrameHost {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
}

const DROPPED_HANDLE = 0;

/**
 * Roda `enable` (que precisa chamar `ScrollTrigger.enable()` de forma síncrona)
 * e descarta o laço de keep-alive. `enable` recebe `hasCaptured`, que diz se o
 * laço já foi pego: quando o plugin já estava registrado, `registerPlugin` não
 * habilita de novo e é preciso chamar `disable()` e `enable()` à mão.
 *
 * Devolve uma função que remove o filtro na hora (limpeza de teste ou de efeito).
 */
export function silenceKeepAlive(host: FrameHost, enable: (hasCaptured: () => boolean) => void): () => void {
  const previous = host.requestAnimationFrame;
  let keepAlive: FrameRequestCallback | null = null;
  let isCapturing = true;

  const filtered = (callback: FrameRequestCallback): number => {
    if (isCapturing && keepAlive === null) {
      keepAlive = callback;
      return DROPPED_HANDLE;
    }
    if (callback === keepAlive) {
      return DROPPED_HANDLE;
    }
    return previous.call(host, callback);
  };
  const restore = (): void => {
    if (host.requestAnimationFrame === filtered) {
      host.requestAnimationFrame = previous;
    }
  };

  host.requestAnimationFrame = filtered;
  try {
    enable(() => keepAlive !== null);
  } catch (error) {
    restore();
    throw error;
  } finally {
    isCapturing = false;
  }
  if (keepAlive === null) {
    restore();
    return restore;
  }
  // Um laço que já rodava tem um callback pendente. Ele dispara no próximo frame,
  // tenta se reagendar e é descartado pelo filtro. No frame seguinte o filtro sai.
  previous.call(host, () => previous.call(host, restore));
  return restore;
}
