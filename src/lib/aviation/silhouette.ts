/**
 * Silhueta de jato executivo vista de cima, em METROS, gerada a partir da
 * envergadura e do comprimento públicos (`specs.ts`). Só esses dois números são
 * dados; a forma (fuselagem, flecha da asa, empenagem, naceles) é proporcional e
 * genérica, para a comparação de escala ser fiel no que importa: a área ocupada.
 *
 * Eixo x ao longo da fuselagem (nariz em +L/2), eixo y ao longo da asa (pontas em
 * ±envergadura/2). O desenho usa `transform` para pôr na escala do SVG.
 */

import type { AircraftSpec } from "./specs";

interface Point {
  readonly x: number;
  readonly y: number;
}

const WING_SWEEP_DEG = 31;
const TAIL_SWEEP_DEG = 38;
const DEG = Math.PI / 180;

function pathOf(points: readonly Point[]): string {
  return `${points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("")}Z`;
}

/** Espelha um meio-contorno (y >= 0) para fechar a silhueta simétrica. */
function mirrored(half: readonly Point[]): readonly Point[] {
  return [...half, ...[...half].reverse().map((point) => ({ x: point.x, y: -point.y }))];
}

function fuselage(length: number, width: number): string {
  const nose = length / 2;
  const tail = -length / 2;
  const radius = width / 2;
  const half: Point[] = [
    { x: nose, y: 0 },
    { x: nose - length * 0.03, y: radius * 0.55 },
    { x: nose - length * 0.08, y: radius * 0.9 },
    { x: nose - length * 0.14, y: radius },
    { x: tail + length * 0.24, y: radius },
    { x: tail + length * 0.06, y: radius * 0.55 },
    { x: tail, y: radius * 0.2 },
  ];
  return pathOf(mirrored(half));
}

function wing(spec: AircraftSpec, width: number): string {
  const length = spec.lengthM;
  const semiSpan = spec.wingspanM / 2;
  const rootChord = length * 0.24;
  const tipChord = rootChord * 0.32;
  const rootLeading = length / 2 - length * 0.36;
  const reach = semiSpan - width / 2;
  const tipLeading = rootLeading - reach * Math.tan(WING_SWEEP_DEG * DEG);
  const half: Point[] = [
    { x: rootLeading, y: width / 2 },
    { x: tipLeading, y: semiSpan },
    { x: tipLeading - tipChord, y: semiSpan },
    { x: rootLeading - rootChord, y: width / 2 },
  ];
  return [pathOf(half), pathOf(half.map((point) => ({ x: point.x, y: -point.y })))].join("");
}

function tailplane(spec: AircraftSpec, width: number): string {
  const length = spec.lengthM;
  const semiSpan = spec.wingspanM * (spec.tail === "t-tail" ? 0.17 : 0.19);
  const rootChord = length * 0.11;
  const tipChord = rootChord * 0.45;
  const rootLeading = -length / 2 + length * (spec.tail === "t-tail" ? 0.13 : 0.15);
  const reach = semiSpan - width * 0.2;
  const tipLeading = rootLeading - reach * Math.tan(TAIL_SWEEP_DEG * DEG);
  const half: Point[] = [
    { x: rootLeading, y: width * 0.2 },
    { x: tipLeading, y: semiSpan },
    { x: tipLeading - tipChord, y: semiSpan },
    { x: rootLeading - rootChord, y: width * 0.2 },
  ];
  return [pathOf(half), pathOf(half.map((point) => ({ x: point.x, y: -point.y })))].join("");
}

function nacelles(spec: AircraftSpec, width: number): string {
  const length = spec.lengthM;
  const nacelleLength = length * 0.17;
  const nacelleWidth = Math.max(width * 0.55, 1.2);
  const front = -length / 2 + length * 0.36;
  const offset = width / 2 + nacelleWidth * 0.7;
  const pod = (center: number): string =>
    pathOf([
      { x: front, y: center - nacelleWidth / 2 },
      { x: front, y: center + nacelleWidth / 2 },
      { x: front - nacelleLength, y: center + nacelleWidth * 0.38 },
      { x: front - nacelleLength, y: center - nacelleWidth * 0.38 },
    ]);
  const pods = [pod(offset), pod(-offset)];
  // Trijato (Falcon 900/8X): a terceira turbina é central, na cauda; vista de cima, a entrada de ar.
  if (spec.engines === 3) {
    pods.push(pod(0));
  }
  return pods.join("");
}

/** Largura externa aproximada da fuselagem (forma, não dado): cresce com o comprimento. */
export function fuselageWidth(spec: AircraftSpec): number {
  return Math.min(Math.max(spec.lengthM * 0.088, 2.2), 2.9);
}

/** Caminho SVG completo da silhueta em metros. */
export function silhouettePath(spec: AircraftSpec): string {
  const width = fuselageWidth(spec);
  return [wing(spec, width), tailplane(spec, width), nacelles(spec, width), fuselage(spec.lengthM, width)].join("");
}
