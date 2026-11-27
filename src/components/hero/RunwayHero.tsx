"use client";

import { OglStage } from "./OglStage";
import type { HeroSceneLoader } from "./scene-contract";

const loadRunwayScene: HeroSceneLoader = () => import("./scenes/runway-scene");

/**
 * Camada WebGL2 do hero da home: luz de pista ao crepúsculo sobre a fotografia.
 * O chunk (ogl + shader) só é pedido depois do primeiro paint; sem WebGL2, com
 * Save-Data, movimento reduzido ou erro, fica só a fotografia do servidor.
 */
export function RunwayHero() {
  return <OglStage loadScene={loadRunwayScene} />;
}
