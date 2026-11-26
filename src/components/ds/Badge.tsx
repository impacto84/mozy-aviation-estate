import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly dot?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Rótulo de estado semântico com suporte automático a claro/escuro via tokens. */
export function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
