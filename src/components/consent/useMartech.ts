"use client";

import { useCallback, useContext, useSyncExternalStore } from "react";
import { attribution } from "@/lib/martech/attribution-store";
import { consent } from "@/lib/martech/consent";
import type { ConsentState } from "@/lib/martech/consent";
import type { TrackInput } from "@/lib/martech/events";
import { ensureMartechRuntime } from "@/lib/martech/runtime";
import { EMPTY_ATTRIBUTION } from "@/lib/martech/utm";
import type { Attribution } from "@/lib/martech/utm";
import { MartechContext } from "./MartechContext";
import type { MartechContextValue } from "./MartechContext";

function useMartechContext(hookName: string): MartechContextValue {
  const context = useContext(MartechContext);
  if (context === null) {
    throw new Error(`${hookName} precisa estar dentro de <MartechProvider>.`);
  }
  return context;
}

const noServerConsent = (): null => null;
const noServerAttribution = (): Attribution => EMPTY_ATTRIBUTION;

/**
 * Estado do consentimento. `null` no servidor e durante a hidratação: nesse intervalo
 * ninguém sabe ainda o que o visitante escolheu, então nada que dependa disso aparece.
 */
export function useConsentState(): ConsentState | null {
  return useSyncExternalStore(consent.onChange, consent.get, noServerConsent);
}

/** Atribuição da sessão (UTM e click-ids). Vazia no servidor; preenchida depois de montar. */
export function useAttribution(): Attribution {
  return useSyncExternalStore(attribution.onChange, attribution.get, noServerAttribution);
}

/** `track` estável para handlers e efeitos. Devolve o `event_id` usado. */
export function useTrack(): (input: TrackInput) => string {
  const { config } = useMartechContext("useTrack");
  return useCallback((input: TrackInput) => ensureMartechRuntime(config).track(input), [config]);
}

/** Abre o diálogo de preferências de cookies. */
export function useOpenConsentPreferences(): () => void {
  return useMartechContext("useOpenConsentPreferences").openPreferences;
}
