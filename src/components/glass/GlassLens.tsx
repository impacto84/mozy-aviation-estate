import styles from "./Glass.module.css";
import { GlassLayers, joinClassNames } from "./GlassLayers";
import type { GlassTone } from "./GlassLayers";
import type { RefractionLevel } from "./refraction";

export interface GlassLensProps {
  readonly tone?: GlassTone;
  readonly refraction?: RefractionLevel;
  /** Tamanho e posição vêm de quem usa. */
  readonly className?: string;
}

/**
 * Lente de vidro: peça decorativa, sem conteúdo, com tinta rala e pouco blur,
 * para a refração aparecer.
 *
 * Não aceita filhos de propósito: a tinta rala não garante contraste. Texto vai
 * em `GlassPanel` ou `GlassPill`. Fica fora da árvore de acessibilidade.
 */
export function GlassLens({ tone = "auto", refraction = "strong", className }: GlassLensProps) {
  return (
    <div className={joinClassNames(styles.surface, styles.lens, className)} aria-hidden="true" data-glass="lens" data-glass-tone={tone}>
      <GlassLayers refraction={refraction} />
    </div>
  );
}
