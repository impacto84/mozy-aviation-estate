"use client";

import { useState } from "react";
import { hubReach, REACH_LABEL } from "@/lib/aviation/range";
import { AIRCRAFT_SPECS, RUNWAY_PREMISE, findAircraft, formatKm, formatMeters, formatNm, lateralClearance, nmToKm, runwayUse } from "@/lib/aviation/specs";
import type { AircraftName } from "@/lib/aviation/specs";
import { tiers } from "@/lib/site-data";
import styles from "./FleetSimulator.module.css";
import { RangeMap } from "./RangeMap";
import { RunwayEnvelope, RunwayLength } from "./RunwayDiagram";
import { TOTAL_UNITS, findTier, percent, unitShare } from "./simulator-model";
import type { TierName } from "./simulator-model";

interface FleetSimulatorProps {
  /** `teaser` (home): só a aeronave. `full` (/aviacao): aeronave + coleção + gabarito da pista inteira. */
  readonly variant?: "teaser" | "full";
}

const SPEC_NOTE =
  "Números públicos do fabricante da aeronave de referência, arredondados: alcance nominal sem vento nem reservas adicionais; decolagem com peso máximo, nível do mar, ISA. A pista do projeto é a premissa inicial de 3.000 × 45 m; IFR / GPS sujeito à aprovação.";

/**
 * Console aeronáutico em escala real: a aeronave crítica escolhida aparece em
 * silhueta métrica sobre a largura da pista-premissa, na pista inteira (decolagem
 * publicada × 3.000 m) e no mapa hemisférico de alcance a partir de Orlando.
 * Estado só de escolha (clique), nada por quadro.
 */
export function FleetSimulator({ variant = "full" }: FleetSimulatorProps) {
  const [model, setModel] = useState<AircraftName>("Global 7000 / 7500");
  const [tierName, setTierName] = useState<TierName>("Founder Estates");
  const spec = findAircraft(model);
  const tier = findTier(tierName);
  const reach = hubReach(spec);
  const isFull = variant === "full";
  const groupName = `aeronave-${variant}`;

  return (
    <div className={styles.console} data-variant={variant}>
      <fieldset className={styles.selector}>
        <legend className={styles.legend}>Aeronave crítica</legend>
        <div className={styles.options}>
          {AIRCRAFT_SPECS.map((entry) => (
            <label key={entry.name} className={styles.option}>
              <input className={styles.radio} type="radio" name={groupName} value={entry.name} checked={model === entry.name} onChange={() => setModel(entry.name)} />
              <span className={styles.optionName}>{entry.name}</span>
              <span className={`${styles.optionMeta} tnum`}>{formatMeters(entry.wingspanM)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.panels}>
        <figure className={styles.panel}>
          <figcaption className={styles.panelHead}>
            <span className={styles.panelIndex}>01</span> Envelope de pista em escala física · 1 m = 1 m
          </figcaption>
          <RunwayEnvelope spec={spec} />
          {isFull ? <RunwayLength spec={spec} /> : null}
        </figure>
        <figure className={styles.panel}>
          <figcaption className={styles.panelHead}>
            <span className={styles.panelIndex}>02</span> Alcance sem escala a partir de Orlando · MCO
          </figcaption>
          <RangeMap spec={spec} />
          <ul className={styles.legendRow} role="list">
            <li data-reach="nonstop">{REACH_LABEL.nonstop}</li>
            <li data-reach="limit">{REACH_LABEL.limit} (90–100%)</li>
            <li data-reach="out">{REACH_LABEL.out}</li>
          </ul>
        </figure>
      </div>

      <div className={styles.readout} aria-live="polite">
        <p className={styles.readoutTitle}>
          <span className={styles.readoutKicker}>Especificação pública da aeronave de referência</span>
          {spec.reference}
        </p>
        <dl className={styles.specs}>
          <div>
            <dt>Envergadura</dt>
            <dd className="tnum">{formatMeters(spec.wingspanM)}</dd>
          </div>
          <div>
            <dt>Comprimento</dt>
            <dd className="tnum">{formatMeters(spec.lengthM)}</dd>
          </div>
          <div>
            <dt>Alcance nominal</dt>
            <dd className="tnum">
              {formatNm(spec.rangeNm)} · {formatKm(nmToKm(spec.rangeNm))}
            </dd>
          </div>
          <div>
            <dt>Decolagem publicada</dt>
            <dd className="tnum">
              {formatMeters(spec.takeoffM)} · {percent(runwayUse(spec))} de {RUNWAY_PREMISE.lengthM.toLocaleString("pt-BR")} m
            </dd>
          </div>
          <div>
            <dt>Folga lateral na pista de {RUNWAY_PREMISE.widthM} m</dt>
            <dd className="tnum">{formatMeters(lateralClearance(spec))} por lado</dd>
          </div>
        </dl>
        <ol className={styles.reachList}>
          {reach.map((entry) => (
            <li key={entry.hub.id} className={styles.reachItem} data-reach={entry.status}>
              <span className={styles.reachCity}>{entry.hub.city}</span>
              <span className="tnum">{formatNm(entry.distanceNm)}</span>
              <span className={styles.reachStatus}>{REACH_LABEL[entry.status]}</span>
            </li>
          ))}
        </ol>
        <p className={styles.note}>{SPEC_NOTE}</p>
      </div>

      {isFull ? (
        <div className={styles.tierBlock}>
          <fieldset className={styles.selector}>
            <legend className={styles.legend}>Coleção residencial</legend>
            <div className={styles.options}>
              {tiers.map((entry) => (
                <label key={entry.name} className={styles.option}>
                  <input className={styles.radio} type="radio" name="colecao" value={entry.name} checked={tierName === entry.name} onChange={() => setTierName(entry.name)} />
                  <span className={styles.optionName}>{entry.name}</span>
                  <span className={`${styles.optionMeta} tnum`}>{entry.count} un.</span>
                </label>
              ))}
            </div>
          </fieldset>
          <dl className={styles.specs} aria-live="polite">
            <div>
              <dt>Hangar</dt>
              <dd>{tier.hangar}</dd>
            </div>
            <div>
              <dt>Lote · área</dt>
              <dd className="tnum">
                {tier.acres} · {tier.size}
              </dd>
            </div>
            <div>
              <dt>Faixa</dt>
              <dd className="tnum">{tier.price}</dd>
            </div>
            <div>
              <dt>Participação</dt>
              <dd className="tnum">
                {tier.count} de {TOTAL_UNITS} residências · {percent(unitShare(tier))}
              </dd>
            </div>
          </dl>
          <p className={styles.note}>
            {model} → {tier.hangar.toLowerCase()} ({tier.name}). {tier.note}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
