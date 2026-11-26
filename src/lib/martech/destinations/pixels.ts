/**
 * Destinos de pixel direto (Meta e TikTok) como interfaces: recebem a função do pixel
 * já carregado e traduzem o evento, levando o mesmo `event_id` para deduplicar com o
 * envio de servidor.
 *
 * Use um destes só em site SEM gerenciador de tags. Com GTM, o pixel mora no
 * contêiner e lê `event_id` do dataLayer: ligar os dois caminhos inicializa o pixel
 * duas vezes (GATES `TRACK-PIXEL-ONCE`). Este arquivo não carrega script de ninguém.
 */

import type { Destination, EventName, TrackedEvent } from "../events";

/** Assinatura de `fbq` usada aqui: `fbq('track', nome, parâmetros, { eventID })`. */
export type MetaPixelFunction = (
  command: "track" | "trackCustom",
  eventName: string,
  params: Readonly<Record<string, unknown>>,
  options: { readonly eventID: string },
) => void;

/** Parte de `ttq` usada aqui: `ttq.page()` e `ttq.track(nome, parâmetros, { event_id })`. */
export interface TikTokPixel {
  page(): void;
  track(eventName: string, params: Readonly<Record<string, unknown>>, options: { readonly event_id: string }): void;
}

interface PixelEventName {
  readonly name: string;
  readonly isStandard: boolean;
}

const META_EVENTS: Readonly<Record<EventName, PixelEventName>> = {
  page_view: { name: "PageView", isStandard: true },
  generate_lead: { name: "Lead", isStandard: true },
  cta_click: { name: "CtaClick", isStandard: false },
};

/** `page_view` não está aqui: no TikTok a visualização de página é `ttq.page()`. */
const TIKTOK_EVENTS: Readonly<Record<Exclude<EventName, "page_view">, string>> = {
  generate_lead: "SubmitForm",
  cta_click: "ClickButton",
};

/** `getPixel` devolve `undefined` enquanto o pixel não carregou: o evento é ignorado, sem erro. */
export function createMetaDestination(getPixel: () => MetaPixelFunction | undefined): Destination {
  return {
    name: "meta",
    requires: "marketing",
    send: (event: TrackedEvent) => {
      const mapped = META_EVENTS[event.name];
      getPixel()?.(mapped.isStandard ? "track" : "trackCustom", mapped.name, { ...event.params }, { eventID: event.eventId });
    },
  };
}

export function createTikTokDestination(getPixel: () => TikTokPixel | undefined): Destination {
  return {
    name: "tiktok",
    requires: "marketing",
    send: (event: TrackedEvent) => {
      const pixel = getPixel();
      if (pixel === undefined) {
        return;
      }
      if (event.name === "page_view") {
        pixel.page();
        return;
      }
      pixel.track(TIKTOK_EVENTS[event.name], { ...event.params }, { event_id: event.eventId });
    },
  };
}
