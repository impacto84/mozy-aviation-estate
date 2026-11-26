/**
 * Runtime de martech da aba: liga consentimento, Consent Mode, atribuição, camada de
 * eventos e o carregador de tags. É o único lugar que decide carregar uma tag.
 *
 * Ordem ao iniciar:
 *   1. `consent default` com tudo negado (array local, nada sai do navegador);
 *   2. captura de UTM e click-ids da URL de entrada;
 *   3. se o visitante já tinha decidido: `consent update` e, com algum aceite, a tag;
 *   4. dali em diante cada mudança de consentimento repete o passo 3.
 */

import { attribution as browserAttribution } from "./attribution-store";
import type { AttributionStore } from "./attribution-store";
import { consent as browserConsent, hasAnyGrant } from "./consent";
import type { ConsentState, ConsentStore } from "./consent";
import { CONSENT_MODE_DENIED, pushConsentCommand, toConsentMode } from "./consent-mode";
import { createDataLayerDestination, ensureDataLayer } from "./destinations/data-layer";
import { createTracker } from "./events";
import type { Destination, DestinationFailure, TrackInput } from "./events";
import { loadGtm } from "./tag-loader";
import type { TagHost } from "./tag-loader";

export interface MartechClientConfig {
  /** ID do contêiner já validado (`resolveMartechConfig`), ou `null` para não carregar tag. */
  readonly gtmId: string | null;
}

export interface MartechEnvironment {
  readonly host: TagHost;
  /** `window.location.search` da página de entrada. */
  readonly search: string;
  readonly consent: ConsentStore;
  readonly attribution: AttributionStore;
  /** Destinos além do dataLayer (pixel direto, ou o destino de memória em teste). */
  readonly extraDestinations?: readonly Destination[];
  readonly onError?: (failure: DestinationFailure) => void;
}

export interface MartechRuntime {
  /** Registra o evento e devolve o `event_id`. */
  track(input: TrackInput): string;
  /** Eventos na fila, esperando o consentimento. */
  pending(): number;
  dispose(): void;
}

export function createMartechRuntime(config: MartechClientConfig, env: MartechEnvironment): MartechRuntime {
  const layer = (): unknown[] => ensureDataLayer(env.host);

  const applyConsent = (state: ConsentState): void => {
    if (state.status !== "decided") {
      return;
    }
    pushConsentCommand(layer(), "update", toConsentMode(state.choices));
    if (config.gtmId !== null && hasAnyGrant(state)) {
      loadGtm(env.host, config.gtmId);
    }
  };

  pushConsentCommand(layer(), "default", CONSENT_MODE_DENIED);
  env.attribution.capture(env.search);
  applyConsent(env.consent.get());
  // O ouvinte do Consent Mode entra antes do tracker: o `update` chega ao dataLayer antes dos eventos da fila.
  const unsubscribe = env.consent.onChange(applyConsent);
  const tracker = createTracker({
    consent: env.consent,
    // Sem GTM nenhuma tag lê a dataLayer: ela é local e recebe sem esperar consentimento.
    // Com GTM, volta a fila do consentimento (Piso P9).
    destinations: [createDataLayerDestination(layer, config.gtmId === null ? "first-party" : "any"), ...(env.extraDestinations ?? [])],
    getAttribution: env.attribution.get,
    onError: env.onError,
  });

  return {
    track: tracker.track,
    pending: tracker.pending,
    dispose: () => {
      unsubscribe();
      tracker.dispose();
    },
  };
}

let browserRuntime: MartechRuntime | null = null;

/**
 * Runtime único da aba. Chame só em efeito ou handler (precisa de `window`).
 * A primeira chamada fixa a configuração; as seguintes devolvem o mesmo runtime.
 */
export function ensureMartechRuntime(config: MartechClientConfig): MartechRuntime {
  if (browserRuntime === null) {
    browserRuntime = createMartechRuntime(config, {
      host: window,
      search: window.location.search,
      consent: browserConsent,
      attribution: browserAttribution,
    });
  }
  return browserRuntime;
}

/** Só para testes: encerra e descarta o runtime da aba. */
export function resetMartechRuntimeForTests(): void {
  browserRuntime?.dispose();
  browserRuntime = null;
}
