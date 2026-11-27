/**
 * Atos cinematográficos a partir das sequências reais de quadros (`public/frames/*`).
 *
 * Pipeline direto (FORJA 1.1 §2.1): cada quadro é o arquivo WebP original servido como
 * estático (`/frames/<ato>/frame-XXXX.webp`), nunca pelo otimizador `/_next/image`.
 * Densidade: sequências curtas em passo 1 (phone 2); a longa (villa, 722) em passo 2
 * (phone 3). Funções puras, testadas em `chapters.test.ts`.
 */

export type ChapterId = "approach" | "villa" | "hangar";

export interface ChapterSource {
  readonly id: ChapterId;
  readonly dir: string;
  /** Quantidade de arquivos `frame-0001.webp` … no diretório. */
  readonly count: number;
  /** Passo de amostragem no desktop/tablet (1 = todos os quadros). */
  readonly step: number;
  /** Passo no phone: menos quadros, mesma duração de trilha. */
  readonly phoneStep: number;
  /** Quadro nítido usado como pôster e no modo de movimento reduzido (1-based). */
  readonly stillFrame: number;
  readonly width: number;
  readonly height: number;
  /** Altura da trilha de rolagem (svh) no desktop/tablet e no phone. */
  readonly trackSvh: number;
  readonly phoneTrackSvh: number;
  /** `immediate`: pré-carga logo após a montagem (Ato I); `near`: quando a trilha se aproxima. */
  readonly preload: "immediate" | "near";
}

export const CHAPTERS: readonly ChapterSource[] = [
  { id: "approach", dir: "/frames/approach", count: 121, step: 1, phoneStep: 2, stillFrame: 1, width: 1920, height: 1082, trackSvh: 420, phoneTrackSvh: 400, preload: "immediate" },
  { id: "villa", dir: "/frames/villa", count: 722, step: 2, phoneStep: 3, stillFrame: 600, width: 1600, height: 900, trackSvh: 520, phoneTrackSvh: 480, preload: "near" },
  { id: "hangar", dir: "/frames/hangar", count: 361, step: 1, phoneStep: 2, stillFrame: 300, width: 1600, height: 900, trackSvh: 460, phoneTrackSvh: 440, preload: "near" },
];

/** Primeiro passe: um quadro a cada KEYFRAME_STRIDE, para o scrub nunca ficar vazio. */
export const KEYFRAME_STRIDE = 8;
export const PHONE_MAX_WIDTH = 767;

export function findChapter(id: ChapterId): ChapterSource {
  const chapter = CHAPTERS.find((entry) => entry.id === id);
  if (chapter === undefined) {
    throw new Error(`Capítulo desconhecido: ${id}`);
  }
  return chapter;
}

/** Caminho estático do quadro (1-based): `/frames/villa/frame-0042.webp`. */
export function framePath(dir: string, frame: number): string {
  return `${dir}/frame-${String(frame).padStart(4, "0")}.webp`;
}

/**
 * URL do quadro no canal direto: o próprio arquivo WebP original, sem `/_next/image`
 * nem recompressão (`q=60` borrava cada quadro e custava CPU no servidor).
 */
export function frameUrl(dir: string, frame: number): string {
  return framePath(dir, frame);
}

/** Passo de amostragem para a largura de tela atual. */
export function stepFor(chapter: ChapterSource, viewportWidth: number): number {
  return viewportWidth <= PHONE_MAX_WIDTH ? chapter.phoneStep : chapter.step;
}

/** Números (1-based) dos quadros usados para a largura de tela atual (sempre inclui o último). */
export function sampledFrames(chapter: ChapterSource, viewportWidth: number): readonly number[] {
  const step = stepFor(chapter, viewportWidth);
  const frames: number[] = [];
  for (let frame = 1; frame <= chapter.count; frame += step) {
    frames.push(frame);
  }
  if (frames.at(-1) !== chapter.count) {
    frames.push(chapter.count);
  }
  return frames;
}

/**
 * Ordem de carga em lote: primeiro o quadro de entrada e os quadros-chave
 * (um a cada `stride`), depois o resto, do começo para o fim.
 */
export function loadOrder(length: number, stride: number = KEYFRAME_STRIDE): readonly number[] {
  if (length <= 0) {
    return [];
  }
  const safeStride = Math.max(1, Math.floor(stride));
  const keys: number[] = [];
  for (let index = 0; index < length; index += safeStride) {
    keys.push(index);
  }
  if (keys.at(-1) !== length - 1) {
    keys.push(length - 1);
  }
  const keySet = new Set(keys);
  const rest: number[] = [];
  for (let index = 0; index < length; index += 1) {
    if (!keySet.has(index)) {
      rest.push(index);
    }
  }
  return [...keys, ...rest];
}

/**
 * Largura do bitmap decodificado para desenhar em `cover`: a largura que o quadro ocupa
 * no canvas (no phone, retrato, é a altura que manda: 844 px de altura pedem ~1.500 px
 * de largura de um quadro 16:9). Nunca acima do arquivo original.
 */
export function decodeWidthFor(canvasWidth: number, canvasHeight: number, sourceWidth: number, sourceHeight: number): number {
  const coverWidth = Math.max(canvasWidth, (canvasHeight * sourceWidth) / Math.max(sourceHeight, 1));
  return Math.max(1, Math.min(Math.ceil(coverWidth), sourceWidth));
}

/** Índice (0-based) do quadro para um progresso de 0 a 1. */
export function frameIndexFor(progress: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.round(clampProgress(progress) * (length - 1));
}

/** Progresso limitado a [0, 1]; valores não finitos viram 0. */
export function clampProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
}

/** Quadro carregado mais próximo do desejado; -1 se nenhum carregou ainda. */
export function nearestLoaded(target: number, isLoaded: (index: number) => boolean, length: number): number {
  for (let distance = 0; distance < length; distance += 1) {
    const before = target - distance;
    const after = target + distance;
    if (before >= 0 && isLoaded(before)) {
      return before;
    }
    if (after < length && isLoaded(after)) {
      return after;
    }
  }
  return -1;
}

export type CaptionPhase = "intro" | "mid" | "arrival";

/** Fronteiras das legendas (fração da trilha). */
export const CAPTION_BOUNDS = { mid: 0.34, arrival: 0.68 } as const;

/** Legenda ativa para o progresso: entrada, meio e chegada. */
export function captionPhase(progress: number): CaptionPhase {
  if (progress < CAPTION_BOUNDS.mid) {
    return "intro";
  }
  return progress < CAPTION_BOUNDS.arrival ? "mid" : "arrival";
}

/** Retângulo de desenho equivalente a `object-fit: cover`. */
export function coverRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
  const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
}

/** Contador de quadro exibido no HUD: `QDR 042/121`. */
export function frameCounter(frame: number, count: number): string {
  const digits = String(count).length;
  return `QDR ${String(frame).padStart(digits, "0")}/${count}`;
}
