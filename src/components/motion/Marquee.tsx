"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MARQUEE_DEFAULT_SPEED } from "@/lib/motion/marquee";
import styles from "./Marquee.module.css";
import { startMarquee } from "./marquee-runtime";

export interface MarqueeProps {
  /** Nome acessível do grupo, ex.: "Marcas que usam o produto". */
  readonly label: string;
  /** Os itens, cada um em `<MarqueeItem>`. */
  readonly children: ReactNode;
  /** Velocidade em px por segundo. */
  readonly speed?: number;
  readonly pauseLabel?: string;
  readonly resumeLabel?: string;
}

export interface MarqueeItemProps {
  readonly children: ReactNode;
}

const DEFAULT_PAUSE_LABEL = "Pausar faixa";
const DEFAULT_RESUME_LABEL = "Retomar faixa";

export function MarqueeItem({ children }: MarqueeItemProps) {
  return <li className={styles.item}>{children}</li>;
}

/**
 * Faixa de logos em movimento contínuo.
 *
 * - A lista real aparece uma vez; a cópia que fecha o laço é `aria-hidden` e `inert`.
 * - Pausa no hover, no foco, fora da viewport, com a aba oculta e pelo botão (WCAG 2.2.2).
 * - Com movimento reduzido ou sem JavaScript, vira uma grade estática com todos os itens à vista.
 */
export function Marquee({
  label,
  children,
  speed = MARQUEE_DEFAULT_SPEED,
  pauseLabel = DEFAULT_PAUSE_LABEL,
  resumeLabel = DEFAULT_RESUME_LABEL,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (root === null || group === null) {
      return undefined;
    }
    return startMarquee(root, group, speed);
  }, [speed]);

  return (
    <div
      ref={rootRef}
      className={styles.marquee}
      role="group"
      aria-label={label}
      data-forja-autoplay=""
      data-marquee-paused={isPaused}
      data-marquee-idle="false"
    >
      <div className={styles.viewport}>
        <ul ref={groupRef} className={styles.group} role="list">
          {children}
        </ul>
        <ul className={styles.group} aria-hidden="true" inert>
          {children}
        </ul>
      </div>
      {/* O rótulo muda com o estado, por isso o botão não leva aria-pressed. */}
      <button type="button" className={styles.toggle} data-forja-pause="" onClick={() => setIsPaused((wasPaused) => !wasPaused)}>
        {isPaused ? resumeLabel : pauseLabel}
      </button>
    </div>
  );
}
