"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AVIATION } from "@/lib/editorial";
import { aircraft, tiers } from "@/lib/site-data";
import { MOTION_DURATION_MS, MOTION_EASE_POINTS } from "@/lib/motion/tokens";
import styles from "./FleetSimulator.module.css";
import { RunwayDiagram } from "./RunwayDiagram";
import { TIER_ROUTES, TOTAL_UNITS, describeSelection, findTier, headingDegrees, unitShare } from "./simulator-model";
import type { AircraftName, TierName } from "./simulator-model";

const TAXI_DURATION_MS = MOTION_DURATION_MS.slow * 2.5;
const TAXI_EASING = `cubic-bezier(${MOTION_EASE_POINTS.inOut.join(", ")})`;
const PATH_SAMPLES = 32;
const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";

/** Quadros de transformação ao longo do caminho de táxi (SVG em unidades de usuário). */
function taxiKeyframes(path: SVGPathElement): Keyframe[] {
  const length = path.getTotalLength();
  const frames: Keyframe[] = [];
  let previous = path.getPointAtLength(0);
  for (let step = 0; step <= PATH_SAMPLES; step += 1) {
    const point = path.getPointAtLength((length * step) / PATH_SAMPLES);
    const ahead = path.getPointAtLength(Math.min(length, (length * (step + 1)) / PATH_SAMPLES));
    const angle = step === PATH_SAMPLES ? headingDegrees(point.x - previous.x, point.y - previous.y) : headingDegrees(ahead.x - point.x, ahead.y - point.y);
    frames.push({ transform: `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)` });
    previous = point;
  }
  return frames;
}

/**
 * Simulador interativo: aeronave crítica × coleção residencial. A escolha atualiza
 * as métricas (só dados do brief) e anima, uma vez, o táxi da pista até o hangar
 * da coleção. Sem laço contínuo; com movimento reduzido a aeronave vai direto ao destino.
 */
export function FleetSimulator() {
  const [model, setModel] = useState<AircraftName>("Global 7000 / 7500");
  const [tierName, setTierName] = useState<TierName>("Founder Estates");
  const pathRef = useRef<SVGPathElement | null>(null);
  const planeRef = useRef<SVGGElement | null>(null);
  const tier = findTier(tierName);
  const route = TIER_ROUTES[tierName];

  useEffect(() => {
    const path = pathRef.current;
    const plane = planeRef.current;
    if (path === null || plane === null || typeof plane.animate !== "function") {
      return undefined;
    }
    const frames = taxiKeyframes(path);
    const last = frames.at(-1);
    const shouldAnimate = window.matchMedia(MOTION_ALLOWED_QUERY).matches;
    if (!shouldAnimate || last === undefined) {
      plane.style.transform = typeof last?.transform === "string" ? last.transform : "";
      return undefined;
    }
    plane.style.transform = "";
    const animation = plane.animate(frames, { duration: TAXI_DURATION_MS, easing: TAXI_EASING, fill: "forwards" });
    return () => animation.cancel();
  }, [model, tierName]);

  return (
    <div className={styles.simulator}>
      <div className={styles.controls}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Aeronave crítica</legend>
          <div className={styles.options}>
            {aircraft.map((name) => (
              <label key={name} className={styles.option}>
                <input className={styles.radio} type="radio" name="aeronave" value={name} checked={model === name} onChange={() => setModel(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Coleção residencial</legend>
          <div className={styles.options}>
            {tiers.map((entry) => (
              <label key={entry.name} className={styles.option}>
                <input className={styles.radio} type="radio" name="colecao" value={entry.name} checked={tierName === entry.name} onChange={() => setTierName(entry.name)} />
                <span>
                  {entry.name} <span className={`${styles.optionMeta} tnum`}>· {entry.count} un.</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <figure className={styles.diagramFrame}>
        <RunwayDiagram activeTier={tierName} pathRef={pathRef} planeRef={planeRef} planeLabel={model} label={describeSelection(model, tierName)} />
        <figcaption className={styles.caption}>Esquema conceitual, fora de escala. {AVIATION.masterplanNote}</figcaption>
      </figure>

      <div className={styles.readout} aria-live="polite">
        <p className={styles.readoutTitle}>
          <span className={styles.readoutModel}>{model}</span> → {route.destination}
        </p>
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt>Pista</dt>
            <dd className="tnum">{AVIATION.infrastructure[0]}</dd>
          </div>
          <div className={styles.metric}>
            <dt>Coleção</dt>
            <dd className="tnum">
              {tier.name} · {tier.count} de {TOTAL_UNITS} residências
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Participação no total</dt>
            <dd>
              <span className={styles.shareBar} style={{ "--share": unitShare(tier) } as CSSProperties} aria-hidden="true" />
              <span className="tnum">{Math.round(unitShare(tier) * 100)}%</span>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Hangar</dt>
            <dd>{tier.hangar}</dd>
          </div>
          <div className={styles.metric}>
            <dt>Lote · área</dt>
            <dd className="tnum">
              {tier.acres} · {tier.size}
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Faixa de preço</dt>
            <dd className={`${styles.price} tnum`}>{tier.price}</dd>
          </div>
          <div className={styles.metric}>
            <dt>Serviços</dt>
            <dd>{AVIATION.infrastructure[3]}</dd>
          </div>
          <div className={styles.metric}>
            <dt>Procedimentos</dt>
            <dd>{AVIATION.infrastructure[4]}</dd>
          </div>
        </dl>
        <p className={styles.readoutNote}>{tier.note}</p>
      </div>
    </div>
  );
}
