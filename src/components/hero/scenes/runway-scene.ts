/**
 * Cena do hero MOZY: camada de luz transparente sobre a fotografia (ogl).
 * Só é importada por `import()` depois que o pôster pintou (Piso P3).
 */

import { Mesh, Program, Renderer, Triangle } from "ogl";
import type { HeroScene, HeroSceneInit } from "../scene-contract";
import { srgbToLinear } from "../palette";
import { toBufferResolution } from "../uniforms";
import { assertProgramLinked, resizeRenderer } from "./ogl-helpers";
import { RUNWAY_FRAGMENT, RUNWAY_VERTEX } from "./runway-glsl";

/** Proporção da fotografia do pôster (`/media/estate-dusk.jpg`, 1672 × 942). */
export const POSTER_IMAGE_ASPECT = 1672 / 942;

/** Canvas transparente: a fotografia do servidor continua sendo o fundo. */
export const contextAttributes: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "low-power",
};

export function createScene({ canvas, palette, size }: HeroSceneInit): HeroScene {
  const renderer = new Renderer({
    canvas,
    width: size.width,
    height: size.height,
    dpr: size.pixelRatio,
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  resizeRenderer(renderer, size);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: toBufferResolution(size) },
    uImageAspect: { value: POSTER_IMAGE_ASPECT },
    uColorAccent: { value: srgbToLinear(palette.accent) },
    uColorInk: { value: srgbToLinear(palette.ink) },
  };
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: RUNWAY_VERTEX,
    fragment: RUNWAY_FRAGMENT,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  assertProgramLinked(gl, program);
  const mesh = new Mesh(gl, { geometry, program });

  return {
    render(frame) {
      uniforms.uTime.value = frame.time;
      renderer.render({ scene: mesh });
    },
    resize(nextSize) {
      resizeRenderer(renderer, nextSize);
      uniforms.uResolution.value = toBufferResolution(nextSize);
    },
    dispose() {
      program.remove();
      geometry.remove();
    },
  };
}
