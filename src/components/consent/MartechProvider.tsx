"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { attribution } from "@/lib/martech/attribution-store";
import { DENIED_CHOICES, consent } from "@/lib/martech/consent";
import type { ConsentChoices } from "@/lib/martech/consent";
import { ensureMartechRuntime } from "@/lib/martech/runtime";
import type { MartechClientConfig } from "@/lib/martech/runtime";
import { ConsentBanner } from "./ConsentBanner";
import { ConsentPreferences } from "./ConsentPreferences";
import { MartechContext } from "./MartechContext";
import type { MartechContextValue } from "./MartechContext";
import { useConsentState } from "./useMartech";

interface MartechProviderProps {
  /** ID do contêiner GTM, já validado no servidor (`resolveMartechConfig`). `null` não carrega tag. */
  readonly gtmId: string | null;
  /** Link da política de privacidade mostrado no aviso. */
  readonly policyHref?: string;
  /** Quando verdadeiro e `gtmId === null`, não exibe barra de cookies na primeira dobra. */
  readonly hideBannerWithoutTracking?: boolean;
  readonly children: ReactNode;
}

const SAVED_MESSAGE = "Preferências de cookies salvas.";

type ConsentChoice = ConsentChoices | "all" | "none";

/** Liga o runtime e registra um `page_view` por rota (o ref evita repetir em re-render e no modo estrito). */
function usePageViews(config: MartechClientConfig): void {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const runtime = ensureMartechRuntime(config);
    if (lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;
    attribution.capture(window.location.search);
    runtime.track({ name: "page_view", params: { page_path: pathname } });
  }, [config, pathname]);
}

function saveChoice(choice: ConsentChoice): void {
  if (choice === "all") {
    consent.acceptAll();
  } else if (choice === "none") {
    consent.rejectAll();
  } else {
    consent.set(choice);
  }
}

/**
 * Uma vez por site, no layout raiz. Faz três coisas:
 *   1. liga o runtime (consent default negado, captura de UTM, fila de eventos);
 *   2. registra `page_view` a cada troca de rota;
 *   3. mostra o aviso de cookies enquanto o visitante não decidiu, e o diálogo de preferências.
 * Os filhos chegam do servidor: este componente não transforma a página em cliente.
 */
export function MartechProvider({ gtmId, policyHref, hideBannerWithoutTracking = false, children }: MartechProviderProps) {
  const state = useConsentState();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [dialogVersion, setDialogVersion] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const config = useMemo<MartechClientConfig>(() => ({ gtmId }), [gtmId]);
  usePageViews(config);

  const openPreferences = useCallback(() => {
    setDialogVersion((version) => version + 1);
    dialogRef.current?.showModal();
  }, []);
  const decide = (choice: ConsentChoice): void => {
    saveChoice(choice);
    setAnnouncement(SAVED_MESSAGE);
  };
  const value = useMemo<MartechContextValue>(() => ({ config, openPreferences }), [config, openPreferences]);
  const shouldShowBanner = state?.status === "unknown" && !(hideBannerWithoutTracking && gtmId === null);

  return (
    <MartechContext value={value}>
      {shouldShowBanner ? (
        <ConsentBanner
          policyHref={policyHref}
          onAccept={() => decide("all")}
          onReject={() => decide("none")}
          onOpenPreferences={openPreferences}
        />
      ) : null}
      {children}
      <ConsentPreferences ref={dialogRef} formKey={dialogVersion} choices={state?.choices ?? DENIED_CHOICES} onSave={decide} />
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </MartechContext>
  );
}
