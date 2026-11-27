/**
 * Sitemap e robots a partir de uma lista única de rotas indexáveis.
 *
 * A lista é escrita à mão, de propósito: rota só entra no sitemap quando tem conteúdo
 * real (Piso P14). Descobrir rotas automaticamente publicaria página vazia.
 */

import type { MetadataRoute } from "next";
import { isCleanPath } from "./metadata";

export interface IndexableRoute {
  readonly path: string;
  /** Data da última mudança de conteúdo (ISO `AAAA-MM-DD`). Sem data real, deixe de fora. */
  readonly lastModified?: string;
}

/** Prefixos que nunca entram no sitemap, mesmo se alguém os listar por engano. */
export const NON_INDEXABLE_PREFIXES: readonly string[] = ["/demo", "/api", "/obrigado"];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isBlocked(path: string): boolean {
  return NON_INDEXABLE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function assertRoute(route: IndexableRoute, seen: ReadonlySet<string>): void {
  if (!isCleanPath(route.path)) {
    throw new Error(`Sitemap: caminho inválido "${route.path}".`);
  }
  if (isBlocked(route.path)) {
    throw new Error(`Sitemap: "${route.path}" é rota sem indexação (demo, API ou agradecimento) e não pode ser listada.`);
  }
  if (seen.has(route.path)) {
    throw new Error(`Sitemap: rota repetida "${route.path}".`);
  }
  if (route.lastModified !== undefined && !ISO_DATE_PATTERN.test(route.lastModified)) {
    throw new Error(`Sitemap: lastModified de "${route.path}" deve ser AAAA-MM-DD.`);
  }
}

export function buildSitemap(base: string, routes: readonly IndexableRoute[]): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return routes.map((route) => {
    assertRoute(route, seen);
    seen.add(route.path);
    const url = `${base}${route.path}`;
    return route.lastModified === undefined ? { url } : { url, lastModified: route.lastModified };
  });
}

export function buildRobots(base: string): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/demo/", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
