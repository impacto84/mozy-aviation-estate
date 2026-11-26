/**
 * Destino de teste: guarda os eventos em memória. Serve para provar, sem rede e sem
 * pixel, o que a camada de eventos entregou e em que ordem.
 */

import type { Destination, DestinationRequirement, TrackedEvent } from "../events";

export interface MemoryDestination extends Destination {
  /** Cópia dos eventos recebidos, na ordem de chegada. */
  events(): readonly TrackedEvent[];
  clear(): void;
}

export function createMemoryDestination(requires: DestinationRequirement = "any", name = "memory"): MemoryDestination {
  let received: readonly TrackedEvent[] = [];
  return {
    name,
    requires,
    send: (event) => {
      received = [...received, event];
    },
    events: () => received,
    clear: () => {
      received = [];
    },
  };
}
