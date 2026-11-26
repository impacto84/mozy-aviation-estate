"use client";

import { OglStage } from "./OglStage";
import type { HeroSceneLoader } from "./scene-contract";
import type { ProgressSource } from "./scroll-progress";

export interface ShaderHeroProps {
  /** Fonte externa do progresso de rolagem (0 a 1). Opcional; precisa ser estável entre renders. */
  readonly progress?: ProgressSource;
}

const loadShaderScene: HeroSceneLoader = () => import("./scenes/shader-scene");

/**
 * Fundo generativo em fragment shader (ogl). Use dentro de
 * `<HeroShell variant="bands">`. O chunk do shader só é pedido depois que o
 * pôster pintou; sem WebGL2, com Save-Data ou em erro, o pôster fica.
 */
export function ShaderHero({ progress }: ShaderHeroProps) {
  return <OglStage loadScene={loadShaderScene} progress={progress} />;
}
