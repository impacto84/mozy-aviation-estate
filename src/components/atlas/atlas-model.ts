/**
 * Modelo do Atlas Satelital. Só dados de `site-data.ts` (lands): imagens reais
 * (`public/media/sat/*`, `listing-*.jpg`) e as coordenadas dos marcadores (ox/oy).
 */

import { lands } from "@/lib/site-data";

export type Land = (typeof lands)[number];
export type LandId = Land["id"];
export type AtlasView = "regional" | "zoom" | "photo";

export const ATLAS_VIEWS: readonly { readonly id: AtlasView; readonly label: string }[] = [
  { id: "regional", label: "Satélite regional" },
  { id: "zoom", label: "Satélite zoom" },
  { id: "photo", label: "Foto local" },
];

export interface AtlasImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

const OVERVIEW: AtlasImage = {
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

/** Imagem real para o terreno e a vista escolhidos. */
export function atlasImage(land: Land, view: AtlasView): AtlasImage {
  if (view === "regional") {
    return OVERVIEW;
  }
  if (view === "zoom") {
    return { src: land.sat, ...SITE_IMAGE_SIZE, alt: `Satélite aproximado de ${land.name}` };
  }
  return { src: land.photo, ...PHOTO_SIZES[land.id], alt: `Foto do anúncio de ${land.name}` };
}

/** Converte "75.1%" em número (75.1). Valor inválido vira 50 (centro). */
export function percentValue(raw: string): number {
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 50;
}
