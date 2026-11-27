import type { CSSProperties } from "react";
import { LANDMASSES, densify } from "@/lib/aviation/continents";
import { ORIGIN, meridian, parallel, projectAzimuthal, projectedPath } from "@/lib/aviation/geo";
import { REACH_LABEL, hubReach } from "@/lib/aviation/range";
import { NM_TO_KM, formatNm } from "@/lib/aviation/specs";
import type { AircraftSpec } from "@/lib/aviation/specs";
import styles from "./FleetSimulator.module.css";

/** Raio do disco do mapa em unidades do SVG e a distância que ele representa. */
const DISC_RADIUS = 480;
const DISC_KM = 13_500;
const KM_PER_UNIT = DISC_KM / DISC_RADIUS;
const RING_STEP_NM = 2000;
const GRATICULE_STEP_DEG = 30;
/** Rótulos dos anéis a sudoeste (Pacífico), longe dos polos e das rotas. */
const RING_LABEL_COS = Math.SQRT1_2;

/** Deslocamento dos rótulos (unidades do SVG) para os polos vizinhos não colidirem. */
const LABEL_OFFSET: Readonly<Record<string, { readonly dx: number; readonly dy: number; readonly anchor: "start" | "end" }>> = {
  "new-york": { dx: 16, dy: 34, anchor: "start" },
  "los-angeles": { dx: -14, dy: -10, anchor: "end" },
  "sao-paulo": { dx: 14, dy: 22, anchor: "start" },
  london: { dx: -14, dy: -30, anchor: "end" },
  geneva: { dx: 14, dy: 24, anchor: "start" },
  dubai: { dx: -14, dy: 26, anchor: "end" },
  tokyo: { dx: 14, dy: -12, anchor: "start" },
};

const LAND_PATHS = LANDMASSES.map((ring) => projectedPath(densify(ring), ORIGIN, KM_PER_UNIT, true));
const GRATICULE_PATHS = [
  ...[-60, -30, 0, 30, 60].map((lat) => projectedPath(densify(parallel(lat)), ORIGIN, KM_PER_UNIT, false)),
  ...Array.from({ length: 360 / GRATICULE_STEP_DEG }, (_, index) => -180 + index * GRATICULE_STEP_DEG).map((lon) =>
    projectedPath(densify(meridian(lon)), ORIGIN, KM_PER_UNIT, false),
  ),
];
const DISTANCE_RINGS = Array.from({ length: 3 }, (_, index) => (index + 1) * RING_STEP_NM);

function radiusForNm(nm: number): number {
  return (nm * NM_TO_KM) / KM_PER_UNIT;
}

interface RangeMapProps {
  readonly spec: AircraftSpec;
}

/**
 * Mapa hemisférico de alcance a partir de Orlando (MCO): projeção azimutal
 * equidistante (a distância ao centro é verdadeira), contornos continentais
 * simplificados, anel do alcance nominal da aeronave e as rotas ortodrômicas até
 * sete polos, marcadas dentro / no limite / fora do raio sem escala.
 */
export function RangeMap({ spec }: RangeMapProps) {
  const reach = hubReach(spec);
  const rangeRadius = Math.min(radiusForNm(spec.rangeNm), DISC_RADIUS);
  return (
    <svg
      className={styles.map}
      viewBox={`${-DISC_RADIUS - 20} ${-DISC_RADIUS - 20} ${DISC_RADIUS * 2 + 40} ${DISC_RADIUS * 2 + 40}`}
      role="img"
      aria-label={`Alcance nominal do ${spec.reference} a partir de Orlando: ${formatNm(spec.rangeNm)}. ${reach.map((entry) => `${entry.hub.city} ${formatNm(entry.distanceNm)}: ${REACH_LABEL[entry.status]}`).join("; ")}.`}
    >
      <defs>
        <clipPath id="range-disc">
          <circle cx="0" cy="0" r={DISC_RADIUS} />
        </clipPath>
      </defs>
      <circle className={styles.ocean} cx="0" cy="0" r={DISC_RADIUS} />
      <g clipPath="url(#range-disc)">
        {GRATICULE_PATHS.map((d) => (
          <path key={d} className={styles.graticule} d={d} />
        ))}
        {LAND_PATHS.map((d) => (
          <path key={d} className={styles.land} d={d} />
        ))}
        {DISTANCE_RINGS.map((nm) => (
          <circle key={nm} className={styles.distanceRing} cx="0" cy="0" r={radiusForNm(nm)} />
        ))}
        <circle className={styles.rangeFill} cx="0" cy="0" r="1" style={{ transform: `scale(${rangeRadius})` } as CSSProperties} />
      </g>
      <circle className={styles.rangeRing} cx="0" cy="0" r={rangeRadius} vectorEffect="non-scaling-stroke" />
      {/* Rótulos dos anéis fora do recorte do disco, a sudoeste (Pacífico), sempre inteiros. */}
      {DISTANCE_RINGS.map((nm) => (
        <text key={nm} className={styles.ringLabel} x={-radiusForNm(nm) * RING_LABEL_COS + 8} y={radiusForNm(nm) * RING_LABEL_COS + 8} textAnchor="start">
          {formatNm(nm).toUpperCase()}
        </text>
      ))}
      <circle className={styles.discEdge} cx="0" cy="0" r={DISC_RADIUS} />

      {reach.map((entry) => {
        const point = projectAzimuthal(entry.hub, ORIGIN, KM_PER_UNIT);
        const offset = LABEL_OFFSET[entry.hub.id] ?? { dx: 12, dy: -10, anchor: "start" as const };
        return (
          <g key={entry.hub.id} className={styles.hub} data-reach={entry.status}>
            <line className={styles.route} x1="0" y1="0" x2={point.x} y2={point.y} />
            <circle className={styles.hubDot} cx={point.x} cy={point.y} r="7" />
            <text className={styles.hubLabel} x={point.x + offset.dx} y={point.y + offset.dy} textAnchor={offset.anchor}>
              {entry.hub.city}
            </text>
            <text className={styles.hubMeta} x={point.x + offset.dx} y={point.y + offset.dy + 24} textAnchor={offset.anchor}>
              {entry.hub.iata} · {formatNm(entry.distanceNm)}
            </text>
          </g>
        );
      })}

      <circle className={styles.origin} cx="0" cy="0" r="9" />
      <text className={styles.hubLabel} x="-16" y="34" textAnchor="end">
        Orlando · MCO
      </text>
    </svg>
  );
}
