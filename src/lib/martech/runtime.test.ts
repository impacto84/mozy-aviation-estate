import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attribution, createAttributionStore, resetBrowserAttributionForTests } from "./attribution-store";
import { consent, createConsentStore, resetBrowserConsentForTests } from "./consent";
import type { ConsentStore } from "./consent";
import { readConsentCommands } from "./consent-mode";
import { createMemoryDestination } from "./destinations/memory";
import { createMartechRuntime, ensureMartechRuntime, resetMartechRuntimeForTests } from "./runtime";
import type { MartechEnvironment } from "./runtime";
import { createMemoryStorage } from "./storage";
import { GTM_SCRIPT_BASE, TAG_MARKER_ATTRIBUTE, gtmScriptUrl, loadGtm } from "./tag-loader";
import { ATTRIBUTION_STORAGE_KEY } from "./utm";

/** ID de teste: formato válido, não pertence a ninguém. Nenhuma requisição sai do jsdom. */
const TEST_GTM_ID = ["GTM", "TESTE01"].join("-");
const GTM_SELECTOR = `script[${TAG_MARKER_ATTRIBUTE}="gtm"]`;

function gtmScripts(): readonly HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>(GTM_SELECTOR)];
}

function environment(store: ConsentStore, search = ""): MartechEnvironment {
  return { host: window, search, consent: store, attribution: createAttributionStore(createMemoryStorage()) };
}

function eventNames(): readonly unknown[] {
  return (window.dataLayer ?? []).flatMap((entry) =>
    entry !== null && typeof entry === "object" && "event" in entry ? [(entry as { event: unknown }).event] : [],
  );
}

beforeEach(() => {
  delete window.dataLayer;
});

afterEach(() => {
  for (const script of gtmScripts()) {
    script.remove();
  }
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetMartechRuntimeForTests();
  resetBrowserConsentForTests();
  resetBrowserAttributionForTests();
});

describe("loadGtm", () => {
  it("monta a URL oficial do contêiner e recusa ID fora do formato", () => {
    expect(gtmScriptUrl(TEST_GTM_ID)).toBe(`${GTM_SCRIPT_BASE}?id=${TEST_GTM_ID}`);
    expect(() => gtmScriptUrl("x' onerror='alert(1)")).toThrow("ID de contêiner GTM inválido");
  });

  it("insere o script uma única vez, mesmo chamado duas vezes (TRACK-PIXEL-ONCE)", () => {
    const first = loadGtm(window, TEST_GTM_ID, () => 1000);
    const second = loadGtm(window, TEST_GTM_ID, () => 2000);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(gtmScripts()).toHaveLength(1);
    expect(gtmScripts()[0]?.async).toBe(true);
    expect(window.dataLayer).toEqual([{ "gtm.start": 1000, event: "gtm.js" }]);
  });
});

