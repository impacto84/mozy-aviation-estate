import { describe, expect, it, vi } from "vitest";
import { createConsentStore } from "./consent";
import type { ConsentStore } from "./consent";
import { createMemoryDestination } from "./destinations/memory";
import { createEventId, isEventId, UUID_V4_PATTERN } from "./event-id";
import type { CryptoSource } from "./event-id";
import { DEFAULT_MAX_QUEUE, createTracker, isDestinationAllowed } from "./events";
import type { Destination, TrackInput } from "./events";
import { createMemoryStorage } from "./storage";

const NOW = new Date("2026-11-24T12:00:00.000Z");
const LEAD: TrackInput = { name: "generate_lead", params: { form_id: "demo" } };
const KNOWN_ID = "3f2b8c1e-7a4d-4e9b-9c1a-5d6e7f8a9b0c";

function freshConsent(): ConsentStore {
  return createConsentStore({ storage: createMemoryStorage(), now: () => NOW });
}

describe("createEventId", () => {
  it("gera um UUID v4 diferente a cada chamada", () => {
    const first = createEventId();
    const second = createEventId();

    expect(first).toMatch(UUID_V4_PATTERN);
    expect(second).not.toBe(first);
  });

  it("usa getRandomValues quando randomUUID não existe (página em http)", () => {
    const source: CryptoSource = { getRandomValues: crypto.getRandomValues.bind(crypto) };

    const id = createEventId(source);

    expect(id).toMatch(UUID_V4_PATTERN);
    expect(isEventId(id)).toBe(true);
  });

  it("falha com mensagem clara quando não há Web Crypto", () => {
    expect(() => createEventId({})).toThrow("Web Crypto indisponível");
  });

  it("isEventId recusa o que não é UUID v4", () => {
    expect(isEventId("123")).toBe(false);
    expect(isEventId(undefined)).toBe(false);
    expect(isEventId(KNOWN_ID)).toBe(true);
  });
});

describe("isDestinationAllowed", () => {
  it("nunca libera destino antes da decisão", () => {
    expect(isDestinationAllowed("any", freshConsent().get())).toBe(false);
  });

  it("libera por categoria depois da decisão", () => {
    const consent = freshConsent();
    const state = consent.set({ analytics: true, marketing: false });

    expect(isDestinationAllowed("analytics", state)).toBe(true);
    expect(isDestinationAllowed("marketing", state)).toBe(false);
    expect(isDestinationAllowed("any", state)).toBe(true);
    expect(isDestinationAllowed("any", consent.rejectAll())).toBe(false);
  });
});

describe("createTracker", () => {
  it("segura o evento na fila enquanto o consentimento não foi decidido", () => {
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent: freshConsent(), destinations: [destination] });

    const eventId = tracker.track(LEAD);

    expect(eventId).toMatch(UUID_V4_PATTERN);
    expect(tracker.pending()).toBe(1);
    expect(destination.events()).toEqual([]);
  });

  it("entrega a fila, na ordem, quando o visitante aceita", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination] });
    tracker.track({ name: "page_view", params: { page_path: "/" } });
    tracker.track(LEAD);

    consent.acceptAll();

    expect(destination.events().map((event) => event.name)).toEqual(["page_view", "generate_lead"]);
    expect(tracker.pending()).toBe(0);
  });

  it("descarta a fila quando o visitante recusa", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination] });
    tracker.track(LEAD);

    consent.rejectAll();

    expect(destination.events()).toEqual([]);
    expect(tracker.pending()).toBe(0);
  });

  it("depois da decisão, entrega na hora e só aos destinos da categoria aceita", () => {
    const consent = freshConsent();
    const analytics = createMemoryDestination("analytics", "medicao");
    const marketing = createMemoryDestination("marketing", "anuncios");
    const tracker = createTracker({ consent, destinations: [analytics, marketing] });
    consent.set({ analytics: true, marketing: false });

    tracker.track(LEAD);

    expect(analytics.events()).toHaveLength(1);
    expect(marketing.events()).toEqual([]);
    expect(tracker.pending()).toBe(0);
  });

  it("não reenvia evento antigo quando uma categoria é aceita depois", () => {
    const consent = freshConsent();
    const marketing = createMemoryDestination("marketing");
    const tracker = createTracker({ consent, destinations: [marketing] });
    consent.rejectAll();
    tracker.track(LEAD);

    consent.acceptAll();

    expect(marketing.events()).toEqual([]);
  });

  it("entrega o mesmo event_id a todos os destinos", () => {
    const consent = freshConsent();
    const first = createMemoryDestination("any", "a");
    const second = createMemoryDestination("marketing", "b");
    const tracker = createTracker({ consent, destinations: [first, second] });
    consent.acceptAll();

    const eventId = tracker.track(LEAD);

    expect(first.events()[0]?.eventId).toBe(eventId);
    expect(second.events()[0]?.eventId).toBe(eventId);
  });

  it("usa o event_id informado quando ele é um UUID válido e gera outro quando não é", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination], createId: () => KNOWN_ID });
    consent.acceptAll();

    const kept = tracker.track({ ...LEAD, eventId: "9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d" });
    const replaced = tracker.track({ ...LEAD, eventId: "nao-e-uuid" });

    expect(kept).toBe("9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d");
    expect(replaced).toBe(KNOWN_ID);
  });

  it("carimba o evento com data, atribuição e parâmetros congelados", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({
      consent,
      destinations: [destination],
      now: () => NOW,
      getAttribution: () => ({ utm_source: "google" }),
    });
    consent.acceptAll();

    tracker.track(LEAD);

    const event = destination.events()[0];
    expect(event).toMatchObject({ occurredAt: NOW.toISOString(), attribution: { utm_source: "google" }, params: { form_id: "demo" } });
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event?.params)).toBe(true);
  });

  it("limita a fila e descarta os eventos mais antigos", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination], maxQueue: 2 });
    tracker.track({ name: "cta_click", params: { cta_id: "a" } });
    tracker.track({ name: "cta_click", params: { cta_id: "b" } });
    tracker.track({ name: "cta_click", params: { cta_id: "c" } });

    consent.acceptAll();

    expect(destination.events().map((event) => event.params.cta_id)).toEqual(["b", "c"]);
    expect(DEFAULT_MAX_QUEUE).toBeGreaterThan(2);
  });

  it("um destino que falha não impede os outros e o erro chega a onError", () => {
    const consent = freshConsent();
    const broken: Destination = {
      name: "quebrado",
      requires: "any",
      send: () => {
        throw new Error("pixel fora do ar");
      },
    };
    const healthy = createMemoryDestination();
    const onError = vi.fn();
    const tracker = createTracker({ consent, destinations: [broken, healthy], onError });
    consent.acceptAll();

    const eventId = tracker.track(LEAD);

    expect(healthy.events()).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ destination: "quebrado", eventId }));
  });

  it("dispose solta o ouvinte de consentimento e esvazia a fila", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination] });
    tracker.track(LEAD);

    tracker.dispose();
    consent.acceptAll();

    expect(tracker.pending()).toBe(0);
    expect(destination.events()).toEqual([]);
  });
});

describe("createMemoryDestination", () => {
  it("clear esvazia os eventos guardados", () => {
    const consent = freshConsent();
    const destination = createMemoryDestination();
    const tracker = createTracker({ consent, destinations: [destination] });
    consent.acceptAll();
    tracker.track(LEAD);

    destination.clear();

    expect(destination.events()).toEqual([]);
    expect(destination.name).toBe("memory");
  });
});
