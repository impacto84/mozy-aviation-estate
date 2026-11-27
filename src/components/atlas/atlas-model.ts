/**
 * Modelo do Atlas por satélite. Só dados de `site-data.ts` (lands): imagens reais
 * (`public/media/sat/*`, `listing-*.jpg`) e as coordenadas dos marcadores (ox/oy)
 * na carta regional, que também são a origem do fly-to (`transform-origin`).
 */

import { lands } from "@/lib/site-data";

export type Land = (typeof lands)[number];
export type LandId = Land["id"];
export type DetailView = "wide" | "close" | "photo";

export const DETAIL_VIEWS: readonly { readonly id: DetailView; readonly label: string }[] = [
  { id: "wide", label: "Satélite amplo" },
  { id: "close", label: "Satélite próximo" },
  { id: "photo", label: "Foto do anúncio" },
];

/** Zoom da carta regional no fly-to (a câmera mergulha até o marcador). */
export const FLY_TO_SCALE = 4.4;

export interface AtlasImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export const OVERVIEW: AtlasImage = {
  src: "/media/sat/overview-marked.jpg",
  width: 1920,
  height: 1400,
  alt: "Satélite real da Flórida Central com os três terrenos candidatos marcados",
};

const SITE_IMAGE_SIZE = { width: 1600, height: 900 } as const;
const PHOTO_SIZES: Readonly<Record<LandId, { readonly width: number; readonly height: number }>> = {
  honey: { width: 1600, height: 900 },
  peace: { width: 1600, height: 900 },
  osceola: { width: 1428, height: 1116 },
};

export function findLand(id: LandId): Land {
  const land = lands.find((entry) => entry.id === id);
  if (land === undefined) {
    throw new Error(`Terreno desconhecido: ${id}`);
  }
  return land;
}

/** Imagem de detalhe real para o terreno e a vista escolhidos. */
export function detailImage(land: Land, view: DetailView): AtlasImage {
  if (view === "wide") {
    return { src: land.satWide, ...SITE_IMAGE_SIZE, alt: `Satélite amplo de ${land.name}` };
  }
  if (view === "close") {
    return { src: land.sat, ...SITE_IMAGE_SIZE, alt: `Satélite aproximado de ${land.name}` };
  }
  return { src: land.photo, ...PHOTO_SIZES[land.id], alt: `Foto do anúncio de ${land.name}` };
}

/** Converte "75.1%" em número (75.1). Valor inválido vira 50 (centro). */
export function percentValue(raw: string): number {
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 50;
}

/** `transform-origin` do fly-to: o marcador do terreno na carta regional. */
export function flyToOrigin(land: Land): string {
  return `${percentValue(land.ox)}% ${percentValue(land.oy)}%`;
}
