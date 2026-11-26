import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_URL } from "@/lib/site-url";
import { SCHEMA_CONTEXT, faqPageJsonLd, organizationJsonLd, serializeJsonLd, softwareApplicationJsonLd, webSiteJsonLd } from "./json-ld";
import { DEFAULT_OG_IMAGE_PATH, buildPageMetadata, isCleanPath } from "./metadata";
import { buildRobots, buildSitemap } from "./sitemap";

const BASE = "https://site.example";
const DESCRIPTION = "Descrição própria desta página, escrita para caber entre setenta e cento e sessenta caracteres.";

describe("organizationJsonLd", () => {
  it("monta o mínimo válido: contexto, tipo, nome e URL absoluta", () => {
    expect(organizationJsonLd({ name: "FORJA", url: BASE })).toEqual({
      "@context": SCHEMA_CONTEXT,
      "@type": "Organization",
      name: "FORJA",
      url: `${BASE}/`,
    });
  });

  it("inclui descrição, logo e perfis só quando informados", () => {
    const node = organizationJsonLd({
      name: "FORJA",
      url: BASE,
      description: "Plugin de sites.",
      logo: `${BASE}/logo.png`,
      sameAs: ["https://github.com/exemplo"],
    });

    expect(node).toMatchObject({ description: "Plugin de sites.", logo: `${BASE}/logo.png`, sameAs: ["https://github.com/exemplo"] });
  });

  it("recusa nome vazio e URL relativa ou de outro protocolo", () => {
    expect(() => organizationJsonLd({ name: " ", url: BASE })).toThrow('"Organization.name" não pode ficar vazio');
    expect(() => organizationJsonLd({ name: "FORJA", url: "/sobre" })).toThrow("precisa ser URL absoluta");
    expect(() => organizationJsonLd({ name: "FORJA", url: "javascript:alert(1)" })).toThrow("precisa ser URL absoluta");
  });
});

describe("webSiteJsonLd", () => {
  it("leva nome, URL e idioma", () => {
    expect(webSiteJsonLd({ name: "FORJA", url: BASE, inLanguage: "pt-BR" })).toEqual({
      "@context": SCHEMA_CONTEXT,
      "@type": "WebSite",
      name: "FORJA",
      url: `${BASE}/`,
      inLanguage: "pt-BR",
    });
  });
});

describe("softwareApplicationJsonLd", () => {
  const base = { name: "FORJA", description: "Plugin de sites.", url: BASE, applicationCategory: "DeveloperApplication" };

  it("não inventa oferta nem nota quando o brief não traz", () => {
    const node = softwareApplicationJsonLd(base);

    expect(node["@type"]).toBe("SoftwareApplication");
    expect(node).not.toHaveProperty("offers");
    expect(node).not.toHaveProperty("aggregateRating");
    expect(node).not.toHaveProperty("operatingSystem");
  });

  it("inclui oferta e nota quando informadas, sem levar a fonte para o JSON", () => {
    const node = softwareApplicationJsonLd({
      ...base,
      operatingSystem: "Web",
      offers: { price: "49.90", priceCurrency: "BRL" },
      aggregateRating: { ratingValue: 4.6, ratingCount: 128, source: "brief, seção 4" },
    });

    expect(node.offers).toEqual({ "@type": "Offer", price: "49.90", priceCurrency: "BRL" });
    expect(node.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.6, ratingCount: 128 });
    expect(JSON.stringify(node)).not.toContain("brief");
  });

  it("recusa oferta mal formada e nota sem fonte ou fora da escala", () => {
    expect(() => softwareApplicationJsonLd({ ...base, offers: { price: "R$ 49,90", priceCurrency: "BRL" } })).toThrow("oferta inválida");
    expect(() => softwareApplicationJsonLd({ ...base, offers: { price: "49.90", priceCurrency: "reais" } })).toThrow("oferta inválida");
    expect(() => softwareApplicationJsonLd({ ...base, aggregateRating: { ratingValue: 4.6, ratingCount: 10, source: "" } })).toThrow("AggregateRating.source");
    expect(() => softwareApplicationJsonLd({ ...base, aggregateRating: { ratingValue: 9, ratingCount: 10, source: "brief" } })).toThrow("entre 1 e 5");
    expect(() => softwareApplicationJsonLd({ ...base, aggregateRating: { ratingValue: 4, ratingCount: 0, source: "brief" } })).toThrow("inteiro positivo");
  });
});

describe("faqPageJsonLd", () => {
  it("monta uma Question com Answer por pergunta", () => {
    const node = faqPageJsonLd([{ question: "Precisa de cartão?", answer: "Não." }]);

    expect(node).toEqual({
      "@context": SCHEMA_CONTEXT,
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Precisa de cartão?", acceptedAnswer: { "@type": "Answer", text: "Não." } }],
    });
  });

  it("recusa lista vazia e pergunta ou resposta em branco", () => {
    expect(() => faqPageJsonLd([])).toThrow("pelo menos uma pergunta");
    expect(() => faqPageJsonLd([{ question: "", answer: "x" }])).toThrow("FAQPage.question");
    expect(() => faqPageJsonLd([{ question: "x", answer: " " }])).toThrow("FAQPage.answer");
  });
});

