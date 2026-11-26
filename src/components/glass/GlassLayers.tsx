import styles from "./Glass.module.css";
import { GlassBackdrop } from "./GlassBackdrop";
import type { RefractionLevel } from "./refraction";

/** `auto` segue o esquema de cor da página; `light` e `dark` fixam o do vidro. */
export type GlassTone = "auto" | "light" | "dark";

export interface GlassLayersProps {
  readonly refraction: RefractionLevel;
}

/** Junta nomes de classe, ignorando os ausentes. */
export function joinClassNames(...names: readonly (string | undefined)[]): string {
  return names.filter((name): name is string => name !== undefined && name !== "").join(" ");
}

/**
 * As quatro camadas decorativas do vidro, na ordem de pintura. Ficam fora da
 * árvore de acessibilidade e não recebem clique.
 */
export function GlassLayers({ refraction }: GlassLayersProps) {
  return (
    <>
      <GlassBackdrop refraction={refraction} />
      <span className={styles.tint} aria-hidden="true" data-glass-layer="tint" />
      <span className={styles.sheen} aria-hidden="true" data-glass-layer="sheen" />
      <span className={styles.rim} aria-hidden="true" data-glass-layer="rim" />
    </>
  );
}
