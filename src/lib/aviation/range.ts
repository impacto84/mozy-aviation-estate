/**
 * Alcance sem escala a partir de Orlando: classifica cada polo pelo alcance
 * nominal publicado da aeronave. Margem de 10%: abaixo de 90% do nominal é "sem
 * escala"; entre 90% e 100%, "no limite nominal" (depende de vento, carga e
 * reservas); acima, "fora do alcance nominal".
 */

import { HUBS, ORIGIN, greatCircleKm } from "./geo";
import type { Hub } from "./geo";
import { NM_TO_KM } from "./specs";
import type { AircraftSpec } from "./specs";

export type ReachStatus = "nonstop" | "limit" | "out";

export const LIMIT_SHARE = 0.9;

export interface HubReach {
  readonly hub: Hub;
  readonly distanceKm: number;
  readonly distanceNm: number;
  /** Distância / alcance nominal. */
  readonly share: number;
  readonly status: ReachStatus;
}

export function reachStatus(share: number): ReachStatus {
  if (share <= LIMIT_SHARE) {
    return "nonstop";
  }
  return share <= 1 ? "limit" : "out";
}

export function hubReach(spec: AircraftSpec, hubs: readonly Hub[] = HUBS): readonly HubReach[] {
  return hubs.map((hub) => {
    const distanceKm = greatCircleKm(ORIGIN, hub);
    const distanceNm = distanceKm / NM_TO_KM;
    const share = distanceNm / spec.rangeNm;
    return { hub, distanceKm, distanceNm, share, status: reachStatus(share) };
  });
}

export const REACH_LABEL: Readonly<Record<ReachStatus, string>> = {
  nonstop: "Sem escala",
  limit: "No limite nominal",
  out: "Fora do alcance nominal",
};
