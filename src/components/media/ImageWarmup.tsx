"use client";

import { useEffect } from "react";

const IDLE_TIMEOUT_MS = 1500;
const FALLBACK_DELAY_MS = 200;

/** Troca `loading="lazy"` por `eager` em todas as imagens da página. */
function warmImages(): void {
  for (const image of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
    image.loading = "eager";
  }
}

/**
 * Depois do `load` (o LCP já pintou) e com a página ociosa, pede as fotografias que
 * estavam em espera de rolagem. Assim nenhuma imagem editorial depende de rolagem,
 * de animação ou de WebGL para aparecer (movimento reduzido, leitura por âncora,
 * impressão, captura de página inteira). Não muda a ordem do caminho crítico.
 */
export function ImageWarmup() {
  useEffect(() => {
    let idleHandle: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (): void => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(warmImages, { timeout: IDLE_TIMEOUT_MS });
      } else {
        timer = setTimeout(warmImages, FALLBACK_DELAY_MS);
      }
    };
    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
    return () => {
      window.removeEventListener("load", schedule);
      if (idleHandle !== null) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, []);
  return null;
}
