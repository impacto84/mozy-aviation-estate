import type { RefObject } from "react";
import styles from "./FleetSimulator.module.css";
import { TIER_ROUTES, hangarIcons, parkedTransform } from "./simulator-model";
import type { TierName } from "./simulator-model";

interface RunwayDiagramProps {
  readonly activeTier: TierName;
  readonly pathRef: RefObject<SVGPathElement | null>;
  readonly planeRef: RefObject<SVGGElement | null>;
  readonly planeLabel: string;
  readonly label: string;
}

/** Silhueta de jato vista de cima, apontando para cima, centrada na origem. */
const JET_PATH =
  "M0 -22 C2 -20 2.6 -15 2.6 -9 L2.6 -4 L20 5 L20 8 L2.6 4 L2.2 13 L7 17 L7 19.5 L0 18 L-7 19.5 L-7 17 L-2.2 13 L-2.6 4 L-20 8 L-20 5 L-2.6 -4 L-2.6 -9 C-2.6 -15 -2 -20 0 -22 Z";

const FOUNDER_LOTS = [0, 1, 2, 3] as const;
const SIGNATURE_LOTS = [0, 1, 2, 3, 4, 5, 6] as const;
const RESERVE_LOTS = [0, 1, 2, 3, 4] as const;

function ZoneLabel({ x, y, title, active }: { readonly x: number; readonly y: number; readonly title: string; readonly active: boolean }) {
  return (
    <text x={x} y={y} className={active ? styles.zoneLabelActive : styles.zoneLabel}>
      {title}
    </text>
  );
}

/**
 * Master plan esquemático (viewBox 1000 × 560): pista, taxiway paralela, terminal,
 * Aviation Club, as três coleções e a área de preservação. Fora de escala.
 */
export function RunwayDiagram({ activeTier, pathRef, planeRef, planeLabel, label }: RunwayDiagramProps) {
  const route = TIER_ROUTES[activeTier];
  const icons = hangarIcons(route.kind);
  return (
    <svg className={styles.diagram} viewBox="0 0 1000 560" role="img" aria-label={label}>
      <rect className={styles.ground} x="0" y="0" width="1000" height="560" rx="16" />
      <g className={styles.preserve}>
        <ellipse cx="110" cy="440" rx="95" ry="80" />
        <text x="40" y="530" className={styles.zoneLabel}>
          Preservação + segurança
        </text>
      </g>

      <rect className={styles.runway} x="50" y="66" width="900" height="40" rx="2" />
      <line className={styles.centerline} x1="80" y1="86" x2="920" y2="86" />
      <text x="60" y="52" className={styles.runwayLabel}>
        RWY · 3.000 × 45 m · premissa inicial
      </text>

      <rect className={styles.taxiway} x="110" y="151" width="790" height="14" rx="7" />
      <rect className={styles.taxiway} x="863" y="100" width="14" height="58" />
      <rect className={styles.taxiway} x="493" y="100" width="14" height="58" />
      <rect className={styles.taxiway} x="123" y="100" width="14" height="58" />
      <text x="150" y="190" className={styles.zoneLabel}>
        Taxiway paralelo
      </text>

      <g>
        <rect className={styles.building} x="40" y="210" width="150" height="70" rx="6" />
        <text x="52" y="250" className={styles.zoneLabel}>
          Terminal + Jet-A
        </text>
      </g>

      <g className={activeTier === "Founder Estates" ? styles.zoneActive : styles.zone}>
        {FOUNDER_LOTS.map((lot) => (
          <rect key={lot} className={styles.lot} x={230 + lot * 62} y="226" width="54" height="74" rx="4" />
        ))}
        <ZoneLabel x={232} y={322} title="Founder Estates · 12" active={activeTier === "Founder Estates"} />
      </g>

      <g className={activeTier === "Runway Signature" ? styles.zoneActive : styles.zone}>
        {SIGNATURE_LOTS.map((lot) => (
          <rect key={lot} className={styles.lot} x={560 + lot * 46} y="214" width="38" height="52" rx="3" />
        ))}
        <ZoneLabel x={560} y={290} title="Runway Signature · 30" active={activeTier === "Runway Signature"} />
      </g>

      <g className={activeTier === "Reserve Estates" ? styles.zoneActive : styles.zone}>
        <rect className={styles.lot} x="580" y="336" width="60" height="34" rx="3" />
        <text x="650" y="358" className={styles.zoneLabel}>
          Hangar central
        </text>
        <ellipse className={styles.lake} cx="790" cy="470" rx="120" ry="44" />
        {RESERVE_LOTS.map((lot) => (
          <rect key={lot} className={styles.lot} x={600 + lot * 58} y="398" width="46" height="34" rx="3" />
        ))}
        <ZoneLabel x={602} y={540} title="Reserve Estates · 18 · lake / green views" active={activeTier === "Reserve Estates"} />
      </g>

      <g>
        <rect className={styles.building} x="270" y="400" width="200" height="80" rx="40" />
        <text x="306" y="446" className={styles.zoneLabel}>
          Aviation Club
        </text>
      </g>

      <path ref={pathRef} className={styles.route} d={route.path} />
      {icons > 1 ? (
        <path className={styles.parked} d={JET_PATH} transform="translate(372 262) rotate(180)" />
      ) : null}
      <g ref={planeRef} className={styles.plane} style={{ transform: parkedTransform(route.path) }}>
        <path d={JET_PATH} />
        <title>{planeLabel}</title>
      </g>
    </svg>
  );
}
