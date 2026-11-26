/**
 * Camada de eventos: `track(event)` tipado, um `event_id` por evento, fila até o
 * visitante decidir o consentimento e destinos plugáveis.
 *
 * - Consentimento `unknown`: o evento fica na fila, em memória. Nada é enviado.
 * - Decidiu: a fila é entregue aos destinos cuja categoria foi aceita e esvaziada;
 *   o que era de categoria recusada é descartado.
 * - Depois da decisão cada evento vai na hora, só aos destinos permitidos.
 *
 * Os parâmetros são fechados por tipo e não têm campo de dado pessoal: e-mail,
 * telefone e nome nunca entram em evento.
 */

import type { ConsentCategory, ConsentState, ConsentStore } from "./consent";
import { createEventId, isEventId } from "./event-id";
import { EMPTY_ATTRIBUTION } from "./utm";
import type { Attribution } from "./utm";

export interface EventParamsMap {
  readonly page_view: { readonly page_path: string };
  readonly generate_lead: { readonly form_id: string };
  readonly cta_click: { readonly cta_id: string };
}

export type EventName = keyof EventParamsMap;
export type EventParamValue = string | number | boolean;

export type TrackInput = {
  readonly [Name in EventName]: {
    readonly name: Name;
    readonly params: EventParamsMap[Name];
    /** Informe quando o id já foi gerado antes (ex.: enviado ao servidor junto com o lead). */
    readonly eventId?: string;
  };
}[EventName];

export interface TrackedEvent {
  readonly name: EventName;
  readonly params: Readonly<Record<string, EventParamValue>>;
  readonly eventId: string;
  /** ISO 8601 do momento em que `track` foi chamado. */
  readonly occurredAt: string;
  readonly attribution: Attribution;
}

/** `any`: o destino recebe eventos com qualquer categoria aceita (caso do GTM, que decide por tag). */
export type DestinationRequirement = ConsentCategory | "any";

export interface Destination {
  readonly name: string;
  readonly requires: DestinationRequirement;
  send(event: TrackedEvent): void;
}

export interface DestinationFailure {
  readonly destination: string;
  readonly eventId: string;
  readonly error: unknown;
}

export interface TrackerOptions {
  readonly consent: Pick<ConsentStore, "get" | "onChange">;
  readonly destinations: readonly Destination[];
  readonly createId?: () => string;
  readonly now?: () => Date;
  readonly getAttribution?: () => Attribution;
  readonly maxQueue?: number;
  /** Falha de um destino não derruba os outros; chega aqui para o site decidir o que fazer. */
  readonly onError?: (failure: DestinationFailure) => void;
}

export interface Tracker {
  /** Registra o evento e devolve o `event_id` usado. */
  track(input: TrackInput): string;
  /** Eventos esperando a decisão de consentimento. */
  pending(): number;
  /** Solta o ouvinte de consentimento e esvazia a fila. */
  dispose(): void;
}

export const DEFAULT_MAX_QUEUE = 50;

export function isDestinationAllowed(requirement: DestinationRequirement, state: ConsentState): boolean {
  if (state.status !== "decided") {
    return false;
  }
  return requirement === "any" ? state.choices.analytics || state.choices.marketing : state.choices[requirement];
}

function toTrackedEvent(input: TrackInput, options: TrackerOptions): TrackedEvent {
  const createId = options.createId ?? createEventId;
  const now = options.now ?? (() => new Date());
  return Object.freeze({
    name: input.name,
    params: Object.freeze({ ...input.params }),
    eventId: isEventId(input.eventId) ? input.eventId : createId(),
    occurredAt: now().toISOString(),
    attribution: options.getAttribution?.() ?? EMPTY_ATTRIBUTION,
  });
}

export function createTracker(options: TrackerOptions): Tracker {
  const maxQueue = options.maxQueue ?? DEFAULT_MAX_QUEUE;
  let queue: readonly TrackedEvent[] = [];

  const deliver = (event: TrackedEvent, state: ConsentState): void => {
    for (const destination of options.destinations) {
      if (!isDestinationAllowed(destination.requires, state)) {
        continue;
      }
      try {
        destination.send(event);
      } catch (error) {
        options.onError?.({ destination: destination.name, eventId: event.eventId, error });
      }
    }
  };

  const flush = (state: ConsentState): void => {
    if (state.status !== "decided") {
      return;
    }
    const waiting = queue;
    queue = [];
    for (const event of waiting) {
      deliver(event, state);
    }
  };

  const unsubscribe = options.consent.onChange(flush);

  return {
    track: (input) => {
      const event = toTrackedEvent(input, options);
      const state = options.consent.get();
      if (state.status === "decided") {
        deliver(event, state);
      } else {
        // Fila limitada: sem decisão por muito tempo, os eventos mais antigos saem.
        queue = [...queue, event].slice(-maxQueue);
      }
      return event.eventId;
    },
    pending: () => queue.length,
    dispose: () => {
      unsubscribe();
      queue = [];
    },
  };
}
