import { describe, expect, it, vi } from "vitest";
import type { TrackedEvent } from "../events";
import { createDataLayerDestination, ensureDataLayer, toDataLayerEntry } from "./data-layer";
import type { DataLayerHost } from "./data-layer";
import { createMetaDestination, createTikTokDestination } from "./pixels";
import type { MetaPixelFunction, TikTokPixel } from "./pixels";

const EVENT_ID = "3f2b8c1e-7a4d-4e9b-9c1a-5d6e7f8a9b0c";

function eventOf(name: TrackedEvent["name"], params: TrackedEvent["params"]): TrackedEvent {
  return { name, params, eventId: EVENT_ID, occurredAt: "2026-11-24T12:00:00.000Z", attribution: { utm_source: "google", gclid: "abc" } };
}

const LEAD = eventOf("generate_lead", { form_id: "demo" });

describe("destino dataLayer (GTM)", () => {
  it("cria o dataLayer uma vez e reaproveita o que já existe", () => {
    const host: DataLayerHost = {};

    const created = ensureDataLayer(host);
    const reused = ensureDataLayer(host);

    expect(created).toEqual([]);
    expect(reused).toBe(created);
  });

  it("achata evento, event_id, atribuição e parâmetros em um nível só", () => {
    expect(toDataLayerEntry(LEAD)).toEqual({
      event: "generate_lead",
      event_id: EVENT_ID,
      event_time: "2026-11-24T12:00:00.000Z",
      form_id: "demo",
      utm_source: "google",
      gclid: "abc",
    });
  });

  it("não deixa um parâmetro sobrescrever o nome nem o id do evento", () => {
    const hostile = eventOf("cta_click", { cta_id: "x", event: "purchase", event_id: "outro" });

    expect(toDataLayerEntry(hostile)).toMatchObject({ event: "cta_click", event_id: EVENT_ID });
  });

  it("empurra o evento no array devolvido por getLayer e aceita qualquer categoria", () => {
    const layer: unknown[] = [];
    const destination = createDataLayerDestination(() => layer);

    destination.send(LEAD);

    expect(destination.requires).toBe("any");
    expect(layer).toEqual([toDataLayerEntry(LEAD)]);
  });
});

describe("destino Meta", () => {
  it("envia Lead como evento padrão, com o event_id em eventID", () => {
    const fbq = vi.fn<MetaPixelFunction>();
    const destination = createMetaDestination(() => fbq);

    destination.send(LEAD);

    expect(destination.requires).toBe("marketing");
    expect(fbq).toHaveBeenCalledWith("track", "Lead", { form_id: "demo" }, { eventID: EVENT_ID });
  });

  it("envia clique de CTA como evento personalizado e page_view como PageView", () => {
    const fbq = vi.fn<MetaPixelFunction>();
    const destination = createMetaDestination(() => fbq);

    destination.send(eventOf("cta_click", { cta_id: "hero" }));
    destination.send(eventOf("page_view", { page_path: "/" }));

    expect(fbq).toHaveBeenNthCalledWith(1, "trackCustom", "CtaClick", { cta_id: "hero" }, { eventID: EVENT_ID });
    expect(fbq).toHaveBeenNthCalledWith(2, "track", "PageView", { page_path: "/" }, { eventID: EVENT_ID });
  });

  it("ignora o evento sem erro enquanto o pixel não carregou", () => {
    const destination = createMetaDestination(() => undefined);

    expect(() => destination.send(LEAD)).not.toThrow();
  });
});

describe("destino TikTok", () => {
  function pixel() {
    return { page: vi.fn<TikTokPixel["page"]>(), track: vi.fn<TikTokPixel["track"]>() };
  }

  it("envia o lead como SubmitForm, com o mesmo event_id", () => {
    const ttq = pixel();
    const destination = createTikTokDestination(() => ttq);

    destination.send(LEAD);

    expect(destination.requires).toBe("marketing");
    expect(ttq.track).toHaveBeenCalledWith("SubmitForm", { form_id: "demo" }, { event_id: EVENT_ID });
  });

  it("usa ttq.page() para visualização de página e ClickButton para CTA", () => {
    const ttq = pixel();
    const destination = createTikTokDestination(() => ttq);

    destination.send(eventOf("page_view", { page_path: "/" }));
    destination.send(eventOf("cta_click", { cta_id: "hero" }));

    expect(ttq.page).toHaveBeenCalledTimes(1);
    expect(ttq.track).toHaveBeenCalledWith("ClickButton", { cta_id: "hero" }, { event_id: EVENT_ID });
  });

  it("ignora o evento sem erro enquanto o pixel não carregou", () => {
    const destination = createTikTokDestination(() => undefined);

    expect(() => destination.send(LEAD)).not.toThrow();
  });
});
