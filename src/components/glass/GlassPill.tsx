import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Glass.module.css";
import { GlassLayers, joinClassNames } from "./GlassLayers";
import type { GlassTone } from "./GlassLayers";
import type { RefractionLevel } from "./refraction";

export interface GlassPillProps {
  readonly children: ReactNode;
  /** Com `href`, a pill é um link (rota interna ou URL). Sem, é um rótulo. */
  readonly href?: string;
  readonly tone?: GlassTone;
  /** Em peça pequena a ondulação quase não aparece; o padrão é sem refração. */
  readonly refraction?: RefractionLevel;
  readonly className?: string;
}

/**
 * Pílula de vidro: selo, rótulo de seção ou link de navegação flutuante.
 *
 * Server Component. Como link, tem a altura mínima de toque (`--target-min`) e
 * o anel de foco do site; o brilho sobe no hover e no foco.
 */
export function GlassPill({ children, href, tone = "auto", refraction = "none", className }: GlassPillProps) {
  const layers = (
    <>
      <GlassLayers refraction={refraction} />
      <span className={styles.content}>{children}</span>
    </>
  );
  if (href === undefined) {
    return (
      <span className={joinClassNames(styles.surface, styles.pill, className)} data-glass="pill" data-glass-tone={tone}>
        {layers}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={joinClassNames(styles.surface, styles.pill, styles.interactive, className)}
      data-glass="pill"
      data-glass-tone={tone}
    >
      {layers}
    </Link>
  );
}
