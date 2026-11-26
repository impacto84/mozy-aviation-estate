/**
 * Apoio dos testes de consentimento e do formulário de lead em jsdom.
 * Só para arquivos *.test.*; não é importado por código de produção.
 */

import { vi } from "vitest";
import { resetBrowserAttributionForTests } from "@/lib/martech/attribution-store";
import { resetBrowserConsentForTests } from "@/lib/martech/consent";
import { resetMartechRuntimeForTests } from "@/lib/martech/runtime";
import { TAG_MARKER_ATTRIBUTE } from "@/lib/martech/tag-loader";

/** ID de teste: formato válido, não pertence a ninguém. O jsdom não baixa scripts. */
export const TEST_GTM_ID = ["GTM", "TESTE01"].join("-");

export function gtmScripts(): readonly HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>(`script[${TAG_MARKER_ATTRIBUTE}="gtm"]`)];
}

/** Entradas do dataLayer que são eventos (objetos com `event`), na ordem. */
export function dataLayerEvents(): readonly Readonly<Record<string, unknown>>[] {
  return (window.dataLayer ?? []).filter(
    (entry): entry is Readonly<Record<string, unknown>> => entry !== null && typeof entry === "object" && "event" in entry,
  );
}

export function eventsNamed(name: string): readonly Readonly<Record<string, unknown>>[] {
  return dataLayerEvents().filter((entry) => entry.event === name);
}

/** O jsdom não implementa `showModal` nem `close` de `<dialog>`. */
export function installDialogStub(): void {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
}

/** Volta a aba ao estado de primeira visita: sem escolha, sem campanha, sem tag, sem dataLayer. */
export function resetMartechBrowserState(): void {
  for (const script of gtmScripts()) {
    script.remove();
  }
  delete window.dataLayer;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  resetMartechRuntimeForTests();
  resetBrowserConsentForTests();
  resetBrowserAttributionForTests();
}
