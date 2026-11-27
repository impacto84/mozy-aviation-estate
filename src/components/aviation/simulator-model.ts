/**
 * Modelo do console aeronáutico: coleções residenciais (dados do brief em
 * `site-data.ts`) cruzadas com a aeronave crítica escolhida. Funções puras,
 * testadas em `simulator-model.test.ts`.
 */

import { tiers } from "@/lib/site-data";

export type { AircraftName } from "@/lib/aviation/specs";
export type TierName = (typeof tiers)[number]["name"];
export type Tier = (typeof tiers)[number];

export const TOTAL_UNITS = tiers.reduce((sum, tier) => sum + tier.count, 0);

export function findTier(name: TierName): Tier {
  const tier = tiers.find((entry) => entry.name === name);
  if (tier === undefined) {
    throw new Error(`Coleção desconhecida: ${name}`);
  }
  return tier;
}

/** Fração da coleção no total de residências (0 a 1). */
export function unitShare(tier: Tier): number {
  return TOTAL_UNITS === 0 ? 0 : tier.count / TOTAL_UNITS;
}

/** Percentual inteiro para exibição ("60%"). */
export function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
