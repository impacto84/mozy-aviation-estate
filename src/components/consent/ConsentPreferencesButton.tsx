"use client";

import type { ReactNode } from "react";
import styles from "./Consent.module.css";
import { useOpenConsentPreferences } from "./useMartech";

interface ConsentPreferencesButtonProps {
  readonly children?: ReactNode;
}

/**
 * Botão permanente (rodapé) para rever a escolha: mudar de ideia tem de ser tão fácil
 * quanto foi aceitar.
 */
export function ConsentPreferencesButton({ children = "Preferências de cookies" }: ConsentPreferencesButtonProps) {
  const openPreferences = useOpenConsentPreferences();
  return (
    <button type="button" className={styles.reopen} data-forja-consent="reopen" onClick={openPreferences}>
      {children}
    </button>
  );
}
