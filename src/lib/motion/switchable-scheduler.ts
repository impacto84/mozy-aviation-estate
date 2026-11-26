/**
 * Agendador de frames que troca de fonte sem que as cenas percebam.
 *
 * O motor de rolagem (GSAP, ScrollTrigger, Lenis) chega em um chunk lazy, depois
 * da hidratação. Até lá as cenas rodam no `requestAnimationFrame` do navegador;
 * quando o motor chega, passam a rodar no ticker dele. Em nenhum momento há duas
 * fontes servindo a mesma cena: a troca cancela os pedidos na fonte antiga e os
 * refaz na nova (Piso P4).
 *
 *   const scheduler = createSwitchableScheduler(browserScheduler);
 *   createSceneClock(section, { onFrame, scheduler });
 *   scheduler.use(tickerScheduler);   // quando o motor carregar
 *
 * As fontes contam o tempo a partir de origens diferentes. O tempo entregue é
 * emendado na troca, para a cena não dar um salto.
 */

import type { FrameScheduler } from "./clock";

export interface SwitchableScheduler extends FrameScheduler {
  /** Passa a agendar na fonte `next`. Os pedidos pendentes migram junto. */
  readonly use: (next: FrameScheduler) => void;
}

interface PendingFrame {
  readonly callback: (timestampMs: number) => void;
  readonly sourceHandle: number;
}

/** Intervalo assumido entre o último frame da fonte antiga e o primeiro da nova. */
const FRAME_GAP_MS = 1000 / 60;

interface TimeSplice {
  /** Marca que a próxima leitura vem de uma fonte nova. */
  readonly rebase: () => void;
  /** Converte o tempo da fonte atual para a linha do tempo contínua que as cenas veem. */
  readonly toContinuous: (sourceTimeMs: number) => number;
}

function createTimeSplice(): TimeSplice {
  let offsetMs = 0;
  let lastDeliveredMs: number | null = null;
  let shouldRebase = false;
  return {
    rebase() {
      shouldRebase = true;
    },
    toContinuous(sourceTimeMs) {
      if (shouldRebase) {
        shouldRebase = false;
        offsetMs = lastDeliveredMs === null ? 0 : lastDeliveredMs + FRAME_GAP_MS - sourceTimeMs;
      }
      lastDeliveredMs = sourceTimeMs + offsetMs;
      return lastDeliveredMs;
    },
  };
}

export function createSwitchableScheduler(initial: FrameScheduler): SwitchableScheduler {
  const pending = new Map<number, PendingFrame>();
  const time = createTimeSplice();
  let source = initial;
  let nextHandle = 1;

  const schedule = (handle: number, callback: (timestampMs: number) => void): void => {
    const sourceHandle = source.request((sourceTimeMs) => {
      pending.delete(handle);
      callback(time.toContinuous(sourceTimeMs));
    });
    pending.set(handle, { callback, sourceHandle });
  };

  return {
    request(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      schedule(handle, callback);
      return handle;
    },
    cancel(handle) {
      const frame = pending.get(handle);
      if (frame !== undefined) {
        source.cancel(frame.sourceHandle);
        pending.delete(handle);
      }
    },
    use(next) {
      if (next === source) {
        return;
      }
      const waiting = [...pending];
      for (const [, frame] of waiting) {
        source.cancel(frame.sourceHandle);
      }
      pending.clear();
      source = next;
      time.rebase();
      for (const [handle, frame] of waiting) {
        schedule(handle, frame.callback);
      }
    },
  };
}
