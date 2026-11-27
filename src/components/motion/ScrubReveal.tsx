import type { ReactNode } from "react";
import styles from "./Reveal.module.css";

export interface ScrubRevealProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Entrada presa à rolagem, só com CSS (`animation-timeline: view()`). É Server
 * Component: não manda JavaScript. Use para efeito decorativo que acompanha a
 * rolagem; para entrada que toca uma vez no tempo, use `Reveal`.
 */
export function ScrubReveal({ children, className }: ScrubRevealProps) {
  return <div className={className === undefined ? styles.scrub : `${styles.scrub} ${className}`}>{children}</div>;
}
