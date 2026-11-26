/**
 * Cena do ShaderHero: um triângulo de tela cheia e um fragment shader (ogl).
 * Este módulo só é importado por `import()` depois que o pôster pintou.
 */

import { Mesh, Program, Renderer, Triangle } from "ogl";
import type { HeroScene, HeroSceneInit } from "../scene-contract";
import { SHADER_HERO_DEFAULTS, createShaderUniforms, resolveSideLayout, toBufferResolution } from "../uniforms";
import { assertProgramLinked, resizeRenderer } from "./ogl-helpers";
import { SHADER_FRAGMENT, SHADER_VERTEX } from "./shader-glsl";

/** Canvas opaco: cobre o pôster inteiro. Sem depth nem MSAA: é um plano 2D. */
export const contextAttributes: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: "default",
};

export function createScene({ canvas, palette, size }: HeroSceneInit): HeroScene {
  const renderer = new Renderer({
    canvas,
    width: size.width,
    height: size.height,
    dpr: size.pixelRatio,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  const gl = renderer.gl;
  resizeRenderer(renderer, size);

  const uniforms = createShaderUniforms(palette, SHADER_HERO_DEFAULTS, size);
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: SHADER_VERTEX,
    fragment: SHADER_FRAGMENT,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  assertProgramLinked(gl, program);
  const mesh = new Mesh(gl, { geometry, program });

  return {
    render(frame) {
      uniforms.uTime.value = frame.time;
      uniforms.uProgress.value = frame.progress;
      renderer.render({ scene: mesh });
    },
    resize(nextSize) {
      resizeRenderer(renderer, nextSize);
      uniforms.uResolution.value = toBufferResolution(nextSize);
      uniforms.uSideLayout.value = resolveSideLayout(nextSize.width);
    },
    dispose() {
      program.remove();
      geometry.remove();
    },
  };
}
