/**
 * Geodésia do mapa de alcance: distância ortodrômica e projeção azimutal
 * equidistante centrada em Orlando (MCO). Nesta projeção a distância ao centro é
 * verdadeira em qualquer direção: o anel de alcance de uma aeronave é um círculo
 * exato e a rota ortodrômica a partir de MCO é uma reta radial.
 *
 * Coordenadas dos aeroportos: posições públicas (IATA), arredondadas a 0,01°.
 */

export interface LatLon {
  readonly lat: number;
  readonly lon: number;
}

export interface Hub extends LatLon {
  readonly id: string;
  readonly city: string;
  readonly iata: string;
}

export const EARTH_RADIUS_KM = 6371;
const DEG = Math.PI / 180;

export const ORIGIN: Hub = { id: "orlando", city: "Orlando", iata: "MCO", lat: 28.43, lon: -81.31 };

export const HUBS: readonly Hub[] = [
  { id: "new-york", city: "Nova York", iata: "JFK", lat: 40.64, lon: -73.78 },
  { id: "los-angeles", city: "Los Angeles", iata: "LAX", lat: 33.94, lon: -118.41 },
  { id: "sao-paulo", city: "São Paulo", iata: "GRU", lat: -23.43, lon: -46.47 },
  { id: "london", city: "Londres", iata: "LHR", lat: 51.47, lon: -0.45 },
  { id: "geneva", city: "Genebra", iata: "GVA", lat: 46.24, lon: 6.11 },
  { id: "dubai", city: "Dubai", iata: "DXB", lat: 25.25, lon: 55.36 },
  { id: "tokyo", city: "Tóquio", iata: "HND", lat: 35.55, lon: 139.78 },
];

/** Ângulo central (rad) entre dois pontos (fórmula de haversine). */
export function centralAngle(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distância ortodrômica em km. */
export function greatCircleKm(a: LatLon, b: LatLon): number {
  return centralAngle(a, b) * EARTH_RADIUS_KM;
}

/** Azimute inicial (rad, 0 = norte, sentido horário) de `a` para `b`. */
export function initialBearing(a: LatLon, b: LatLon): number {
  const phi1 = a.lat * DEG;
  const phi2 = b.lat * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return Math.atan2(y, x);
}

export interface PlanePoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Projeção azimutal equidistante: `kmPerUnit` km por unidade do SVG; norte para
 * cima no centro. Devolve coordenadas relativas ao centro (0, 0).
 */
export function projectAzimuthal(point: LatLon, center: LatLon, kmPerUnit: number): PlanePoint {
  const distance = greatCircleKm(center, point) / kmPerUnit;
  if (distance === 0) {
    return { x: 0, y: 0 };
  }
  const bearing = initialBearing(center, point);
  return { x: distance * Math.sin(bearing), y: -distance * Math.cos(bearing) };
}

/** `d` de um caminho SVG para uma lista de pontos [lat, lon] projetados. */
export function projectedPath(points: readonly (readonly [number, number])[], center: LatLon, kmPerUnit: number, isClosed: boolean): string {
  const commands = points.map(([lat, lon], index) => {
    const { x, y } = projectAzimuthal({ lat, lon }, center, kmPerUnit);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${commands.join("")}${isClosed ? "Z" : ""}`;
}

/** Paralelo (latitude fixa) amostrado de -180 a 180. */
export function parallel(lat: number, stepDeg: number = 4): readonly (readonly [number, number])[] {
  const points: (readonly [number, number])[] = [];
  for (let lon = -180; lon <= 180; lon += stepDeg) {
    points.push([lat, lon]);
  }
  return points;
}

/** Meridiano (longitude fixa) amostrado de -80 a 80 de latitude. */
export function meridian(lon: number, stepDeg: number = 4): readonly (readonly [number, number])[] {
  const points: (readonly [number, number])[] = [];
  for (let lat = -80; lat <= 80; lat += stepDeg) {
    points.push([lat, lon]);
  }
  return points;
}
