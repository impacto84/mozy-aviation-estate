/**
 * Acesso seguro a localStorage e sessionStorage.
 *
 * O navegador pode negar o storage (modo privado antigo, cookies bloqueados, iframe
 * de terceiro): ler `window.localStorage` lança exceção. Aqui a falha vira `null`
 * e quem chama segue com memória, sem quebrar a página.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type BrowserStorageKind = "local" | "session";

const PROBE_KEY = "forja.storage.probe";

/** Storage que vive só na memória da aba: usado em teste e quando o navegador nega o real. */
export function createMemoryStorage(initial: Readonly<Record<string, string>> = {}): KeyValueStorage {
  const entries = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

/** Devolve o storage pedido, ou `null` se não existir ou não aceitar escrita. */
export function resolveBrowserStorage(
  kind: BrowserStorageKind,
  host: Partial<Pick<Window, "localStorage" | "sessionStorage">> | undefined,
): KeyValueStorage | null {
  if (host === undefined) {
    return null;
  }
  try {
    const storage = kind === "local" ? host.localStorage : host.sessionStorage;
    if (storage === undefined) {
      return null;
    }
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    // Acesso negado pelo navegador: quem chama usa memória.
    return null;
  }
}

/** Lê uma chave sem deixar a exceção do navegador escapar. */
export function readStorage(storage: KeyValueStorage | null, key: string): string | null {
  if (storage === null) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Grava uma chave. Devolve `false` quando o navegador recusou (cota cheia, acesso negado). */
export function writeStorage(storage: KeyValueStorage | null, key: string, value: string | null): boolean {
  if (storage === null) {
    return false;
  }
  try {
    if (value === null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
