/**
 * Dados estruturados (JSON-LD) tipados: Organization, WebSite, SoftwareApplication e
 * FAQPage. Cada construtor valida a entrada e devolve um objeto pronto para
 * `<JsonLd data={...} />` (`components/seo/JsonLd.tsx`).
 *
 * Regra da casa (Piso P11): só entra o que o brief sustenta. Nota, número de
 * avaliações e preço não têm valor padrão aqui; sem a fonte, o campo fica de fora.
 * O conteúdo do FAQPage tem de ser o mesmo texto visível na página.
 */

export const SCHEMA_CONTEXT = "https://schema.org";

type JsonLdValue = string | number | boolean | readonly JsonLdValue[] | { readonly [key: string]: JsonLdValue };

export interface JsonLdNode {
  readonly "@context": typeof SCHEMA_CONTEXT;
  readonly "@type": string;
  readonly [key: string]: JsonLdValue;
}

function requireText(value: string, field: string): string {
  const text = value.trim();
  if (text === "") {
    throw new Error(`JSON-LD: "${field}" não pode ficar vazio.`);
  }
  return text;
}

function requireUrl(value: string, field: string): string {
  if (!URL.canParse(value) || !/^https?:$/.test(new URL(value).protocol)) {
    throw new Error(`JSON-LD: "${field}" precisa ser URL absoluta (http ou https); recebido "${value}".`);
  }
  return new URL(value).toString();
}

/** Tira chaves com `undefined`, para o JSON não sair com campo vazio. */
function compact(entries: Readonly<Record<string, JsonLdValue | undefined>>): Record<string, JsonLdValue> {
  const present = Object.entries(entries).filter((entry): entry is [string, JsonLdValue] => entry[1] !== undefined);
  return Object.fromEntries(present);
}

export interface OrganizationInput {
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  /** URL absoluta do logo. Só informe se o arquivo existir. */
  readonly logo?: string;
  /** Perfis oficiais da marca (URLs absolutas). */
  readonly sameAs?: readonly string[];
}

export function organizationJsonLd(input: OrganizationInput): JsonLdNode {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    ...compact({
      name: requireText(input.name, "Organization.name"),
      url: requireUrl(input.url, "Organization.url"),
      description: input.description === undefined ? undefined : requireText(input.description, "Organization.description"),
      logo: input.logo === undefined ? undefined : requireUrl(input.logo, "Organization.logo"),
      sameAs: input.sameAs === undefined ? undefined : input.sameAs.map((profile) => requireUrl(profile, "Organization.sameAs")),
    }),
  };
}

export interface WebSiteInput {
  readonly name: string;
  readonly url: string;
  /** Código de idioma BCP 47, igual ao `lang` do HTML. */
  readonly inLanguage: string;
}

export function webSiteJsonLd(input: WebSiteInput): JsonLdNode {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: requireText(input.name, "WebSite.name"),
    url: requireUrl(input.url, "WebSite.url"),
    inLanguage: requireText(input.inLanguage, "WebSite.inLanguage"),
  };
}

export interface OfferInput {
  /** Preço como texto decimal com ponto (`"0"`, `"49.90"`). */
  readonly price: string;
  /** Código ISO 4217 (`"BRL"`). */
  readonly priceCurrency: string;
}

export interface AggregateRatingInput {
  readonly ratingValue: number;
  readonly ratingCount: number;
  /** De onde vêm a nota e a contagem (campo do brief). Não vai para o JSON; existe para ninguém inventar nota. */
  readonly source: string;
}

export interface SoftwareApplicationInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  /** Categoria do schema.org, ex.: `BusinessApplication`, `DeveloperApplication`. */
  readonly applicationCategory: string;
  readonly operatingSystem?: string;
  readonly offers?: OfferInput;
  readonly aggregateRating?: AggregateRatingInput;
}

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const RATING_MIN = 1;
const RATING_MAX = 5;

function offerNode(offer: OfferInput): JsonLdValue {
  if (!PRICE_PATTERN.test(offer.price) || !CURRENCY_PATTERN.test(offer.priceCurrency)) {
    throw new Error(`JSON-LD: oferta inválida (${offer.price} ${offer.priceCurrency}). Use preço decimal e moeda ISO 4217.`);
  }
  return { "@type": "Offer", price: offer.price, priceCurrency: offer.priceCurrency };
}

