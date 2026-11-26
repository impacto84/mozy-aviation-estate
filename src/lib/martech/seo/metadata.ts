/**
 * Metadata por página: título e description próprios, canonical absoluto, Open Graph
 * e cartão social, com as regras do gate conferidas na hora do build.
 *
 * Por que uma função: no Next, `openGraph` definido na página substitui o do layout
 * inteiro (a mesclagem é rasa). Montar tudo aqui evita página sem `og:image`.
 */

import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";

export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
/** Imagem social estática (`public/og.jpg`, 1200 × 630). */
export const DEFAULT_OG_IMAGE_PATH = "/og.jpg";

const PATH_PATTERN = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;

export interface PageMetadataInput {
  /** Título da página, sem o nome do site (o layout acrescenta pelo `title.template`). */
  readonly title: string;
  /** Entre 70 e 160 caracteres, própria da página. */
  readonly description: string;
  /** Caminho da rota, começando por `/`, só com `a-z0-9-`. */
  readonly path: string;
  readonly siteName: string;
  /** `false` para demo, agradecimento e landing duplicada: `noindex` e fora do sitemap. */
  readonly isIndexable?: boolean;
  /** Imagem social própria da rota; por padrão, a do site. */
  readonly ogImagePath?: string;
  readonly ogImageAlt?: string;
}

/** Caminho válido para rota pública: começa por `/` e usa só `a-z0-9-` (GATES `SEO-SLUG-CLEAN`). */
export function isCleanPath(path: string): boolean {
  return PATH_PATTERN.test(path);
}

function assertValid(input: PageMetadataInput): void {
  const length = input.description.trim().length;
  if (input.title.trim() === "") {
    throw new Error(`Metadata de ${input.path}: título vazio.`);
  }
  if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
    throw new Error(`Metadata de ${input.path}: description com ${length} caracteres; use de ${DESCRIPTION_MIN} a ${DESCRIPTION_MAX}.`);
  }
  if (!isCleanPath(input.path)) {
    throw new Error(`Metadata: caminho inválido "${input.path}". Use "/" e segmentos em a-z0-9-.`);
  }
}

export function buildPageMetadata(input: PageMetadataInput, base: string = siteUrl()): Metadata {
  assertValid(input);
  const url = `${base}${input.path}`;
  const isIndexable = input.isIndexable ?? true;
  const image = {
    url: `${base}${input.ogImagePath ?? DEFAULT_OG_IMAGE_PATH}`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: input.ogImageAlt ?? input.title,
  };
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      url,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image.url] },
    ...(isIndexable ? {} : { robots: { index: false, follow: false } }),
  };
}
