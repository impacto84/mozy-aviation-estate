import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, resetBrowserStubs } from "@/components/sim/test-support";
import { joinClassNames } from "./GlassLayers";
import { GlassLens } from "./GlassLens";
import { GlassPanel } from "./GlassPanel";
import { GlassPill } from "./GlassPill";
import { GLASS_IDLE_ATTRIBUTE } from "./glass-visibility";

const LAYERS = ["backdrop", "tint", "sheen", "rim"] as const;
const FILTER_URL = /^url\(#(glass-refraction-[\w-]+)\)$/;

/** Faz o jsdom responder como um Chromium que desenha filtro SVG no backdrop-filter. */
function emulateRefractionSupport(): void {
  vi.stubGlobal("CSS", { supports: () => true });
  Object.defineProperty(window.navigator, "userAgentData", {
    configurable: true,
    value: { brands: [{ brand: "Chromium", version: "140" }] },
  });
}

function backdropOf(surface: HTMLElement): HTMLElement {
  const layer = surface.querySelector<HTMLElement>('[data-glass-layer="backdrop"]');
  if (layer === null) {
    throw new Error("Vidro sem camada de fundo.");
  }
  return layer;
}

function surfaceOf(text: string): HTMLElement {
  const surface = screen.getByText(text).closest<HTMLElement>("[data-glass]");
  if (surface === null) {
    throw new Error(`"${text}" não está dentro de um vidro.`);
  }
  return surface;
}

describe("GlassPanel e GlassPill", () => {
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, "userAgentData");
    resetBrowserStubs();
  });

  describe("HTML do servidor", () => {
    it("sai com o conteúdo, as quatro camadas e sem refração", () => {
      const html = renderToString(<GlassPanel refraction="strong">Conteúdo</GlassPanel>);

      expect(html).toContain("Conteúdo");
      for (const layer of LAYERS) {
        expect(html).toContain(`data-glass-layer="${layer}"`);
      }
      expect(html).toContain('data-glass-refraction="off"');
      expect(html).not.toContain("<filter");
      expect(html).not.toContain(GLASS_IDLE_ATTRIBUTE);
    });

    it("não põe estilo inline: o vidro inteiro vem do CSS Module", () => {
      const html = renderToString(
        <>
          <GlassPanel>Painel</GlassPanel>
          <GlassPill>Pílula</GlassPill>
        </>,
      );

      expect(html).not.toContain("style=");
    });
  });

  describe("camadas", () => {
    it("ficam fora da árvore de acessibilidade, antes do conteúdo e na ordem de pintura", () => {
      render(<GlassPanel>Conteúdo</GlassPanel>);
      const surface = surfaceOf("Conteúdo");

      const children = [...surface.children];
      const layers = children.slice(0, LAYERS.length);

      expect(layers.map((layer) => layer.getAttribute("data-glass-layer"))).toEqual([...LAYERS]);
      expect(layers.every((layer) => layer.getAttribute("aria-hidden") === "true")).toBe(true);
      expect(children.at(-1)).toHaveTextContent("Conteúdo");
      expect(children.at(-1)).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("refração", () => {
    it("fica desligada onde o navegador não a desenha", () => {
      render(<GlassPanel refraction="strong">Conteúdo</GlassPanel>);
      const backdrop = backdropOf(surfaceOf("Conteúdo"));

      expect(backdrop).toHaveAttribute("data-glass-refraction", "off");
      expect(backdrop.querySelector("filter")).toBeNull();
      expect(backdrop.style.getPropertyValue("--glass-refraction-filter")).toBe("");
    });

    it("liga onde há suporte, apontando para o filtro da própria instância", () => {
      emulateRefractionSupport();
      render(<GlassPanel>Conteúdo</GlassPanel>);
      const backdrop = backdropOf(surfaceOf("Conteúdo"));

      const reference = FILTER_URL.exec(backdrop.style.getPropertyValue("--glass-refraction-filter"));

      expect(backdrop).toHaveAttribute("data-glass-refraction", "on");
      expect(reference).not.toBeNull();
      expect(backdrop.querySelector("filter")?.id).toBe(reference?.[1]);
    });

    it("três instâncias têm três ids de filtro diferentes", () => {
      emulateRefractionSupport();
      render(
        <>
          <GlassPanel>Um</GlassPanel>
          <GlassPanel refraction="strong">Dois</GlassPanel>
          <GlassPill refraction="soft">Três</GlassPill>
        </>,
      );

      const ids = [...document.querySelectorAll("filter")].map((filter) => filter.id);

      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      for (const id of ids) {
        expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
      }
    });

    it("não cria filtro com refraction none, nem na pílula por padrão", () => {
      emulateRefractionSupport();
      render(
        <>
          <GlassPanel refraction="none">Painel</GlassPanel>
          <GlassPill>Pílula</GlassPill>
        </>,
      );

      expect(document.querySelector("filter")).toBeNull();
      expect(backdropOf(surfaceOf("Painel"))).toHaveAttribute("data-glass-refraction", "off");
    });

    it("escreve só números nos atributos do filtro", () => {
      emulateRefractionSupport();
      render(<GlassPanel refraction="strong">Conteúdo</GlassPanel>);

      const values = [...document.querySelectorAll("filter *")].flatMap((node) =>
        ["baseFrequency", "numOctaves", "seed", "stdDeviation", "scale"].flatMap((name) => node.getAttribute(name) ?? []),
      );

      expect(values.length).toBeGreaterThanOrEqual(5);
      expect(values.join(" ")).not.toMatch(/NaN|undefined|Infinity/);
      expect(document.querySelector("filter")).toHaveAttribute("color-interpolation-filters", "sRGB");
    });
  });

  describe("fora da viewport", () => {
    it("marca a camada de fundo como ociosa e desmarca quando volta", () => {
      const stubs = installBrowserStubs();
      render(<GlassPanel>Conteúdo</GlassPanel>);
      const backdrop = backdropOf(surfaceOf("Conteúdo"));
      expect(backdrop).not.toHaveAttribute(GLASS_IDLE_ATTRIBUTE);

      stubs.leaveView();
      expect(backdrop).toHaveAttribute(GLASS_IDLE_ATTRIBUTE, "true");

      stubs.enterView();
      expect(backdrop).not.toHaveAttribute(GLASS_IDLE_ATTRIBUTE);
    });

    it("desmontar desconecta o observer", () => {
      const stubs = installBrowserStubs();
      const { unmount } = render(<GlassPanel>Conteúdo</GlassPanel>);
      expect(stubs.activeCounts().intersection).toBe(1);

      unmount();

      expect(stubs.activeCounts().intersection).toBe(0);
    });
  });

  describe("GlassPanel", () => {
    it("usa div, tom automático e refração suave por padrão", () => {
      render(<GlassPanel>Conteúdo</GlassPanel>);
      const surface = surfaceOf("Conteúdo");

      expect(surface.tagName).toBe("DIV");
      expect(surface).toHaveAttribute("data-glass", "panel");
      expect(surface).toHaveAttribute("data-glass-tone", "auto");
      expect(surface).toHaveClass("surface", "panel");
    });

    it("aceita outro elemento, tom, classe e atributos de HTML", () => {
      render(
        <GlassPanel as="section" tone="dark" className="extra" id="precos" aria-labelledby="titulo">
          <h2 id="titulo">Preços</h2>
        </GlassPanel>,
      );
      const surface = screen.getByRole("region", { name: "Preços" });

      expect(surface.tagName).toBe("SECTION");
      expect(surface).toHaveAttribute("id", "precos");
      expect(surface).toHaveAttribute("data-glass-tone", "dark");
      expect(surface).toHaveClass("surface", "panel", "extra");
    });
  });

  describe("GlassPill", () => {
    it("sem href é um rótulo, não um controle", () => {
      render(<GlassPill tone="light">Novo</GlassPill>);
      const surface = surfaceOf("Novo");

      expect(surface.tagName).toBe("SPAN");
      expect(surface).toHaveAttribute("data-glass", "pill");
      expect(surface).toHaveAttribute("data-glass-tone", "light");
      expect(surface).not.toHaveClass("interactive");
      expect(screen.queryByRole("link")).toBeNull();
    });

    it("com href é um link com o texto como nome acessível", () => {
      render(
        <GlassPill href="/demo/glass" className="extra">
          Ver a receita
        </GlassPill>,
      );
      const link = screen.getByRole("link", { name: "Ver a receita" });

      expect(link).toHaveAttribute("href", "/demo/glass");
      expect(link).toHaveAttribute("data-glass", "pill");
      expect(link).toHaveClass("surface", "pill", "interactive", "extra");
    });
  });
});

describe("GlassLens", () => {
  afterEach(() => {
    resetBrowserStubs();
  });

  it("é decorativa: fica fora da árvore de acessibilidade e não tem conteúdo", () => {
    const { container } = render(<GlassLens className="tamanho" />);
    const lens = container.querySelector<HTMLElement>('[data-glass="lens"]');

    expect(lens).toHaveAttribute("aria-hidden", "true");
    expect(lens).toHaveClass("surface", "lens", "tamanho");
    expect(lens?.textContent).toBe("");
    expect(lens?.querySelectorAll("[data-glass-layer]")).toHaveLength(LAYERS.length);
  });

  it("não tem a camada de conteúdo, então não há onde pôr texto", () => {
    const { container } = render(<GlassLens tone="dark" />);
    const lens = container.querySelector<HTMLElement>('[data-glass="lens"]');

    expect(lens?.children).toHaveLength(LAYERS.length);
    expect(lens).toHaveAttribute("data-glass-tone", "dark");
  });
});

describe("joinClassNames", () => {
  it("junta os nomes presentes e ignora os ausentes", () => {
    expect(joinClassNames("a", undefined, "b", "")).toBe("a b");
    expect(joinClassNames(undefined)).toBe("");
  });
});
