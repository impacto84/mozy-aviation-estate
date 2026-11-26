/**
 * Especificações públicas das aeronaves de referência (fichas dos fabricantes:
 * Gulfstream, Bombardier e Dassault), arredondadas. São dados da AERONAVE, não do
 * empreendimento: a pista do projeto continua sendo a premissa inicial de
 * 3.000 × 45 m, sujeita a estudo e aprovação (FAA/FDOT). Alcance nominal = alcance
 * publicado pelo fabricante (NBAA IFR, carga de referência), sem vento nem reservas
 * operacionais adicionais. Distância de decolagem = peso máximo, nível do mar, ISA.
 *
 * A entrada do brief (`site-data.ts · aircraft`) é a chave; `reference` diz qual
 * modelo da família fornece os números (o mais exigente quando a família tem dois).
 */

import type { aircraft } from "@/lib/site-data";

export type AircraftName = (typeof aircraft)[number];

export type TailLayout = "t-tail" | "cruciform";

export interface AircraftSpec {
  readonly name: AircraftName;
  /** Modelo da família cujos números públicos são exibidos. */
  readonly reference: string;
  readonly wingspanM: number;
  readonly lengthM: number;
  /** Alcance nominal publicado (milhas náuticas). */
  readonly rangeNm: number;
  /** Distância de decolagem publicada (m, MTOW, nível do mar, ISA). */
  readonly takeoffM: number;
  readonly engines: 2 | 3;
  readonly tail: TailLayout;
}

export const RUNWAY_PREMISE = { lengthM: 3000, widthM: 45 } as const;
export const NM_TO_KM = 1.852;

export const AIRCRAFT_SPECS: readonly AircraftSpec[] = [
  { name: "G450 / G550", reference: "Gulfstream G550", wingspanM: 28.5, lengthM: 29.4, rangeNm: 6750, takeoffM: 1801, engines: 2, tail: "t-tail" },
  { name: "Global 6000", reference: "Bombardier Global 6000", wingspanM: 28.7, lengthM: 30.3, rangeNm: 6000, takeoffM: 1974, engines: 2, tail: "t-tail" },
  { name: "Global 7000 / 7500", reference: "Bombardier Global 7500", wingspanM: 31.7, lengthM: 33.8, rangeNm: 7700, takeoffM: 1768, engines: 2, tail: "t-tail" },
  { name: "Falcon 2000", reference: "Dassault Falcon 2000LXS", wingspanM: 21.4, lengthM: 20.2, rangeNm: 4000, takeoffM: 1425, engines: 2, tail: "cruciform" },
  { name: "Falcon 8X", reference: "Dassault Falcon 8X", wingspanM: 26.3, lengthM: 24.5, rangeNm: 6450, takeoffM: 1792, engines: 3, tail: "cruciform" },
  { name: "Falcon 900XP", reference: "Dassault Falcon 900LX", wingspanM: 21.4, lengthM: 20.2, rangeNm: 4750, takeoffM: 1634, engines: 3, tail: "cruciform" },
];

export function findAircraft(name: AircraftName): AircraftSpec {
  const spec = AIRCRAFT_SPECS.find((entry) => entry.name === name);
  if (spec === undefined) {
    throw new Error(`Aeronave sem especificação: ${name}`);
  }
  return spec;
}

export function nmToKm(nm: number): number {
  return nm * NM_TO_KM;
}

/** Fração da pista-premissa usada pela distância de decolagem publicada (0..1+). */
export function runwayUse(spec: AircraftSpec, runwayM: number = RUNWAY_PREMISE.lengthM): number {
  return runwayM <= 0 ? 0 : spec.takeoffM / runwayM;
}

/** Folga lateral (m) entre a ponta da asa e a borda da pista, por lado, com a aeronave no eixo. */
export function lateralClearance(spec: AircraftSpec, runwayWidthM: number = RUNWAY_PREMISE.widthM): number {
  return (runwayWidthM - spec.wingspanM) / 2;
}

const PT_BR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const PT_BR_INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** "28,5 m" */
export function formatMeters(value: number): string {
  return `${PT_BR.format(value)} m`;
}

/** "6.750 nm" */
export function formatNm(value: number): string {
  return `${PT_BR_INT.format(value)} nm`;
}

/** "12.501 km" */
export function formatKm(value: number): string {
  return `${PT_BR_INT.format(value)} km`;
}
