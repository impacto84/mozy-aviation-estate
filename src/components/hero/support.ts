/**
 * Detecção de suporte do hero. Tudo aqui é chamado dentro de efeitos, nunca no
 * corpo do componente nem no topo do módulo (`CODE-NO-WINDOW-RENDER`).
 *
 * Dado do navegador entra como `unknown` e é validado aqui.
 */

/** Teto do DPR do canvas (orçamento `PERF-DPR-CAP`). */
export const MAX_PIXEL_RATIO = 2;
const MIN_PIXEL_RATIO = 1;
const MIN_CANVAS_SIDE = 1;
const LOSE_CONTEXT_EXTENSION = "WEBGL_lose_context";

export interface CssSize {
  readonly width: number;
  readonly height: number;
}

/** Tamanho em px de CSS mais a razão de pixels já limitada. O buffer é `width * pixelRatio`. */
export interface SceneSize extends CssSize {
  readonly pixelRatio: number;
}

interface CanvasContextSource {
  readonly getContext: (contextId: "webgl2", attributes: WebGLContextAttributes) => unknown;
}

interface CanvasFactory {
  readonly createElement: (tagName: "canvas") => CanvasContextSource;
}

interface ExtensionSource {
  readonly getExtension: (name: string) => unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** `true` quando o visitante ligou a economia de dados (`navigator.connection.saveData`). */
export function readSaveData(navigatorLike: unknown): boolean {
  if (!isRecord(navigatorLike) || !isRecord(navigatorLike.connection)) {
    return false;
  }
  return navigatorLike.connection.saveData === true;
}

export function capPixelRatio(devicePixelRatio: unknown): number {
  if (typeof devicePixelRatio !== "number" || !Number.isFinite(devicePixelRatio)) {
    return MIN_PIXEL_RATIO;
  }
  return Math.min(Math.max(devicePixelRatio, MIN_PIXEL_RATIO), MAX_PIXEL_RATIO);
}

function toCanvasSide(value: number): number {
  return Number.isFinite(value) ? Math.max(Math.round(value), MIN_CANVAS_SIDE) : MIN_CANVAS_SIDE;
}

export function measureCanvas(cssSize: CssSize, devicePixelRatio: unknown): SceneSize {
  return {
    width: toCanvasSide(cssSize.width),
    height: toCanvasSide(cssSize.height),
    pixelRatio: capPixelRatio(devicePixelRatio),
  };
}

/**
 * Pede o contexto WebGL2 do canvas. `null` quando o navegador não entrega
 * (sem WebGL2, GPU na lista de bloqueio, limite de contextos): quem chama mostra o pôster.
 */
export function acquireWebGL2(
  canvas: CanvasContextSource,
  attributes: WebGLContextAttributes,
): WebGL2RenderingContext | null {
  try {
    const context = canvas.getContext("webgl2", attributes);
    return isRecord(context) ? (context as unknown as WebGL2RenderingContext) : null;
  } catch {
    return null;
  }
}

/** Devolve o contexto ao navegador na hora, sem esperar o coletor de lixo. */
export function releaseWebGL(gl: ExtensionSource): void {
  const extension = gl.getExtension(LOSE_CONTEXT_EXTENSION);
  if (isRecord(extension) && typeof extension.loseContext === "function") {
    extension.loseContext();
  }
}

/**
 * Sonda WebGL2 com um canvas descartável e solta o contexto em seguida.
 * Use antes de baixar o chunk do three: sem WebGL2 não vale a pena carregar 3D.
 */
export function hasWebGL2Support(documentLike: CanvasFactory): boolean {
  const gl = acquireWebGL2(documentLike.createElement("canvas"), {});
  if (gl === null) {
    return false;
  }
  releaseWebGL(gl);
  return true;
}
