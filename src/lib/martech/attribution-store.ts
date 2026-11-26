/**
 * Store da atribuição da sessão: uma leitura estável para a interface (campos ocultos,
 * links de conversão) e um ponto único de captura.
 *
 * `get()` devolve a mesma referência até a próxima captura que mude o valor, então
 * serve de `getSnapshot` em `useSyncExternalStore`.
 */

import { createMemoryStorage, resolveBrowserStorage } from "./storage";
import type { KeyValueStorage } from "./storage";
import { captureAttribution, readStoredAttribution } from "./utm";
import type { Attribution } from "./utm";

export type AttributionListener = (attribution: Attribution) => void;

export interface AttributionStore {
  get(): Attribution;
  /** Lê a query da página de entrada e atualiza a sessão. Chame em efeito, uma vez por página. */
  capture(search: string): Attribution;
  onChange(listener: AttributionListener): () => void;
}

function isSame(a: Attribution, b: Attribution): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

export function createAttributionStore(storage: KeyValueStorage): AttributionStore {
  const listeners = new Set<AttributionListener>();
  let current = readStoredAttribution(storage);
  return {
    get: () => current,
    capture: (search) => {
      const next = captureAttribution({ search, storage });
      if (!isSame(current, next)) {
        current = next;
        for (const listener of [...listeners]) {
          listener(next);
        }
      }
      return current;
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

let browserStore: AttributionStore | null = null;

function resolveBrowserStore(): AttributionStore {
  if (browserStore === null) {
    const host = typeof window === "undefined" ? undefined : window;
    // Sem sessionStorage (acesso negado) a atribuição vale só para esta carga de página.
    browserStore = createAttributionStore(resolveBrowserStorage("session", host) ?? createMemoryStorage());
  }
  return browserStore;
}

/** Só para testes: descarta o store da aba. */
export function resetBrowserAttributionForTests(): void {
  browserStore = null;
}

/** Store da aba atual, criado no primeiro uso. */
export const attribution: AttributionStore = {
  get: () => resolveBrowserStore().get(),
  capture: (search) => resolveBrowserStore().capture(search),
  onChange: (listener) => resolveBrowserStore().onChange(listener),
};
