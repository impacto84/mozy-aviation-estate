import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./LinkButton.module.css";

interface LinkButtonProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: "primary" | "ghost" | "text";
  /** Marcador do gate (`data-forja-cta`). */
  readonly ctaRole?: "primary" | "secondary" | "header";
  /** Seta de direção ao fim do rótulo (só nos botões). */
  readonly hasArrow?: boolean;
}

/**
 * Link com aparência de CTA arquitetônico (canto reto, fio de latão). Rotas internas
 * usam `next/link`; `tel:`/`mailto:`/âncoras usam `<a>`.
 */
export function LinkButton({ href, children, variant = "primary", ctaRole, hasArrow = variant !== "text" }: LinkButtonProps) {
  const className = styles[variant];
  const isInternal = href.startsWith("/");
  const content = (
    <>
      <span>{children}</span>
      {hasArrow ? (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      ) : null}
    </>
  );
  return isInternal ? (
    <Link className={className} href={href} data-forja-cta={ctaRole}>
      {content}
    </Link>
  ) : (
    <a className={className} href={href} data-forja-cta={ctaRole}>
      {content}
    </a>
  );
}
