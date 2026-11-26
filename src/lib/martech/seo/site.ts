/**
 * Identidade do site usada por metadata, JSON-LD e sitemap.
 * Um lugar só: nome de marca grafado de duas formas é defeito (GATES `COPY-CONSISTENCY`).
 */

import type { IndexableRoute } from "./sitemap";

export const SITE_NAME = "MOZY Private Aviation Estate";
export const SITE_LANGUAGE = "pt-BR";
export const SITE_DESCRIPTION =
  "Comunidade residencial privada de aviação executiva na Central Florida: 60 residências com hangar, taxiway privativa e pista de 3.000 m.";
export const ORGANIZATION_NAME = "MOZY CONSTRUCTION INC.";

/** Página de conversão (formulário do Data Room). */
export const ACCESS_PATH = "/solicitar-acesso";

/** Rotas com conteúdo real, na ordem do sitemap (Piso P14). */
export const INDEXABLE_ROUTES: readonly IndexableRoute[] = [
  { path: "/" },
  { path: "/aviacao" },
  { path: "/terrenos" },
  { path: "/tese-capital" },
  { path: ACCESS_PATH },
];
