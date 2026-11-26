import type { ReactNode, RefObject } from "react";
import { HeroMotionToggle } from "./HeroMotionToggle";
import styles from "./HeroStage.module.css";
import type { HeroStatus } from "./status";

export interface StageFrameProps {
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly status: HeroStatus;
  readonly isPlaying: boolean;
  readonly onTogglePlaying: () => void;
  /** Cena em React (R3F). As cenas em ogl criam o próprio canvas dentro do host. */
  readonly children?: ReactNode;
}

/**
 * Marcação comum dos palcos: o host do canvas, com o estado exposto em data
 * attributes, e o botão de pausa enquanto houver animação rodando.
 */
export function StageFrame({ hostRef, status, isPlaying, onTogglePlaying, children }: StageFrameProps) {
  return (
    <>
      <div
        ref={hostRef}
        className={styles.stage}
        aria-hidden="true"
        data-hero-stage=""
        data-hero-state={status.phase}
        data-hero-reason={status.reason ?? undefined}
        data-hero-playing={isPlaying ? "true" : "false"}
      >
        {children}
      </div>
      {status.phase === "live" ? <HeroMotionToggle isPlaying={isPlaying} onToggle={onTogglePlaying} /> : null}
    </>
  );
}
