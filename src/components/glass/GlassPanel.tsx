import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Glass.module.css";
import { GlassLayers, joinClassNames } from "./GlassLayers";
import type { GlassTone } from "./GlassLayers";
import type { RefractionLevel } from "./refraction";

export type GlassPanelTag = "div" | "section" | "article" | "aside" | "li";

export interface GlassPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "className"> {
  readonly children: ReactNode;
  readonly as?: GlassPanelTag;
  readonly tone?: GlassTone;
  /** Ondulação do fundo. Só aparece onde o navegador desenha filtro SVG no backdrop-filter. */
  readonly refraction?: RefractionLevel;
  readonly className?: string;
}

/**
 * Painel de vidro: cartão, barra flutuante ou moldura sobre foto, gradiente ou canvas.
 *
 * Server Component. O texto fica legível sobre qualquer fundo porque a camada de
 * tinta cobre 80% dele; sem `backdrop-filter`, o painel vira uma superfície opaca.
 * Texto secundário aqui dentro usa `var(--glass-text-muted)`.
 */
export function GlassPanel({ children, as = "div", tone = "auto", refraction = "soft", className, ...rest }: GlassPanelProps) {
  // Os cinco elementos aceitam os mesmos atributos; o cast só unifica o tipo.
  const Tag = as as "div";
  return (
    <Tag {...rest} className={joinClassNames(styles.surface, styles.panel, className)} data-glass="panel" data-glass-tone={tone}>
      <GlassLayers refraction={refraction} />
      <div className={styles.content}>{children}</div>
    </Tag>
  );
}
