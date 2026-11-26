import { AIRCRAFT_SPECS, RUNWAY_PREMISE, formatMeters, lateralClearance, runwayUse } from "@/lib/aviation/specs";
import type { AircraftSpec } from "@/lib/aviation/specs";
import { silhouettePath } from "@/lib/aviation/silhouette";
import styles from "./FleetSimulator.module.css";

interface ScaleProps {
  readonly spec: AircraftSpec;
}

/** Escala comum do envelope: px do viewBox por metro. */
const PX_PER_M = 11;
const VIEW_W = 1000;
const VIEW_H = 600;
const CENTER_Y = VIEW_H / 2;
const AIRCRAFT_X = 600;
const DIMENSION_X = 120;
const SCALE_BAR_M = 10;
/** Tracejado do eixo: o padrão é visual, não uma medida declarada. */
const CENTERLINE_DASH = "40 26";

/**
 * Envelope de pista em escala física real (1 m = 11 unidades): a largura de 45 m da
 * premissa, a aeronave escolhida em silhueta top-down na proporção métrica pública
 * (envergadura × comprimento) e as outras cinco aeronaves críticas em contorno, na
 * mesma escala, para comparar a área ocupada.
 */
export function RunwayEnvelope({ spec }: ScaleProps) {
  const half = (RUNWAY_PREMISE.widthM * PX_PER_M) / 2;
  const top = CENTER_Y - half;
  const bottom = CENTER_Y + half;
  const tip = (spec.wingspanM * PX_PER_M) / 2;
  const noseX = AIRCRAFT_X + (spec.lengthM * PX_PER_M) / 2;
  const tailX = AIRCRAFT_X - (spec.lengthM * PX_PER_M) / 2;
  const clearance = lateralClearance(spec);
  const lengthY = Math.min(CENTER_Y + tip + 34, bottom - 22);
  return (
    <svg
      className={styles.envelope}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`${spec.reference} em escala real sobre a largura de ${RUNWAY_PREMISE.widthM} m da pista-premissa: envergadura ${formatMeters(spec.wingspanM)}, comprimento ${formatMeters(spec.lengthM)}, folga de ${formatMeters(clearance)} por lado.`}
    >
      <rect className={styles.ground} x="0" y="0" width={VIEW_W} height={VIEW_H} />
      <rect className={styles.runway} x="0" y={top} width={VIEW_W} height={half * 2} />
      <line className={styles.edge} x1="0" y1={top} x2={VIEW_W} y2={top} />
      <line className={styles.edge} x1="0" y1={bottom} x2={VIEW_W} y2={bottom} />
      <line className={styles.centerline} x1="0" y1={CENTER_Y} x2={VIEW_W} y2={CENTER_Y} strokeDasharray={CENTERLINE_DASH} />

      <g transform={`translate(${AIRCRAFT_X} ${CENTER_Y}) scale(${PX_PER_M})`}>
        {AIRCRAFT_SPECS.filter((entry) => entry.name !== spec.name).map((entry) => (
          <path key={entry.name} className={styles.ghost} d={silhouettePath(entry)} vectorEffect="non-scaling-stroke" />
        ))}
        <path className={styles.jet} d={silhouettePath(spec)} vectorEffect="non-scaling-stroke" />
      </g>

      {/* Envergadura */}
      <g className={styles.dimension}>
        <line x1={DIMENSION_X} y1={CENTER_Y - tip} x2={DIMENSION_X} y2={CENTER_Y + tip} />
        <line x1={DIMENSION_X - 10} y1={CENTER_Y - tip} x2={AIRCRAFT_X} y2={CENTER_Y - tip} className={styles.extension} />
        <line x1={DIMENSION_X - 10} y1={CENTER_Y + tip} x2={AIRCRAFT_X} y2={CENTER_Y + tip} className={styles.extension} />
        <text x={DIMENSION_X + 16} y={CENTER_Y - 8} className={styles.dimLabel}>
          ENVERGADURA
        </text>
        <text x={DIMENSION_X + 16} y={CENTER_Y + 26} className={styles.dimValue}>
          {formatMeters(spec.wingspanM)}
        </text>
      </g>

      {/* Comprimento */}
      <g className={styles.dimension}>
        <line x1={tailX} y1={lengthY} x2={noseX} y2={lengthY} />
        <line x1={tailX} y1={lengthY - 10} x2={tailX} y2={lengthY + 10} />
        <line x1={noseX} y1={lengthY - 10} x2={noseX} y2={lengthY + 10} />
        <text x={noseX + 14} y={lengthY + 8} className={styles.dimValue}>
          {formatMeters(spec.lengthM)}
        </text>
      </g>

      {/* Folga até a borda */}
      <g className={styles.clearance}>
        <line x1={AIRCRAFT_X - 120} y1={top} x2={AIRCRAFT_X - 120} y2={CENTER_Y - tip} />
        <text x={AIRCRAFT_X - 108} y={top + (CENTER_Y - tip - top) / 2 + 8} className={styles.dimLabel}>
          FOLGA {formatMeters(clearance)}
        </text>
      </g>

      <text x="24" y={top - 16} className={styles.dimLabel}>
        PISTA · {RUNWAY_PREMISE.widthM} M DE LARGURA · PREMISSA INICIAL
      </text>
      <g className={styles.scaleBar} transform={`translate(${VIEW_W - 24 - SCALE_BAR_M * PX_PER_M} ${VIEW_H - 24})`}>
        <line x1="0" y1="0" x2={SCALE_BAR_M * PX_PER_M} y2="0" />
        <line x1="0" y1="-8" x2="0" y2="8" />
        <line x1={SCALE_BAR_M * PX_PER_M} y1="-8" x2={SCALE_BAR_M * PX_PER_M} y2="8" />
        <text x="0" y="-16" className={styles.dimLabel}>
          {SCALE_BAR_M} M
        </text>
      </g>
    </svg>
  );
}

