"use client";

import { useEffect } from "react";
import { attribution } from "@/lib/martech/attribution-store";

/**
 * Só a captura de UTM e click-ids, sem aviso de cookies e sem eventos.
 *
 * Em site real este componente não é necessário: o `MartechProvider` fica no layout
 * raiz e já captura. Ele existe para o caso em que o provider não cobre todas as rotas
 * (como nesta fixture, onde o aviso só aparece nas demos de martech): a campanha tem
 * de ser guardada em QUALQUER página de entrada, senão se perde antes do formulário.
 */
export function AttributionCapture(): null {
  useEffect(() => {
    attribution.capture(window.location.search);
  }, []);
  return null;
}
