/**
 * Carregador de quadros com rede em lote e memória limitada.
 *
 * - Rede: os quadros do ato são baixados direto do arquivo WebP original
 *   (`/frames/<ato>/frame-XXXX.webp`, cache imutável), com concorrência limitada,
 *   quadros-chave primeiro (`loadOrder`). Quando o visitante salta para longe, os
 *   quadros em volta da posição nova passam para a frente da fila (`focus`).
 * - Memória: só uma janela deslizante em volta da posição atual fica decodificada
 *   (`ImageBitmap` já na largura do buffer do canvas). Fora da janela, `close()`
 *   libera a memória. Os blobs comprimidos ficam guardados para voltar sem rede.
 *
 * Sem React: o componente cria um por ato e chama `dispose()` ao desmontar.
 */

import { loadOrder } from "@/lib/chapters";

export interface FrameLoader {
  readonly bitmapAt: (index: number) => ImageBitmap | undefined;
  readonly isDecoded: (index: number) => boolean;
  /** Recentra a janela decodificada e a prioridade de rede em `index`. */
  readonly focus: (index: number) => void;
  /** Quantos quadros já chegaram pela rede (para o HUD e para os testes). */
  readonly loadedCount: () => number;
  readonly dispose: () => void;
}

export interface FrameLoaderOptions {
  readonly urls: readonly string[];
  readonly concurrency: number;
  /** Largura alvo do bitmap (px do buffer do canvas), lida a cada decodificação. */
  readonly targetWidth: () => number;
  /** Quadros decodificados de cada lado da posição atual. */
  readonly window: number;
  /** Chamado quando um quadro novo fica pronto para desenhar. */
  readonly onFrame: (index: number) => void;
}

/** Folga além da janela antes de liberar um bitmap (evita decodificar de novo ao ir e voltar). */
const EVICT_MARGIN = 4;
/** Quadros em volta do foco que furam a fila de rede. */
const PRIORITY_RADIUS = 12;

function distance(a: number, b: number): number {
  return Math.abs(a - b);
}

/** Move para a frente da fila os índices a até `radius` do centro, mais perto primeiro. */
export function prioritizeQueue(queue: readonly number[], center: number, radius: number): number[] {
  const near = queue.filter((index) => distance(index, center) <= radius).sort((a, b) => distance(a, center) - distance(b, center));
  const nearSet = new Set(near);
  return [...near, ...queue.filter((index) => !nearSet.has(index))];
}

export function createFrameLoader(options: FrameLoaderOptions): FrameLoader {
  const { urls, concurrency, targetWidth, window: radius, onFrame } = options;
  const blobs: (Blob | null)[] = urls.map(() => null);
  const bitmaps = new Map<number, ImageBitmap>();
  const decoding = new Set<number>();
  let queue: number[] = [...loadOrder(urls.length)];
  const controller = new AbortController();
  let center = 0;
  let inFlight = 0;
  let loaded = 0;
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
    createImageBitmap(blob, { resizeWidth: targetWidth(), resizeQuality: "high" })
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
        // Quadro que não decodificou fica de fora: o scrub desenha o vizinho mais próximo.
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
      const [index, ...rest] = queue;
      queue = rest;
      const url = index === undefined ? undefined : urls[index];
      if (index === undefined || url === undefined || blobs[index] !== null) {
        continue;
      }
      inFlight += 1;
      fetch(url, { signal: controller.signal })
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => {
          blobs[index] = blob;
          if (blob !== null) {
            loaded += 1;
          }
          if (distance(index, center) <= radius) {
            decode(index);
          }
        })
        .catch(() => {
          // Rede falhou ou o ato foi desmontado: o quadro fica de fora.
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
      if (index !== center) {
        center = index;
        queue = prioritizeQueue(queue, center, PRIORITY_RADIUS);
      }
      decodeWindow();
    },
    loadedCount: () => loaded,
    dispose: () => {
      isDisposed = true;
      queue = [];
      controller.abort();
      for (const bitmap of bitmaps.values()) {
        bitmap.close();
      }
      bitmaps.clear();
    },
  };
}
