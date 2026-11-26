"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { lands } from "@/lib/site-data";
import { DETAIL_VIEWS, FLY_TO_SCALE, OVERVIEW, detailImage, findLand, flyToOrigin, percentValue } from "./atlas-model";
import type { DetailView, LandId } from "./atlas-model";
import styles from "./SatelliteAtlas.module.css";

type Camera = "regional" | "site";

interface SatelliteAtlasProps {
  /** Id do título do dossiê (único por página). */
  readonly dossierId?: string;
}

/**
 * Atlas Satelital com câmera contínua (fly-to). A carta regional real recebe
 * `transform-origin` no marcador do terreno e mergulha em `scale(4.4)` em 1000 ms
 * (só `transform` e `opacity`, na GPU); no pouso, a imagem de detalhe (satélite
 * amplo, próximo ou foto do anúncio) entra em fusão. "Voltar à carta regional"
 * faz o caminho inverso. Com movimento reduzido a troca é direta.
 */
export function SatelliteAtlas({ dossierId = "dossie-titulo" }: SatelliteAtlasProps) {
  const [landId, setLandId] = useState<LandId>("honey");
  const [camera, setCamera] = useState<Camera>("regional");
  const [view, setView] = useState<DetailView>("wide");
  const land = findLand(landId);
  const isSite = camera === "site";

  const flyTo = (id: LandId): void => {
    setLandId(id);
    setCamera("site");
  };

  return (
    <div className={styles.atlas}>
      <div className={styles.toolbar}>
        <div className={styles.group} role="group" aria-label="Terreno candidato">
          {lands.map((entry, index) => (
            <button key={entry.id} type="button" className={styles.toggle} aria-pressed={isSite && entry.id === landId} onClick={() => flyTo(entry.id)}>
              <span className={`${styles.toggleIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
              <span>{entry.name}</span>
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="Vista do terreno">
          {DETAIL_VIEWS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={styles.toggleSmall}
              aria-pressed={isSite && entry.id === view}
              disabled={!isSite}
              onClick={() => setView(entry.id)}
            >
              {entry.label}
            </button>
          ))}
          <button type="button" className={styles.back} disabled={!isSite} onClick={() => setCamera("regional")}>
            ← Voltar à carta regional
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <figure className={styles.stage} data-camera={camera} data-atlas-stage="">
          <div
            className={styles.regional}
            data-atlas-regional=""
            style={{ "--origin": flyToOrigin(land), "--zoom": isSite ? FLY_TO_SCALE : 1 } as CSSProperties}
          >
            <Image className={styles.image} src={OVERVIEW.src} alt={OVERVIEW.alt} width={OVERVIEW.width} height={OVERVIEW.height} sizes="(min-width: 1200px) 62vw, 100vw" quality={88} />
            {lands.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.marker}
                style={{ "--x": `${percentValue(entry.ox)}%`, "--y": `${percentValue(entry.oy)}%` } as CSSProperties}
                aria-pressed={entry.id === landId}
                aria-label={`Voar até ${entry.name}`}
                tabIndex={isSite ? -1 : 0}
                onClick={() => flyTo(entry.id)}
              >
                <span className={styles.markerLabel}>{entry.name}</span>
              </button>
            ))}
          </div>
          {lands.map((entry) =>
            DETAIL_VIEWS.map((detail) => {
              const image = detailImage(entry, detail.id);
              const isActive = isSite && entry.id === landId && detail.id === view;
              return (
                <div key={`${entry.id}-${detail.id}`} className={styles.detail} data-active={isActive} aria-hidden={!isActive}>
                  {entry.id === landId ? (
                    <Image className={styles.image} src={image.src} alt={isActive ? image.alt : ""} width={image.width} height={image.height} sizes="(min-width: 1200px) 62vw, 100vw" quality={88} />
                  ) : null}
                </div>
              );
            }),
          )}
          <figcaption className={styles.stageCaption}>
            <span className="tnum">{isSite ? `${DETAIL_VIEWS.find((entry) => entry.id === view)?.label} · ${land.name}` : "Carta regional · Central Florida"}</span>
            <span className="tnum">{isSite ? `ZOOM ${FLY_TO_SCALE.toLocaleString("pt-BR")}×` : "ESCOLHA UM TERRENO"}</span>
          </figcaption>
        </figure>

        <article className={styles.dossier} aria-live="polite" aria-labelledby={dossierId}>
          <p className={styles.priority}>{land.priority}</p>
          <h3 id={dossierId} className={styles.name}>
            {land.name}
          </h3>
          <p className={styles.place}>{land.place}</p>
          <div className={`${styles.kpi} tnum`}>
            <span className={styles.kpiAcres}>{land.acres}</span>
            <span className={styles.kpiPrice}>{land.price}</span>
          </div>
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
