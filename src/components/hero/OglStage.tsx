"use client";

import { useCallback } from "react";
import { useMotionScheduler } from "@/components/motion/MotionContext";
import { mountOglStage } from "./ogl-stage";
import type { HeroSceneLoader } from "./scene-contract";
import type { ProgressSource } from "./scroll-progress";
import { StageFrame } from "./StageFrame";
import { useHeroStage } from "./useHeroStage";
import type { StageMount } from "./useHeroStage";

export interface OglStageProps {
  /** Função de módulo (estável) que faz o `import()` da cena. */
  readonly loadScene: HeroSceneLoader;
  /**
   * Fonte externa do progresso de rolagem (0 a 1), estável entre renders.
   * Sem ela, o palco mede a rolagem da própria seção.
   */
  readonly progress?: ProgressSource;
}

/** Palco de uma cena em ogl. Não importa ogl: o chunk da cena só chega por `loadScene`. */
export function OglStage({ loadScene, progress }: OglStageProps) {
  // Sob um `ScrollProvider` o palco anda no relógio da página; fora dele, no próprio rAF (Piso P4).
  const scheduler = useMotionScheduler();
  const mount = useCallback<StageMount>(
    (host, onStatus) => mountOglStage(host, { loadScene, onStatus, progress, scheduler }),
    [loadScene, progress, scheduler],
  );
  const { hostRef, status, isPlaying, togglePlaying } = useHeroStage(mount);

  return <StageFrame hostRef={hostRef} status={status} isPlaying={isPlaying} onTogglePlaying={togglePlaying} />;
}
