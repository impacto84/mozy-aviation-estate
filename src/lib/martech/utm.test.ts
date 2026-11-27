import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./storage";
import {
  ATTRIBUTION_STORAGE_KEY,
  attributionFields,
  captureAttribution,
  decorateUrl,
  hasAttribution,
  isAttributionKey,
  parseAttribution,
  readStoredAttribution,
  sanitizeAttribution,
} from "./utm";

const CAMPAIGN = "?utm_source=google&utm_medium=cpc&utm_campaign=lancamento&gclid=abc123&fbclid=fb9&ttclid=tt7";
const FORM_OPTIONS = { base: "https://site.example/", allowedHosts: ["forms.example.com"] };

describe("isAttributionKey", () => {
  it.each(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"])(
    "aceita %s",
    (key) => {
      expect(isAttributionKey(key)).toBe(true);
    },
  );

  it.each(["ref", "email", "utm_", "utm source", "UTM_SOURCE", "__proto__", "utm_<script>"])("recusa %s", (key) => {
    expect(isAttributionKey(key)).toBe(false);
  });
});

describe("parseAttribution", () => {
  it("captura utm_* e os click-ids gclid, fbclid e ttclid", () => {
    expect(parseAttribution(CAMPAIGN)).toEqual({
      fbclid: "fb9",
      gclid: "abc123",
      ttclid: "tt7",
      utm_campaign: "lancamento",
      utm_medium: "cpc",
      utm_source: "google",
    });
  });

  it("ignora parâmetros que não são de campanha", () => {
    expect(parseAttribution("?page=2&email=a%40b.com&utm_source=news")).toEqual({ utm_source: "news" });
  });

  it("aceita a chave em maiúsculas e guarda em minúsculas", () => {
    expect(parseAttribution("?UTM_Source=Parceiro")).toEqual({ utm_source: "Parceiro" });
  });

  it("limpa caracteres de controle, espaços nas pontas e corta valor longo", () => {
    const long = "x".repeat(500);

    const parsed = parseAttribution(`?utm_source=%20a%0Ab%09%20&utm_campaign=${long}`);

    expect(parsed.utm_source).toBe("ab");
    expect(parsed.utm_campaign).toHaveLength(200);
  });

  it("descarta valor vazio e fica com a primeira ocorrência de chave repetida", () => {
    expect(parseAttribution("?utm_source=&utm_medium=a&utm_medium=b")).toEqual({ utm_medium: "a" });
  });

  it("aceita URLSearchParams e devolve vazio quando não há campanha", () => {
    expect(parseAttribution(new URLSearchParams("utm_source=x"))).toEqual({ utm_source: "x" });
    expect(hasAttribution(parseAttribution(""))).toBe(false);
  });

  it("limita a quantidade de chaves aceitas", () => {
    const many = Array.from({ length: 40 }, (_, index) => `utm_k${index}=v`).join("&");

    expect(Object.keys(parseAttribution(`?${many}`))).toHaveLength(20);
  });

  it("devolve um objeto congelado", () => {
    expect(Object.isFrozen(sanitizeAttribution([["utm_source", "a"]]))).toBe(true);
  });
});

describe("captureAttribution", () => {
  it("guarda na sessão a campanha da URL de entrada", () => {
    const storage = createMemoryStorage();

    const captured = captureAttribution({ search: CAMPAIGN, storage });

    expect(captured.utm_source).toBe("google");
    expect(JSON.parse(storage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "{}")).toEqual(captured);
  });

  it("mantém a campanha da sessão em navegação interna, sem parâmetros na URL", () => {
    const storage = createMemoryStorage();
    captureAttribution({ search: CAMPAIGN, storage });

    const later = captureAttribution({ search: "", storage });

    expect(later.gclid).toBe("abc123");
    expect(later.utm_campaign).toBe("lancamento");
  });

  it("substitui a campanha inteira quando chega uma nova, sem misturar as duas", () => {
    const storage = createMemoryStorage();
    captureAttribution({ search: CAMPAIGN, storage });

    const replaced = captureAttribution({ search: "?utm_source=newsletter", storage });

    expect(replaced).toEqual({ utm_source: "newsletter" });
    expect(readStoredAttribution(storage)).toEqual({ utm_source: "newsletter" });
  });

  it("devolve a campanha da URL mesmo sem storage disponível", () => {
    expect(captureAttribution({ search: "?gclid=z", storage: null })).toEqual({ gclid: "z" });
  });
});

describe("readStoredAttribution", () => {
  it.each([
    ["JSON corrompido", "{"],
    ["tipo errado", JSON.stringify(["utm_source"])],
    ["valor que não é texto", JSON.stringify({ utm_source: 1 })],
  ])("devolve vazio para %s", (_label, raw) => {
    const storage = createMemoryStorage({ [ATTRIBUTION_STORAGE_KEY]: raw });

    expect(readStoredAttribution(storage)).toEqual({});
  });

  it("filtra de novo o que estava guardado (o storage pode ter sido adulterado)", () => {
    const storage = createMemoryStorage({ [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({ utm_source: "a", email: "x@y.z" }) });

    expect(readStoredAttribution(storage)).toEqual({ utm_source: "a" });
  });
});

describe("decorateUrl", () => {
  const attribution = parseAttribution(CAMPAIGN);

  it("acrescenta a campanha ao link do formulário externo", () => {
    const url = new URL(decorateUrl("https://forms.example.com/demo", attribution, FORM_OPTIONS));

    expect(url.searchParams.get("utm_source")).toBe("google");
    expect(url.searchParams.get("gclid")).toBe("abc123");
    expect(url.searchParams.get("ttclid")).toBe("tt7");
  });

  it("preserva parâmetro e âncora que o link já tinha", () => {
    const url = new URL(decorateUrl("https://forms.example.com/demo?plano=pro&utm_source=fixo#topo", attribution, FORM_OPTIONS));

    expect(url.searchParams.get("plano")).toBe("pro");
    expect(url.searchParams.get("utm_source")).toBe("fixo");
    expect(url.hash).toBe("#topo");
  });

  it("não toca em link para host fora da lista permitida", () => {
    const href = "https://outro.example.org/pagina";

    expect(decorateUrl(href, attribution, FORM_OPTIONS)).toBe(href);
  });

  it("devolve o link intacto quando não há campanha, o href é inválido ou não é http", () => {
    expect(decorateUrl("https://forms.example.com/demo", {}, FORM_OPTIONS)).toBe("https://forms.example.com/demo");
    expect(decorateUrl("https://", attribution, FORM_OPTIONS)).toBe("https://");
    expect(decorateUrl("mailto:oi@forms.example.com", attribution, FORM_OPTIONS)).toBe("mailto:oi@forms.example.com");
  });

  it("resolve link relativo contra a base quando o host da base é permitido", () => {
    const decorated = decorateUrl("/contato", attribution, { base: "https://site.example/", allowedHosts: ["site.example"] });

    expect(decorated.startsWith("https://site.example/contato?")).toBe(true);
  });
});

describe("attributionFields", () => {
  it("devolve um par nome/valor por parâmetro, para os campos ocultos", () => {
    expect(attributionFields({ gclid: "abc", utm_source: "google" })).toEqual([
      { name: "gclid", value: "abc" },
      { name: "utm_source", value: "google" },
    ]);
  });
});
