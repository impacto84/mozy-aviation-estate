import type { ReactNode } from "react";
import styles from "./PlaceholderLogos.module.css";

/**
 * Logos de exemplo, desenhados para o FORJA: formas geométricas simples e nomes
 * genéricos. Não representam empresas. Em um site de verdade, troque pelos logos
 * do brief (Piso P11: nunca inventar logo de cliente).
 */
export interface PlaceholderLogo {
  readonly name: string;
  readonly mark: ReactNode;
}

const MARK_SIZE = 32;

interface MarkProps {
  readonly children: ReactNode;
}

function Mark({ children }: MarkProps) {
  return (
    <svg className={styles.mark} viewBox="0 0 32 32" width={MARK_SIZE} height={MARK_SIZE} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const PLACEHOLDER_LOGOS: readonly PlaceholderLogo[] = [
  {
    name: "Orbe",
    mark: (
      <Mark>
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="16" cy="16" r="4" fill="currentColor" />
      </Mark>
    ),
  },
  {
    name: "Trama",
    mark: (
      <Mark>
        <path d="M5 9h22M5 16h22M5 23h22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M11 5v22M21 5v22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </Mark>
    ),
  },
  {
    name: "Vértice",
    mark: (
      <Mark>
        <path d="M16 4 29 27H3Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </Mark>
    ),
  },
  {
    name: "Maré",
    mark: (
      <Mark>
        <path d="M3 13c4-5 8-5 13 0s9 5 13 0M3 22c4-5 8-5 13 0s9 5 13 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </Mark>
    ),
  },
  {
    name: "Prisma",
    mark: (
      <Mark>
        <rect x="5" y="5" width="22" height="22" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M5 27 27 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </Mark>
    ),
  },
  {
    name: "Fagulha",
    mark: (
      <Mark>
        <path d="M16 3v9M16 20v9M3 16h9M20 16h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </Mark>
    ),
  },
];

export interface PlaceholderLogoViewProps {
  readonly logo: PlaceholderLogo;
}

export function PlaceholderLogoView({ logo }: PlaceholderLogoViewProps) {
  return (
    <span className={styles.logo}>
      {logo.mark}
      <span className={styles.name}>{logo.name}</span>
    </span>
  );
}
