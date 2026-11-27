import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { StageHandle } from "./ogl-stage";
import { IDLE_STATUS } from "./status";
import type { HeroStatus } from "./status";

export type StageMount = (host: HTMLElement, onStatus: (status: HeroStatus) => void) => StageHandle;

export interface HeroStageState {
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly status: HeroStatus;
  readonly isPlaying: boolean;
  readonly togglePlaying: () => void;
}

/**
 * Liga um palco ao ciclo de vida do React: monta no efeito, desmonta no cleanup.
 * O estado do React só muda em transição discreta (fase do hero, pausa); nada
 * aqui roda por frame (Piso P6).
 *
 * `mount` precisa ser estável (função de módulo ou `useCallback`), senão o palco
 * é recriado a cada render.
 */
export function useHeroStage(mount: StageMount): HeroStageState {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<StageHandle | null>(null);
  const isPlayingRef = useRef(true);
  const [status, setStatus] = useState<HeroStatus>(IDLE_STATUS);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return undefined;
    }
    const handle = mount(host, setStatus);
    handle.setPlaying(isPlayingRef.current);
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.dispose();
    };
  }, [mount]);

  const togglePlaying = (): void => {
    const nextIsPlaying = !isPlayingRef.current;
    isPlayingRef.current = nextIsPlaying;
    handleRef.current?.setPlaying(nextIsPlaying);
    setIsPlaying(nextIsPlaying);
  };

  return { hostRef, status, isPlaying, togglePlaying };
}
