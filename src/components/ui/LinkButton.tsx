import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./LinkButton.module.css";

interface LinkButtonProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: "primary" | "ghost" | "text";
  /** Marcador do gate (`data-forja-cta`). */
  readonly ctaRole?: "primary" | "secondary";
}

/** Link com aparência de botão. Rotas internas usam `next/link`; `tel:`/`mailto:` usam `<a>`. */
export function LinkButton({ href, children, variant = "primary", ctaRole }: LinkButtonProps) {
  const className = styles[variant];
  const isInternal = href.startsWith("/");
  return isInternal ? (
    <Link className={className} href={href} data-forja-cta={ctaRole}>
      {children}
    </Link>
  ) : (
    <a className={className} href={href} data-forja-cta={ctaRole}>
      {children}
    </a>
  );
}
