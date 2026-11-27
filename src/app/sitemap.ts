import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/martech/seo/sitemap";
import { INDEXABLE_ROUTES } from "@/lib/martech/seo/site";
import { siteUrl } from "@/lib/site-url";

/**
 * Só entram rotas com conteúdo real (GATES: SEO-SITEMAP-REAL). A lista mora em
 * `lib/martech/seo/site.ts`; páginas de demo ficam fora e levam `noindex`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(siteUrl(), INDEXABLE_ROUTES);
}
