import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/martech/seo/sitemap";
import { siteUrl } from "@/lib/site-url";

/**
 * Página com `noindex` (ex.: /obrigado) não entra em `disallow`: o robô precisa
 * conseguir ler a página para ver a instrução.
 */
export default function robots(): MetadataRoute.Robots {
  return buildRobots(siteUrl());
}
