/**
 * Modelo do Simulador de Pista & Hangar. Só dados do brief (`site-data.ts`):
 * aeronaves críticas, coleções e infraestrutura. O desenho é esquemático, fora de
 * escala, e diz isso na tela. Funções puras, testadas em `simulator-model.test.ts`.
 */

import type { aircraft} from "@/lib/site-data";
import { tiers } from "@/lib/site-data";

export type AircraftName = (typeof aircraft)[number];
export type TierName = (typeof tiers)[number]["name"];
export type Tier = (typeof tiers)[number];

/** Como cada coleção guarda a aeronave, lido do texto `hangar` do brief. */
export type HangarKind = "multiple" | "private" | "central";

export interface TierRoute {
  readonly kind: HangarKind;
  /** Caminho de táxi no SVG (viewBox 0 0 1000 560): pista → taxiway → hangar. */
  readonly path: string;
  /** Rótulo curto do destino. */
  readonly destination: string;
}

export const TIER_ROUTES: Readonly<Record<TierName, TierRoute>> = {
  "Founder Estates": {
    kind: "multiple",
    path: "M 930 86 L 870 86 L 870 158 L 330 158 L 330 236",
    destination: "Hangar próprio para múltiplas aeronaves",
  },
  "Runway Signature": {
    kind: "private",
    path: "M 930 86 L 870 86 L 870 158 L 700 158 L 700 222",
    destination: "Hangar privativo com taxiway",
  },
  "Reserve Estates": {
    kind: "central",
    path: "M 930 86 L 870 86 L 870 158 L 610 158 L 610 352",
    destination: "Hangar central",
  },
};

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

/** Quantos ícones de aeronave desenhar no hangar da coleção (representação do texto do brief). */
export function hangarIcons(kind: HangarKind): number {
  return kind === "multiple" ? 2 : 1;
}

export function describeSelection(model: AircraftName, tierName: TierName): string {
  const route = TIER_ROUTES[tierName];
  return `${model} taxiando da pista pela taxiway paralela até: ${route.destination} (${tierName}). Esquema conceitual, fora de escala.`;
}

/** Ângulo (graus) de um segmento, com 0 apontando para cima no SVG. */
export function headingDegrees(dx: number, dy: number): number {
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/** Último ponto (x, y) de um caminho `M … L x y` e a direção do último segmento. */
export function routeEnd(path: string): { readonly x: number; readonly y: number; readonly heading: number } {
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = numbers.slice(-4);
  return { x: x1, y: y1, heading: headingDegrees(x1 - x0, y1 - y0) };
}

/** Transformação CSS que põe a aeronave parada no fim do caminho (HTML do servidor). */
export function parkedTransform(path: string): string {
  const end = routeEnd(path);
  return `translate(${end.x}px, ${end.y}px) rotate(${end.heading}deg)`;
}