describe("createMartechRuntime", () => {
  it("antes de qualquer escolha: só o consent default negado, nenhuma tag", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });

    createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(store));

    expect(readConsentCommands(window.dataLayer ?? [])).toEqual([
      { action: "default", state: { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" } },
    ]);
    expect(gtmScripts()).toHaveLength(0);
  });

  it("carrega a tag só depois do aceite, com o consent update antes dos eventos da fila", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const runtime = createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(store));
    runtime.track({ name: "page_view", params: { page_path: "/" } });
    expect(runtime.pending()).toBe(1);

    store.acceptAll();

    const layer = window.dataLayer ?? [];
    const updateIndex = layer.findIndex((entry) => readConsentCommands([entry])[0]?.action === "update");
    const eventIndex = layer.findIndex((entry) => entry !== null && typeof entry === "object" && "event" in entry && entry.event === "page_view");
    expect(gtmScripts()).toHaveLength(1);
    expect(updateIndex).toBeGreaterThan(0);
    expect(eventIndex).toBeGreaterThan(updateIndex);
    expect(runtime.pending()).toBe(0);
  });

  it("recusa: consent update negado, nenhuma tag e nenhum evento no dataLayer", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const runtime = createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(store));
    runtime.track({ name: "generate_lead", params: { form_id: "demo" } });

    store.rejectAll();
    runtime.track({ name: "generate_lead", params: { form_id: "demo" } });

    expect(readConsentCommands(window.dataLayer ?? []).map((command) => command.action)).toEqual(["default", "update"]);
    expect(gtmScripts()).toHaveLength(0);
    expect(eventNames()).toEqual([]);
  });

  it("visitante que já tinha aceitado: default, update e tag logo ao iniciar", () => {
    const storage = createMemoryStorage();
    createConsentStore({ storage }).set({ analytics: true, marketing: false });

    createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(createConsentStore({ storage })));

    const commands = readConsentCommands(window.dataLayer ?? []);
    expect(commands.map((command) => command.action)).toEqual(["default", "update"]);
    expect(commands[1]?.state).toMatchObject({ analytics_storage: "granted", ad_storage: "denied" });
    expect(gtmScripts()).toHaveLength(1);
  });

  it("sem ID configurado não carrega tag nem depois do aceite", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    createMartechRuntime({ gtmId: null }, environment(store));

    store.acceptAll();

    expect(gtmScripts()).toHaveLength(0);
    expect(document.querySelectorAll("script[src]")).toHaveLength(0);
  });

  it("sem GTM, a conversão vai na hora para a dataLayer local e nada sai do navegador", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const runtime = createMartechRuntime({ gtmId: null }, environment(store));

    const eventId = runtime.track({ name: "generate_lead", params: { form_id: "data-room" } });

    expect(window.dataLayer?.at(-1)).toMatchObject({ event: "generate_lead", event_id: eventId });
    expect(runtime.pending()).toBe(0);
    expect(document.querySelectorAll("script[src]")).toHaveLength(0);

    store.acceptAll();
    expect(eventNames().filter((name) => name === "generate_lead")).toHaveLength(1);
  });

  it("com GTM, o evento espera o consentimento (Piso P9)", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const runtime = createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(store));

    runtime.track({ name: "generate_lead", params: { form_id: "data-room" } });

    expect(eventNames()).not.toContain("generate_lead");
    expect(runtime.pending()).toBe(1);
  });

  it("captura a campanha da URL de entrada e a carimba em cada evento", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const memory = createMemoryDestination();
    const env = { ...environment(store, "?utm_source=google&gclid=abc"), extraDestinations: [memory] };
    const runtime = createMartechRuntime({ gtmId: null }, env);
    store.acceptAll();

    const eventId = runtime.track({ name: "generate_lead", params: { form_id: "demo" } });

    expect(memory.events()[0]).toMatchObject({ eventId, attribution: { utm_source: "google", gclid: "abc" } });
    expect(window.dataLayer?.at(-1)).toMatchObject({ event: "generate_lead", event_id: eventId, utm_source: "google", gclid: "abc" });
  });

  it("dispose para de reagir ao consentimento", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const runtime = createMartechRuntime({ gtmId: TEST_GTM_ID }, environment(store));

    runtime.dispose();
    store.acceptAll();

    expect(gtmScripts()).toHaveLength(0);
  });
});

describe("ensureMartechRuntime", () => {
  it("cria um runtime só por aba, ligado aos stores do navegador", () => {
    window.history.replaceState(null, "", "/?utm_source=parceiro");

    const first = ensureMartechRuntime({ gtmId: TEST_GTM_ID });
    const second = ensureMartechRuntime({ gtmId: null });
    consent.acceptAll();

    expect(second).toBe(first);
    expect(readConsentCommands(window.dataLayer ?? []).map((command) => command.action)).toEqual(["default", "update"]);
    expect(gtmScripts()).toHaveLength(1);
    expect(attribution.get()).toEqual({ utm_source: "parceiro" });
    expect(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toContain("parceiro");
    window.history.replaceState(null, "", "/");
  });
});

describe("attribution store", () => {
  it("avisa os ouvintes só quando a campanha muda e mantém a referência estável", () => {
    const store = createAttributionStore(createMemoryStorage());
    const seen: string[] = [];
    const unsubscribe = store.onChange((value) => seen.push(value.utm_source ?? ""));

    const first = store.capture("?utm_source=a");
    const same = store.capture("");
    store.capture("?utm_source=a");
    store.capture("?utm_source=b");
    unsubscribe();
    store.capture("?utm_source=c");

    expect(same).toBe(first);
    expect(seen).toEqual(["a", "b"]);
    expect(store.get()).toEqual({ utm_source: "c" });
  });

  it("começa com o que já estava na sessão", () => {
    const storage = createMemoryStorage({ [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({ gclid: "z" }) });

    expect(createAttributionStore(storage).get()).toEqual({ gclid: "z" });
  });
});
