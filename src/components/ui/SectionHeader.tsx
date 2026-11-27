import type { ReactNode } from "react";
import styles from "./Section.module.css";

interface SectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly lede?: ReactNode;
  /** Numeração editorial discreta (usada com moderação, não em toda seção). */
  readonly index?: string;
  /** Título à esquerda e texto de apoio à direita no desktop. */
  readonly isSplit?: boolean;
}

/** Cabeçalho de seção: `<h2>` com id (para `aria-labelledby`) e texto de apoio opcional. */
export function SectionHeader({ id, title, lede, index, isSplit = false }: SectionHeaderProps) {
  return (
    <div className={isSplit ? `${styles.header} ${styles.headerSplit}` : styles.header}>
      <div>
        {index === undefined ? null : <p className={styles.index}>{index}</p>}
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
      </div>
      {lede === undefined ? null : <p className={styles.lede}>{lede}</p>}
    </div>
  );
}
