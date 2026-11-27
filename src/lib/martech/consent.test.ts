import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_MAX_AGE_DAYS,
  CONSENT_STORAGE_KEY,
  DENIED_CHOICES,
  GRANTED_CHOICES,
  consent,
  createConsentStore,
  hasAnyGrant,
  parseStoredConsent,
  resetBrowserConsentForTests,
} from "./consent";
import { createMemoryStorage } from "./storage";

const NOW = new Date("2026-11-24T12:00:00.000Z");
const DAY_MS = 86_400_000;
const PARSE_OPTIONS = { version: "1", now: NOW, maxAgeDays: CONSENT_MAX_AGE_DAYS };

function stored(overrides: Readonly<Record<string, unknown>> = {}): string {
  return JSON.stringify({
    version: "1",
    decidedAt: "2026-11-01T10:00:00.000Z",
    choices: { analytics: true, marketing: false },
    ...overrides,
  });
}

describe("parseStoredConsent", () => {
  it("devolve o estado decidido quando o valor guardado é válido", () => {
    const state = parseStoredConsent(stored(), PARSE_OPTIONS);

    expect(state).toEqual({
      status: "decided",
      choices: { analytics: true, marketing: false },
      decidedAt: "2026-11-01T10:00:00.000Z",
      version: "1",
    });
  });

  it.each([
    ["ausente", null],
    ["JSON corrompido", "{nao-e-json"],
    ["formato errado", JSON.stringify({ version: "1", choices: "sim" })],
    ["escolha sem booleano", stored({ choices: { analytics: "true", marketing: false } })],
    ["versão antiga da política", stored({ version: "0" })],
    ["data no futuro", stored({ decidedAt: "2027-01-01T00:00:00.000Z" })],
  ])("devolve null para valor %s", (_label, raw) => {
    expect(parseStoredConsent(raw, PARSE_OPTIONS)).toBeNull();
  });

  it("devolve null quando a escolha passou do prazo de validade", () => {
    const expired = new Date(NOW.getTime() - (CONSENT_MAX_AGE_DAYS + 1) * DAY_MS).toISOString();

    expect(parseStoredConsent(stored({ decidedAt: expired }), PARSE_OPTIONS)).toBeNull();
  });
});

describe("createConsentStore", () => {
  it("começa em unknown, com tudo negado, quando ninguém decidiu", () => {
    const store = createConsentStore({ storage: createMemoryStorage(), now: () => NOW });

    expect(store.get()).toEqual({ status: "unknown", choices: DENIED_CHOICES, decidedAt: null, version: "1" });
    expect(hasAnyGrant(store.get())).toBe(false);
  });

  it("persiste a escolha e a recupera em um novo store", () => {
    const storage = createMemoryStorage();
    createConsentStore({ storage, now: () => NOW }).set({ analytics: true, marketing: false });

    const reopened = createConsentStore({ storage, now: () => NOW });

    expect(reopened.get().status).toBe("decided");
    expect(reopened.get().choices).toEqual({ analytics: true, marketing: false });
    expect(reopened.get().decidedAt).toBe(NOW.toISOString());
  });

  it("aceitar tudo e recusar tudo gravam as duas categorias", () => {
    const store = createConsentStore({ storage: createMemoryStorage(), now: () => NOW });

    expect(store.acceptAll().choices).toEqual(GRANTED_CHOICES);
    expect(hasAnyGrant(store.get())).toBe(true);
    expect(store.rejectAll().choices).toEqual(DENIED_CHOICES);
    expect(hasAnyGrant(store.get())).toBe(false);
    expect(store.get().status).toBe("decided");
  });

  it("avisa os ouvintes a cada mudança e para de avisar depois do cancelamento", () => {
    const store = createConsentStore({ storage: createMemoryStorage(), now: () => NOW });
    const listener = vi.fn();
    const unsubscribe = store.onChange(listener);

    store.acceptAll();
    unsubscribe();
    store.rejectAll();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: "decided", choices: GRANTED_CHOICES }));
  });

  it("devolve a mesma referência até a próxima mudança (useSyncExternalStore)", () => {
    const store = createConsentStore({ storage: createMemoryStorage(), now: () => NOW });

    const first = store.get();
    const second = store.get();
    store.acceptAll();

    expect(second).toBe(first);
    expect(store.get()).not.toBe(first);
  });

  it("reset apaga a escolha guardada e volta a unknown", () => {
    const storage = createMemoryStorage();
    const store = createConsentStore({ storage, now: () => NOW });
    store.acceptAll();

    store.reset();

    expect(store.get().status).toBe("unknown");
    expect(storage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it("pergunta de novo quando a versão da política muda", () => {
    const storage = createMemoryStorage();
    createConsentStore({ storage, now: () => NOW, version: "1" }).acceptAll();

    const store = createConsentStore({ storage, now: () => NOW, version: "2" });

    expect(store.get().status).toBe("unknown");
    expect(store.get().version).toBe("2");
  });

  it("funciona em memória quando não há storage", () => {
    const store = createConsentStore({ storage: null });

    store.acceptAll();

    expect(store.get().status).toBe("decided");
  });

  it("não deixa a escolha do visitante ser alterada por quem leu o estado", () => {
    const store = createConsentStore({ storage: createMemoryStorage() });
    const state = store.acceptAll();

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.choices)).toBe(true);
  });
});

describe("consent (store da aba)", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetBrowserConsentForTests();
  });

  it("lê e grava no localStorage do navegador", () => {
    const listener = vi.fn();
    const unsubscribe = consent.onChange(listener);

    consent.set({ analytics: false, marketing: true });

    expect(consent.get().choices).toEqual({ analytics: false, marketing: true });
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('"marketing":true');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("recupera a escolha depois de recarregar a página", () => {
    consent.acceptAll();
    resetBrowserConsentForTests();

    expect(consent.get().status).toBe("decided");
    expect(consent.rejectAll().choices).toEqual(DENIED_CHOICES);
    expect(consent.reset().status).toBe("unknown");
  });
});
