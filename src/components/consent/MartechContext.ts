"use client";

import { createContext } from "react";
import type { MartechClientConfig } from "@/lib/martech/runtime";

export interface MartechContextValue {
  readonly config: MartechClientConfig;
  /** Abre o diálogo de preferências (para o link "Preferências de cookies" do rodapé). */
  readonly openPreferences: () => void;
}

export const MartechContext = createContext<MartechContextValue | null>(null);
