/** Ajudas comuns às cenas em ogl. Só entram no chunk lazy da cena. */

import type { Program, Renderer } from "ogl";
import type { SceneSize } from "../support";

/**
 * Lança quando o programa não ligou. O ogl só avisa no console e segue; aqui a
 * falha vira exceção para o palco mostrar o pôster em vez de um canvas vazio.
 * Com o contexto perdido o status de link é falso por definição: nesse caso não é erro de shader.
 */
export function assertProgramLinked(gl: WebGLRenderingContext | WebGL2RenderingContext, program: Program): void {
  if (gl.isContextLost() || gl.getProgramParameter(program.program, gl.LINK_STATUS) === true) {
    return;
  }
  const log = gl.getProgramInfoLog(program.program) ?? "sem log do driver";
  throw new Error(`Shader do hero não compilou: ${log}`);
}

/**
 * Aplica tamanho e DPR ao renderer. O ogl também grava `width`/`height` em px no
 * estilo inline do canvas; removemos para o CSS (`100%`) continuar mandando no layout.
 */
export function resizeRenderer(renderer: Renderer, size: SceneSize): void {
  // Exceção documentada à imutabilidade: `dpr` é estado do renderer de GL.
  renderer.dpr = size.pixelRatio;
  renderer.setSize(size.width, size.height);
  const canvas = renderer.gl.canvas;
  if (canvas instanceof HTMLCanvasElement) {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
  }
}
