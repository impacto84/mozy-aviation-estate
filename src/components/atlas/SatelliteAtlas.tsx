"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { lands } from "@/lib/site-data";
import { ATLAS_VIEWS, atlasImage, findLand, percentValue } from "./atlas-model";
import type { AtlasView, LandId } from "./atlas-model";
import styles from "./SatelliteAtlas.module.css";

/**
 * Atlas Satelital Interativo: três terrenos candidatos na Flórida Central, cada um
 * em três vistas reais (satélite regional com marcadores, satélite aproximado e
 * foto do anúncio), com o dossiê do terreno ao lado. Sem animação contínua.
 */
export function SatelliteAtlas() {
  const [landId, setLandId] = useState<LandId>("honey");
  const [view, setView] = useState<AtlasView>("regional");
  const land = findLand(landId);
  const image = atlasImage(land, view);

  return (
    <div className={styles.atlas}>
      <div className={styles.toolbar}>
        <div className={styles.group} role="group" aria-label="Terreno">
          {lands.map((entry) => (
            <button key={entry.id} type="button" className={styles.toggle} aria-pressed={entry.id === landId} onClick={() => setLandId(entry.id)}>
              {entry.name}
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="Vista">
          {ATLAS_VIEWS.map((entry) => (
            <button key={entry.id} type="button" className={styles.toggleSmall} aria-pressed={entry.id === view} onClick={() => setView(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <figure className={styles.stage} data-view={view}>
          <Image key={image.src} className={styles.image} src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1200px) 62vw, 100vw" quality={72} />
          {view === "regional"
            ? lands.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.marker}
                  style={{ "--x": `${percentValue(entry.ox)}%`, "--y": `${percentValue(entry.oy)}%` } as CSSProperties}
                  aria-pressed={entry.id === landId}
                  aria-label={`Selecionar ${entry.name}`}
                  onClick={() => setLandId(entry.id)}
                >
                  <span className={styles.markerLabel}>{entry.name}</span>
                </button>
              ))
            : null}
          <figcaption className={styles.stageCaption}>
            <span>{ATLAS_VIEWS.find((entry) => entry.id === view)?.label}</span>
            <span>{land.name}</span>
          </figcaption>
        </figure>

        <article className={styles.dossier} aria-live="polite" aria-labelledby="dossie-titulo">
          <p className={styles.priority}>{land.priority}</p>
          <h3 id="dossie-titulo" className={styles.name}>
            {land.name}
          </h3>
          <p className={styles.place}>{land.place}</p>
          <p className={`${styles.kpi} tnum`}>
            {land.acres}
            <span className={styles.kpiPrice}>{land.price}</span>
          </p>
          <dl className={styles.facts}>
            <div>
              <dt>Zoning</dt>
              <dd>{land.zoning}</dd>
            </div>
            <div>
              <dt>Acesso</dt>
              <dd className="tnum">{land.access}</dd>
            </div>
            <div>
              <dt>Atributos</dt>
              <dd className="tnum">{land.extra}</dd>
            </div>
            <div>
              <dt>Força</dt>
              <dd>{land.strength}</dd>
            </div>
            <div>
              <dt>Risco</dt>
              <dd>{land.risk}</dd>
            </div>
            <div>
              <dt>Teste crítico</dt>
              <dd className="tnum">{land.test}</dd>
            </div>
          </dl>
          <p className={styles.note}>{land.note}</p>
        </article>
      </div>
    </div>
  );
}
