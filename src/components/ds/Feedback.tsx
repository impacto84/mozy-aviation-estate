import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./Feedback.module.css";

export interface SkeletonProps {
  readonly lines?: number;
  readonly label?: string;
}

/**
 * Esqueleto de carregamento sem deslocamento de layout (`CLS` zero).
 * Anuncia `aria-busy` e esconde as barras visuais de leitores de tela.
 */
export function Skeleton({ lines = 3, label = "Carregando conteúdo" }: SkeletonProps) {
  return (
    <div className={styles.skeletonGroup} role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={index === lines - 1 ? `${styles.skeletonBar} ${styles.skeletonShort}` : styles.skeletonBar}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly icon?: ReactNode;
}

/** Estado vazio ou de erro recuperável com ação primária explícita. */
export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon === undefined ? null : (
        <div className={styles.emptyIcon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