function ratingNode(rating: AggregateRatingInput): JsonLdValue {
  requireText(rating.source, "AggregateRating.source");
  const isValueValid = rating.ratingValue >= RATING_MIN && rating.ratingValue <= RATING_MAX;
  if (!isValueValid || !Number.isInteger(rating.ratingCount) || rating.ratingCount < 1) {
    throw new Error("JSON-LD: nota deve ficar entre 1 e 5 e a contagem ser um inteiro positivo.");
  }
  return { "@type": "AggregateRating", ratingValue: rating.ratingValue, ratingCount: rating.ratingCount };
}

export function softwareApplicationJsonLd(input: SoftwareApplicationInput): JsonLdNode {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareApplication",
    ...compact({
      name: requireText(input.name, "SoftwareApplication.name"),
      description: requireText(input.description, "SoftwareApplication.description"),
      url: requireUrl(input.url, "SoftwareApplication.url"),
      applicationCategory: requireText(input.applicationCategory, "SoftwareApplication.applicationCategory"),
      operatingSystem: input.operatingSystem === undefined ? undefined : requireText(input.operatingSystem, "SoftwareApplication.operatingSystem"),
      offers: input.offers === undefined ? undefined : offerNode(input.offers),
      aggregateRating: input.aggregateRating === undefined ? undefined : ratingNode(input.aggregateRating),
    }),
  };
}

export interface FaqEntry {
  readonly question: string;
  /** Texto puro, igual ao que aparece na página. */
  readonly answer: string;
}

export function faqPageJsonLd(entries: readonly FaqEntry[]): JsonLdNode {
  if (entries.length === 0) {
    throw new Error("JSON-LD: FAQPage precisa de pelo menos uma pergunta.");
  }
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: requireText(entry.question, "FAQPage.question"),
      acceptedAnswer: { "@type": "Answer", text: requireText(entry.answer, "FAQPage.answer") },
    })),
  };
}

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const UNSAFE_IN_SCRIPT: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEPARATOR]: "\\u2028",
  [PARAGRAPH_SEPARATOR]: "\\u2029",
};

const UNSAFE_PATTERN = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g");

/**
 * JSON seguro para dentro de `<script type="application/ld+json">`: um `</script>` em
 * texto vindo de CMS não fecha a tag nem injeta marcação.
 */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
  return JSON.stringify(data).replace(UNSAFE_PATTERN, (char) => UNSAFE_IN_SCRIPT[char] ?? char);
}

/* MOZY: organização com endereço e contatos, residência e lugares ----------- */

export interface PostalAddressInput {
  readonly streetAddress?: string;
  readonly addressLocality?: string;
  readonly addressRegion: string;
  readonly addressCountry: string;
}

function postalAddressNode(address: PostalAddressInput): JsonLdValue {
  return {
    "@type": "PostalAddress",
    ...compact({
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: requireText(address.addressRegion, "PostalAddress.addressRegion"),
      addressCountry: requireText(address.addressCountry, "PostalAddress.addressCountry"),
    }),
  };
}

export interface ContactOrganizationInput extends OrganizationInput {
  readonly telephone: string;
  readonly email: string;
  readonly address: PostalAddressInput;
}

/** Organization com contato e endereço: só campos que existem no brief. */
export function contactOrganizationJsonLd(input: ContactOrganizationInput): JsonLdNode {
  const base = organizationJsonLd(input);
  return {
    ...base,
    telephone: requireText(input.telephone, "Organization.telephone"),
    email: requireText(input.email, "Organization.email"),
    address: postalAddressNode(input.address),
  };
}

export interface PlaceInput {
  /** `Place`, `Residence` ou outro subtipo de Place do schema.org. */
  readonly type: "Place" | "Residence";
  readonly name: string;
  readonly description: string;
  readonly url?: string;
  readonly address?: PostalAddressInput;
  /** Região que contém o lugar (ex.: "Central Florida"). */
  readonly containedIn?: string;
  readonly image?: string;
}

export function placeJsonLd(input: PlaceInput): JsonLdNode {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": input.type,
    ...compact({
      name: requireText(input.name, `${input.type}.name`),
      description: requireText(input.description, `${input.type}.description`),
      url: input.url === undefined ? undefined : requireUrl(input.url, `${input.type}.url`),
      image: input.image === undefined ? undefined : requireUrl(input.image, `${input.type}.image`),
      address: input.address === undefined ? undefined : postalAddressNode(input.address),
      containedInPlace: input.containedIn === undefined ? undefined : { "@type": "Place", name: requireText(input.containedIn, "Place.containedIn") },
    }),
  };
}
