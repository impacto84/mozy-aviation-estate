"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AmbientVideo.module.css";

interface AmbientVideoProps {
  readonly src: string;
  readonly poster: string;
  /** Descrição do vídeo para quem não vê (o vídeo é ambiente, sem áudio). */
  readonly label: string;
}

const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";
const VISIBLE_THRESHOLD = 0.15;

/**
 * Vídeo ambiente sem som. Toca só com a seção visível e a aba em primeiro plano
 * (`IntersectionObserver` + `visibilitychange`, Piso P5); com movimento reduzido
 * não toca sozinho (Piso P1). Botão de pausa sempre disponível (WCAG 2.2.2).
 * `preload="none"`: nenhum byte do vídeo antes de a seção se aproximar.
 */
export function AmbientVideo({ src, poster, label }: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return undefined;
    }
    const motion = window.matchMedia(MOTION_ALLOWED_QUERY);
    let isVisible = false;

    const sync = (): void => {
      const shouldPlay = isVisible && motion.matches && document.visibilityState === "visible" && !userPausedRef.current;
      if (shouldPlay && video.paused) {
        video.play().catch(() => setIsPlaying(false));
      } else if (!shouldPlay && !video.paused) {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: VISIBLE_THRESHOLD },
    );
    const onPlay = (): void => setIsPlaying(true);
    const onPause = (): void => setIsPlaying(false);

    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.pause();
    };
  }, []);

  const toggle = (): void => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    if (video.paused) {
      userPausedRef.current = false;
      video.play().catch(() => setIsPlaying(false));
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <div className={styles.frame} data-forja-autoplay="">
      <video ref={videoRef} className={styles.video} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} />
      <button type="button" className={styles.toggle} data-forja-pause="" aria-pressed={!isPlaying} onClick={toggle}>
        {isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
      </button>
    </div>
  );
}
