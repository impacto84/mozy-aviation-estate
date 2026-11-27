"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { armReveal } from "@/lib/motion/reveal";
import styles from "./Reveal.module.css";

export type RevealVariant = "up" | "fade" | "scale";
export type RevealTag = "div" | "section" | "article" | "li" | "p";

export interface RevealProps {
  readonly children: ReactNode;
  readonly as?: RevealTag;
  readonly variant?: RevealVariant;
  /** Posição entre irmãos, para a entrada em sequência (0, 1, 2…). */
  readonly index?: number;
  readonly className?: string;
}

/**
 * Entrada na rolagem. O HTML do servidor sai visível; depois da hidratação, só o
 * que está abaixo da dobra é escondido e revelado quando entra na tela. Sem JS,
 * com erro de script ou com movimento reduzido, nada é escondido.
 */
export function Reveal({ children, as = "div", variant = "up", index = 0, className }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  // Os cinco elementos aceitam os mesmos atributos; o cast só unifica o tipo do ref.
  const Tag = as as "div";

  useEffect(() => {
    const element = elementRef.current;
    if (element === null) {
      return undefined;
    }
    return armReveal(element);
  }, []);

  return (
    <Tag
      ref={elementRef}
      className={className === undefined ? styles.reveal : `${styles.reveal} ${className}`}
      data-reveal={variant}
      style={{ "--reveal-index": index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