const STRIP_W = 1000;
const STRIP_H = 150;
const STRIP_MARGIN = 24;

/**
 * A pista inteira em escala física (3.000 m de comprimento × 45 m de largura, mesma
 * escala nos dois eixos) com a distância de decolagem publicada da aeronave.
 */
export function RunwayLength({ spec }: ScaleProps) {
  const usable = STRIP_W - STRIP_MARGIN * 2;
  const pxPerM = usable / RUNWAY_PREMISE.lengthM;
  const runwayH = Math.max(RUNWAY_PREMISE.widthM * pxPerM, 1);
  const y = STRIP_H / 2 - runwayH / 2;
  const share = runwayUse(spec);
  const takeoffW = Math.min(share, 1) * usable;
  return (
    <svg
      className={styles.strip}
      viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
      role="img"
      aria-label={`Pista-premissa de ${RUNWAY_PREMISE.lengthM} m em escala; a decolagem publicada do ${spec.reference} usa ${formatMeters(spec.takeoffM)}, ${Math.round(share * 100)}% do comprimento.`}
    >
      <rect className={styles.runway} x={STRIP_MARGIN} y={y} width={usable} height={runwayH} />
      <rect className={styles.takeoff} x={STRIP_MARGIN} y={y - 6} width={takeoffW} height={runwayH + 12} />
      <line className={styles.takeoffEnd} x1={STRIP_MARGIN + takeoffW} y1={y - 30} x2={STRIP_MARGIN + takeoffW} y2={y + runwayH + 30} />
      <text x={STRIP_MARGIN} y={y - 22} className={styles.dimLabel}>
        0 M
      </text>
      <text x={STRIP_W - STRIP_MARGIN} y={y - 22} className={styles.dimLabelEnd}>
        {RUNWAY_PREMISE.lengthM.toLocaleString("pt-BR")} M
      </text>
      <text x={Math.min(STRIP_MARGIN + takeoffW + 10, STRIP_W - 300)} y={y + runwayH + 44} className={styles.dimValue}>
        {formatMeters(spec.takeoffM)} · {Math.round(share * 100)}%
      </text>
    </svg>
  );
}
