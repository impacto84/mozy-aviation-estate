/**
 * Destino GTM: empurra o evento no `dataLayer`. O contêiner decide, tag por tag e
 * pelo Consent Mode, o que fazer com ele; por isso este destino aceita qualquer
 * categoria (`requires: "any"`).
 *
 * Formato: `{ event, event_id, event_time, ...atribuição, ...parâmetros }`, tudo em
 * um nível só, para virar variável de camada de dados no GTM sem transformação.
 */

import type { Destination, DestinationRequirement, TrackedEvent } from "../events";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export interface DataLayerHost {
  dataLayer?: unknown[];
}

export type DataLayerEntry = Readonly<Record<string, string | number | boolean>>;

/** O array do GTM, criado na primeira vez (`window.dataLayer = window.dataLayer || []`). */
export function ensureDataLayer(host: DataLayerHost): unknown[] {
  if (!Array.isArray(host.dataLayer)) {
    host.dataLayer = [];
  }
  return host.dataLayer;
}

export function toDataLayerEntry(event: TrackedEvent): DataLayerEntry {
  return Object.freeze({
    ...event.attribution,
    ...event.params,
    event: event.name,
    event_id: event.eventId,
    event_time: event.occurredAt,
  });
}

/**
 * `requires` padrão `any` (o GTM decide pelo Consent Mode). Sem GTM configurado o
 * runtime passa `first-party`: a `dataLayer` é só um array da página, sem tag que a leia.
 */
export function createDataLayerDestination(getLayer: () => unknown[], requires: DestinationRequirement = "any"): Destination {
  return {
    name: "gtm",
    requires,
    send: (event) => {
      getLayer().push(toDataLayerEntry(event));
    },
  };
}
