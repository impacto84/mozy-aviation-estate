/**
 * Google Consent Mode v2: tradução da escolha do visitante para os quatro sinais
 * que as tags do Google leem, e os comandos `consent default` / `consent update`.
 *
 * Modo usado aqui: **básico**. Antes do aceite só existe o comando `default` (tudo
 * negado) em um array local; nenhuma tag é carregada e nenhum ping sai do navegador.
 */

import type { ConsentChoices } from "./consent";
import { DENIED_CHOICES } from "./consent";

export type ConsentModeValue = "granted" | "denied";

export const CONSENT_MODE_SIGNALS = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"] as const;
export type ConsentModeSignal = (typeof CONSENT_MODE_SIGNALS)[number];
export type ConsentModeState = Readonly<Record<ConsentModeSignal, ConsentModeValue>>;
export type ConsentModeAction = "default" | "update";

const toValue = (isGranted: boolean): ConsentModeValue => (isGranted ? "granted" : "denied");

/** `analytics` libera medição; `marketing` libera os três sinais de anúncio. */
export function toConsentMode(choices: ConsentChoices): ConsentModeState {
  const ads = toValue(choices.marketing);
  return Object.freeze({
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: toValue(choices.analytics),
  });
}

export const CONSENT_MODE_DENIED: ConsentModeState = toConsentMode(DENIED_CHOICES);

/**
 * O GTM só reconhece um comando gtag quando ele chega ao dataLayer como objeto
 * `arguments` (um array comum é tratado como evento desconhecido e ignorado).
 */
const toArgumentsObject: (...values: readonly unknown[]) => IArguments = function () {
  // eslint-disable-next-line prefer-rest-params -- exigência do GTM: o comando precisa ser o objeto `arguments`.
  return arguments;
};

/** Empurra `gtag('consent', action, state)` no dataLayer informado. */
export function pushConsentCommand(layer: unknown[], action: ConsentModeAction, state: ConsentModeState): void {
  layer.push(toArgumentsObject("consent", action, { ...state }));
}

/** Lê de volta os comandos de consentimento de um dataLayer (para teste e depuração). */
export function readConsentCommands(layer: readonly unknown[]): readonly { action: string; state: unknown }[] {
  return layer.flatMap((entry) => {
    if (entry === null || typeof entry !== "object" || !("length" in entry)) {
      return [];
    }
    const [command, action, state] = Array.from(entry as ArrayLike<unknown>);
    return command === "consent" && typeof action === "string" ? [{ action, state }] : [];
  });
}
