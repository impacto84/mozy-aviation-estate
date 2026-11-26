/**
 * Carregador de quadros em lote com memória limitada.
 *
 * - Rede: todos os quadros do capítulo são baixados como blobs comprimidos (WebP
 *   redimensionado pelo otimizador, ~50 kB cada), em lote e com concorrência
 *   limitada, quadros-chave primeiro (`loadOrder`).
 * - Memória: só uma janela de quadros em volta da posição atual fica decodificada
 *   (`ImageBitmap`, já no tamanho do canvas). Fora da janela, `close()` libera a
 *   memória. Sem isso, 121 quadros 1920 px decodificados passam de 1 GB e a aba cai.
 *
 * Sem React: o componente cria um por capítulo e chama `dispose()` na troca.
 */

import { loadOrder } from "@/lib/chapters";

export interface FrameLoader {
  readonly bitmapAt: (index: number) => ImageBitmap | undefined;
  readonly isDecoded: (index: number) => boolean;
  /** Recentra a janela decodificada em `index` (chame a cada mudança de progresso). */
  readonly focus: (index: number) => void;
  readonly dispose: () => void;
}

export interface FrameLoaderOptions {
  readonly urls: readonly string[];
  readonly concurrency: number;
  /** Largura alvo do bitmap (px do buffer do canvas). */
  readonly targetWidth: number;
  /** Quadros decodificados de cada lado da posição atual. */
  readonly window: number;
  /** Chamado quando um quadro novo fica pronto para desenhar. */
  readonly onFrame: (index: number) => void;
}

/** Folga além da janela antes de liberar um bitmap (evita decodificar de novo ao ir e voltar). */
const EVICT_MARGIN = 4;

function distance(a: number, b: number): number {
  return Math.abs(a - b);
}

export function createFrameLoader(options: FrameLoaderOptions): FrameLoader {
  const { urls, concurrency, targetWidth, window: radius, onFrame } = options;
  const blobs: (Blob | null)[] = urls.map(() => null);
  const bitmaps = new Map<number, ImageBitmap>();
  const decoding = new Set<number>();
  const queue = [...loadOrder(urls.length)];
  const controller = new AbortController();
  let center = 0;
  let inFlight = 0;
  let isDisposed = false;

  const evict = (): void => {
    for (const [index, bitmap] of bitmaps) {
      if (distance(index, center) > radius + EVICT_MARGIN) {
        bitmap.close();
        bitmaps.delete(index);
      }
    }
  };

  const decode = (index: number): void => {
    const blob = blobs[index];
    if (isDisposed || blob === null || blob === undefined || bitmaps.has(index) || decoding.has(index)) {
      return;
    }
    decoding.add(index);
    createImageBitmap(blob, { resizeWidth: targetWidth, resizeQuality: "medium" })
      .then((bitmap) => {
        decoding.delete(index);
        if (isDisposed || distance(index, center) > radius + EVICT_MARGIN) {
          bitmap.close();
          return;
        }
        bitmaps.set(index, bitmap);
        onFrame(index);
      })
      .catch(() => {
        // Quadro que não decodificou fica de fora: o scrub usa o vizinho mais próximo.
        decoding.delete(index);
      });
  };

  const decodeWindow = (): void => {
    for (let offset = 0; offset <= radius; offset += 1) {
      decode(center + offset);
      decode(center - offset);
    }
    evict();
  };

  const pump = (): void => {
    while (!isDisposed && inFlight < concurrency && queue.length > 0) {
      const index = queue.shift();
      const url = index === undefined ? undefined : urls[index];
      if (index === undefined || url === undefined) {
        continue;
      }
      inFlight += 1;
      fetch(url, { signal: controller.signal })
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => {
          blobs[index] = blob;
          if (distance(index, center) <= radius) {
            decode(index);
          }
        })
        .catch(() => {
          // Rede falhou ou troca de capítulo abortou: o quadro fica de fora.
        })
        .finally(() => {
          inFlight -= 1;
          pump();
        });
    }
  };

  pump();

  return {
    bitmapAt: (index) => bitmaps.get(index),
    isDecoded: (index) => bitmaps.has(index),
    focus: (index) => {
      center = index;
      decodeWindow();
    },
    dispose: () => {
      isDisposed = true;
      queue.length = 0;
      controller.abort();
      for (const bitmap of bitmaps.values()) {
        bitmap.close();
      }
      bitmaps.clear();
    },
  };
}
