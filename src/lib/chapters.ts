/**
 * Capítulos cinematográficos a partir das sequências reais de frames (`public/frames/*`).
 * Funções puras: quais quadros carregar, em que ordem, com que largura e qual
 * quadro desenhar para um progresso de rolagem. Testadas em `chapters.test.ts`.
 */

export type ChapterId = "approach" | "villa" | "hangar";

export interface ChapterSource {
  readonly id: ChapterId;
  readonly dir: string;
  /** Quantidade de arquivos `frame-0001.webp` … no diretório. */
  readonly count: number;
  /** Passo de amostragem no desktop/tablet (1 = todos os quadros). */
  readonly step: number;
  /** Passo no phone: menos quadros, mesma duração. */
  readonly phoneStep: number;
  /** Quadro nítido usado como pôster e no modo de movimento reduzido (1-based). */
  readonly stillFrame: number;
  readonly width: number;
  readonly height: number;
}

export const CHAPTERS: readonly ChapterSource[] = [
  { id: "approach", dir: "/frames/approach", count: 121, step: 1, phoneStep: 2, stillFrame: 84, width: 1920, height: 1082 },
  { id: "villa", dir: "/frames/villa", count: 722, step: 4, phoneStep: 6, stillFrame: 600, width: 1600, height: 900 },
  { id: "hangar", dir: "/frames/hangar", count: 361, step: 2, phoneStep: 3, stillFrame: 300, width: 1600, height: 900 },
];

/** Larguras que o otimizador de imagem aceita (`next.config.ts`, `deviceSizes`). */
export const FRAME_WIDTHS: readonly number[] = [640, 828, 1080, 1440];
export const FRAME_QUALITY = 60;
/** Primeiro passe: um quadro a cada KEYFRAME_STRIDE, para o scrub nunca ficar vazio. */
export const KEYFRAME_STRIDE = 8;
const PHONE_MAX_WIDTH = 767;

export function findChapter(id: ChapterId): ChapterSource {
  const chapter = CHAPTERS.find((entry) => entry.id === id);
  if (chapter === undefined) {
    throw new Error(`Capítulo desconhecido: ${id}`);
  }
  return chapter;
}

export function framePath(dir: string, frame: number): string {
  return `${dir}/frame-${String(frame).padStart(4, "0")}.webp`;
}

/** Números (1-based) dos quadros usados para a largura de tela atual. */
export function sampledFrames(chapter: ChapterSource, viewportWidth: number): readonly number[] {
  const step = viewportWidth <= PHONE_MAX_WIDTH ? chapter.phoneStep : chapter.step;
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

/** Menor largura do otimizador que cobre o canvas (CSS × DPR limitado a 2). */
export function frameWidthFor(cssWidth: number, devicePixelRatio: number): number {
  const ratio = Math.min(Math.max(devicePixelRatio, 1), 2);
  const needed = Math.max(cssWidth, 1) * ratio;
  return FRAME_WIDTHS.find((width) => width >= needed) ?? FRAME_WIDTHS.at(-1) ?? needed;
}

/** URL do quadro pelo otimizador do Next (WebP redimensionado e em cache). */
export function frameUrl(dir: string, frame: number, width: number): string {
  return `/_next/image?url=${encodeURIComponent(framePath(dir, frame))}&w=${width}&q=${FRAME_QUALITY}`;
}

/** Índice (0-based) do quadro para um progresso de 0 a 1. */
export function frameIndexFor(progress: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  const clamped = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  return Math.round(clamped * (length - 1));
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

/** Legenda ativa para o progresso: entrada, meio e chegada, como na V05. */
export function captionPhase(progress: number): CaptionPhase {
  if (progress < 0.34) {
    return "intro";
  }
  return progress < 0.68 ? "mid" : "arrival";
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
