/**
 * Um relógio só (Piso P4): adapta um ticker compartilhado (o `gsap.ticker`) ao
 * contrato `FrameScheduler` de `clock.ts`. Com ele, Lenis, ScrollTrigger e toda
 * cena contínua da página pegam carona no mesmo `requestAnimationFrame`.
 *
 *   const scheduler = createTickerScheduler(gsap.ticker);
 *   createSceneClock(section, { onFrame, scheduler });
 *
 * O ouvinte só fica no ticker enquanto alguém espera um frame. Sem pedidos, ele
 * sai, e o ticker do GSAP pode dormir (ver `autoSleep` em references/gotchas.md).
 */

import type { FrameScheduler } from "./clock";

type TickerListener = (timeSeconds: number) => void;

/** O pedaço do `gsap.ticker` que este módulo usa. O tempo vem em segundos. */
export interface TickerLike {
  readonly add: (listener: TickerListener) => unknown;
  readonly remove: (listener: TickerListener) => unknown;
}

const MS_PER_SECOND = 1000;

export function createTickerScheduler(ticker: TickerLike): FrameScheduler {
  const pending = new Map<number, (timestampMs: number) => void>();
  let nextHandle = 1;
  let isListening = false;

  const detachWhenIdle = (): void => {
    if (isListening && pending.size === 0) {
      ticker.remove(flush);
      isListening = false;
    }
  };

  /** Entrega o frame a quem pediu até agora. Pedido feito durante a entrega fica para o próximo tick. */
  function flush(timeSeconds: number): void {
    const callbacks = [...pending.values()];
    pending.clear();
    try {
      for (const callback of callbacks) {
        callback(timeSeconds * MS_PER_SECOND);
      }
    } finally {
      detachWhenIdle();
    }
  }

  return {
    request(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      pending.set(handle, callback);
      if (!isListening) {
        ticker.add(flush);
        isListening = true;
      }
      return handle;
    },
    cancel(handle) {
      pending.delete(handle);
      detachWhenIdle();
    },
  };
}
