import { serializeJsonLd } from "@/lib/martech/seo/json-ld";
import type { JsonLdNode } from "@/lib/martech/seo/json-ld";

interface JsonLdProps {
  readonly data: JsonLdNode | readonly JsonLdNode[];
}

/**
 * Dado estruturado no HTML do servidor. `<script>` nativo, não `next/script`: é dado,
 * não código. O texto passa por `serializeJsonLd`, que neutraliza `<`, `>` e `&`.
 */
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
