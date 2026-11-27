"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import styles from "./Glass.module.css";
import { watchGlassVisibility } from "./glass-visibility";
import { readRefractionEnvironment, refractionFilterId, refractionSpec, supportsRefraction } from "./refraction";
import type { RefractionLevel, RefractionSpec } from "./refraction";

export interface GlassBackdropProps {
  readonly refraction: RefractionLevel;
}

interface RefractionFilterProps {
  readonly id: string;
  readonly spec: RefractionSpec;
}

/** O suporte não muda durante a visita: não há o que assinar. */
function subscribeToNothing(): () => void {
  return () => undefined;
}

function readClientSupport(): boolean {
  return supportsRefraction(readRefractionEnvironment(window));
}

/** No servidor e durante a hidratação, a refração fica desligada. */
function readServerSupport(): boolean {
  return false;
}

/**
 * Filtro de refração: ruído suave vira mapa de deslocamento do fundo.
 * `colorInterpolationFilters="sRGB"` mantém o cinza médio do ruído em 0,5; no
 * padrão (linearRGB) o mapa ganha um viés e o fundo inteiro escorrega de lado.
 */
function RefractionFilter({ id, spec }: RefractionFilterProps) {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${spec.frequencyX} ${spec.frequencyY}`}
          numOctaves={spec.octaves}
          seed={spec.seed}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={spec.softness} result="soft-noise" />
        <feDisplacementMap in="SourceGraphic" in2="soft-noise" scale={spec.scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/**
 * Camada de fundo do vidro e a única parte que roda no cliente.
 *
 * - Desliga o `backdrop-filter` quando a camada está longe da viewport.
 * - Liga a refração só onde o navegador a desenha, com um `<filter>` de id
 *   próprio (`useId`), para várias instâncias conviverem na mesma página.
 */
export function GlassBackdrop({ refraction }: GlassBackdropProps) {
  const layerRef = useRef<HTMLSpanElement>(null);
  const filterId = refractionFilterId(useId());
  const isSupported = useSyncExternalStore(subscribeToNothing, readClientSupport, readServerSupport);
  const spec = isSupported ? refractionSpec(refraction) : null;

  useEffect(() => {
    const layer = layerRef.current;
    if (layer === null) {
      return undefined;
    }
    return watchGlassVisibility(layer);
  }, []);

  if (spec === null) {
    return <span ref={layerRef} className={styles.backdrop} aria-hidden="true" data-glass-layer="backdrop" data-glass-refraction="off" />;
  }
  return (
    <span
      ref={layerRef}
      className={styles.backdrop}
      aria-hidden="true"
      data-glass-layer="backdrop"
      data-glass-refraction="on"
      style={{ "--glass-refraction-filter": `url(#${filterId})` } as CSSProperties}
    >
      <RefractionFilter id={filterId} spec={spec} />
    </span>
  );
}
