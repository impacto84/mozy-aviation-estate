/**
 * Store de consentimento: a escolha do visitante, persistida e observável.
 *
 * - Estado inicial `unknown`: ninguém decidiu, nada de tracking pode rodar.
 * - A escolha fica em localStorage (first-party, sem dado pessoal) com a versão da
 *   política e a data. Versão diferente ou escolha vencida volta a `unknown`.
 * - `get()` devolve sempre a mesma referência até a próxima mudança, o que permite
 *   usar o store direto em `useSyncExternalStore`.
 *
 * A skill implementa o mecanismo. A base legal (LGPD, GDPR) e o texto do aviso são
 * decisão do dono do site.
 */

import { isRecord, parseJson } from "./guards";
import { readStorage, resolveBrowserStorage, writeStorage } from "./storage";
import type { KeyValueStorage } from "./storage";

export const CONSENT_CATEGORIES = ["analytics", "marketing"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
export type ConsentChoices = Readonly<Record<ConsentCategory, boolean>>;
export type ConsentStatus = "unknown" | "decided";

export interface ConsentState {
  readonly status: ConsentStatus;
  readonly choices: ConsentChoices;
  /** ISO 8601 do momento da escolha; `null` enquanto ninguém decidiu. */
  readonly decidedAt: string | null;
  /** Versão do texto de consentimento que o visitante viu. */
  readonly version: string;
}

export type ConsentListener = (state: ConsentState) => void;

export interface ConsentStore {
  get(): ConsentState;
  set(choices: ConsentChoices): ConsentState;
  acceptAll(): ConsentState;
  rejectAll(): ConsentState;
  /** Esquece a escolha: o banner volta a aparecer. */
  reset(): ConsentState;
  /** Registra um ouvinte e devolve a função que o remove. */
  onChange(listener: ConsentListener): () => void;
}

export interface ConsentStoreOptions {
  readonly storage: KeyValueStorage | null;
  readonly now?: () => Date;
  readonly version?: string;
  readonly maxAgeDays?: number;
}

export const CONSENT_STORAGE_KEY = "forja.consent.v1";
export const CONSENT_POLICY_VERSION = "1";
/** Depois deste prazo a escolha vence e o site pergunta de novo. */
export const CONSENT_MAX_AGE_DAYS = 180;

const MS_PER_DAY = 86_400_000;

export const DENIED_CHOICES: ConsentChoices = Object.freeze({ analytics: false, marketing: false });
export const GRANTED_CHOICES: ConsentChoices = Object.freeze({ analytics: true, marketing: true });

function unknownState(version: string): ConsentState {
  return Object.freeze({ status: "unknown", choices: DENIED_CHOICES, decidedAt: null, version });
}

function decidedState(choices: ConsentChoices, decidedAt: string, version: string): ConsentState {
  const frozenChoices = Object.freeze({ analytics: choices.analytics, marketing: choices.marketing });
  return Object.freeze({ status: "decided", choices: frozenChoices, decidedAt, version });
}

export interface ParseConsentOptions {
  readonly version: string;
  readonly now: Date;
  readonly maxAgeDays: number;
}

interface StoredConsent {
  readonly version: string;
  readonly decidedAt: string;
  readonly choices: ConsentChoices;
}

/** Confere o formato do valor guardado. Dado de storage é entrada externa: pode ter sido editado. */
function toStoredConsent(json: unknown): StoredConsent | null {
  if (!isRecord(json) || !isRecord(json.choices)) {
    return null;
  }
  const { version, decidedAt, choices } = json;
  const isDated = typeof decidedAt === "string" && !Number.isNaN(Date.parse(decidedAt));
  if (typeof version !== "string" || version === "" || !isDated) {
    return null;
  }
  if (typeof choices.analytics !== "boolean" || typeof choices.marketing !== "boolean") {
    return null;
  }
  return { version, decidedAt, choices: { analytics: choices.analytics, marketing: choices.marketing } };
}

/** Valida o que veio do storage. Qualquer coisa fora do formato, de outra versão ou vencida vira `null`. */
export function parseStoredConsent(raw: string | null, options: ParseConsentOptions): ConsentState | null {
  const stored = raw === null ? null : toStoredConsent(parseJson(raw));
  if (stored === null || stored.version !== options.version) {
    return null;
  }
  const ageMs = options.now.getTime() - new Date(stored.decidedAt).getTime();
  if (ageMs < 0 || ageMs > options.maxAgeDays * MS_PER_DAY) {
    return null;
  }
  return decidedState(stored.choices, stored.decidedAt, stored.version);
}

/** Alguma categoria foi aceita? É a condição para carregar o gerenciador de tags. */
export function hasAnyGrant(state: ConsentState): boolean {
  return state.status === "decided" && CONSENT_CATEGORIES.some((category) => state.choices[category]);
}

export function createConsentStore(options: ConsentStoreOptions): ConsentStore {
  const now = options.now ?? (() => new Date());
  const version = options.version ?? CONSENT_POLICY_VERSION;
  const maxAgeDays = options.maxAgeDays ?? CONSENT_MAX_AGE_DAYS;
  const listeners = new Set<ConsentListener>();
  const stored = parseStoredConsent(readStorage(options.storage, CONSENT_STORAGE_KEY), { version, now: now(), maxAgeDays });
  let state: ConsentState = stored ?? unknownState(version);

  const commit = (next: ConsentState): ConsentState => {
    state = next;
    const payload = next.status === "decided" ? JSON.stringify({ version, decidedAt: next.decidedAt, choices: next.choices }) : null;
    writeStorage(options.storage, CONSENT_STORAGE_KEY, payload);
    for (const listener of [...listeners]) {
      listener(next);
    }
    return next;
  };
  const decide = (choices: ConsentChoices): ConsentState => commit(decidedState(choices, now().toISOString(), version));

  return {
    get: () => state,
    set: decide,
    acceptAll: () => decide(GRANTED_CHOICES),
    rejectAll: () => decide(DENIED_CHOICES),
    reset: () => commit(unknownState(version)),
    onChange: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

let browserStore: ConsentStore | null = null;

function resolveBrowserStore(): ConsentStore {
  if (browserStore === null) {
    const host = typeof window === "undefined" ? undefined : window;
    browserStore = createConsentStore({ storage: resolveBrowserStorage("local", host) });
  }
  return browserStore;
}

/** Só para testes: descarta o store da aba, para o próximo acesso reler o storage. */
export function resetBrowserConsentForTests(): void {
  browserStore = null;
}

/**
 * Store da aba atual. Criado no primeiro uso (nunca no topo do módulo), lê e grava
 * em localStorage. Use em efeitos, handlers e em `useSyncExternalStore`.
 */
export const consent: ConsentStore = {
  get: () => resolveBrowserStore().get(),
  set: (choices) => resolveBrowserStore().set(choices),
  acceptAll: () => resolveBrowserStore().acceptAll(),
  rejectAll: () => resolveBrowserStore().rejectAll(),
  reset: () => resolveBrowserStore().reset(),
  onChange: (listener) => resolveBrowserStore().onChange(listener),
};