describe("serializeJsonLd", () => {
  it("produz JSON que volta igual depois do parse", () => {
    const node = faqPageJsonLd([{ question: "A & B > C?", answer: "Sim, <b>sempre</b>." }]);

    expect(JSON.parse(serializeJsonLd(node))).toEqual(node);
  });

  it("não deixa texto de CMS fechar a tag script", () => {
    const hostile = `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c</script><script>alert(1)</script>`;
    const serialized = serializeJsonLd(organizationJsonLd({ name: hostile, url: BASE }));

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain(String.fromCharCode(0x2028));
    expect(JSON.parse(serialized).name).toBe(hostile);
  });

  it("aceita uma lista de nós", () => {
    const nodes = [organizationJsonLd({ name: "FORJA", url: BASE }), webSiteJsonLd({ name: "FORJA", url: BASE, inLanguage: "pt-BR" })];

    expect(JSON.parse(serializeJsonLd(nodes))).toHaveLength(2);
  });
});

describe("buildPageMetadata", () => {
  const input = { title: "Peça uma demonstração", description: DESCRIPTION, path: "/demo/lead", siteName: "FORJA" };

  it("gera título, description, canonical absoluto, Open Graph e cartão social", () => {
    const metadata = buildPageMetadata(input, BASE);

    expect(metadata.title).toBe("Peça uma demonstração");
    expect(metadata.description).toBe(DESCRIPTION);
    expect(metadata.alternates).toEqual({ canonical: `${BASE}/demo/lead` });
    expect(metadata.openGraph).toMatchObject({
      url: `${BASE}/demo/lead`,
      locale: "pt_BR",
      siteName: "FORJA",
      images: [{ url: `${BASE}${DEFAULT_OG_IMAGE_PATH}`, width: 1200, height: 630, alt: "Peça uma demonstração" }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [`${BASE}${DEFAULT_OG_IMAGE_PATH}`] });
    expect(metadata.robots).toBeUndefined();
  });

  it("marca noindex quando a página não é indexável", () => {
    expect(buildPageMetadata({ ...input, isIndexable: false }, BASE).robots).toEqual({ index: false, follow: false });
  });

  it("aceita imagem social própria da rota", () => {
    const metadata = buildPageMetadata({ ...input, ogImagePath: "/demo/lead/opengraph-image", ogImageAlt: "Formulário" }, BASE);

    expect(metadata.openGraph?.images).toEqual([{ url: `${BASE}/demo/lead/opengraph-image`, width: 1200, height: 630, alt: "Formulário" }]);
  });

  it("usa a URL do site do ambiente quando a base não é informada", () => {
    // O teste define o ambiente: o resultado não pode depender de quem chamou o vitest (CI, verify, .env do dev).
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ambiente.example");

    const canonical = buildPageMetadata({ ...input, path: "/" }).alternates?.canonical;
    vi.unstubAllEnvs();

    expect(canonical).toBe("https://ambiente.example/");
  });

  it("sem URL no ambiente, cai na origem padrão da fixture", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    const canonical = buildPageMetadata({ ...input, path: "/" }).alternates?.canonical;
    vi.unstubAllEnvs();

    expect(canonical).toBe(`${DEFAULT_SITE_URL}/`);
  });

  it("derruba o build com título vazio, description fora de 70 a 160 ou caminho sujo", () => {
    expect(() => buildPageMetadata({ ...input, title: " " }, BASE)).toThrow("título vazio");
    expect(() => buildPageMetadata({ ...input, description: "Curta." }, BASE)).toThrow("description com 6 caracteres");
    expect(() => buildPageMetadata({ ...input, description: "x".repeat(161) }, BASE)).toThrow("use de 70 a 160");
    expect(() => buildPageMetadata({ ...input, path: "/Página Nova" }, BASE)).toThrow("caminho inválido");
  });
});

describe("isCleanPath", () => {
  it.each(["/", "/precos", "/demo/lead", "/blog/post-1"])("aceita %s", (path) => {
    expect(isCleanPath(path)).toBe(true);
  });

  it.each(["", "precos", "/Precos", "/preços", "/a//b", "/a/", "/a_b", "/a?x=1", "/a."])("recusa %s", (path) => {
    expect(isCleanPath(path)).toBe(false);
  });
});

describe("buildSitemap", () => {
  it("lista só as rotas informadas, com URL absoluta", () => {
    expect(buildSitemap(BASE, [{ path: "/" }, { path: "/precos", lastModified: "2026-11-24" }])).toEqual([
      { url: `${BASE}/` },
      { url: `${BASE}/precos`, lastModified: "2026-11-24" },
    ]);
  });

  it.each(["/demo/lead", "/demo", "/api/lead", "/obrigado"])("recusa %s, que é rota sem indexação", (path) => {
    expect(() => buildSitemap(BASE, [{ path }])).toThrow("rota sem indexação");
  });

  it("recusa caminho sujo, rota repetida e data fora do formato", () => {
    expect(() => buildSitemap(BASE, [{ path: "/Preços" }])).toThrow("caminho inválido");
    expect(() => buildSitemap(BASE, [{ path: "/" }, { path: "/" }])).toThrow("rota repetida");
    expect(() => buildSitemap(BASE, [{ path: "/", lastModified: "24/11/2026" }])).toThrow("AAAA-MM-DD");
  });

  it("não bloqueia rota que só começa parecido com um prefixo reservado", () => {
    expect(buildSitemap(BASE, [{ path: "/demonstracao" }])).toEqual([{ url: `${BASE}/demonstracao` }]);
  });
});

describe("buildRobots", () => {
  it("libera o site, bloqueia demos e API e aponta para o sitemap", () => {
    expect(buildRobots(BASE)).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/demo/", "/api/"] }],
      sitemap: `${BASE}/sitemap.xml`,
    });
  });
});
