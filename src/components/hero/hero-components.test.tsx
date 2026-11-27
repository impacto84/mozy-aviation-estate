import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HeroErrorBoundary } from "./HeroErrorBoundary";
import { HeroMotionToggle } from "./HeroMotionToggle";
import { HeroPoster } from "./HeroPoster";
import { HeroShell } from "./HeroShell";
import { RunwayHero } from "./RunwayHero";
import { ShaderHero } from "./ShaderHero";
import { StageFrame } from "./StageFrame";
import type { HeroStatus } from "./status";

const SHELL_PROPS = {
  variant: "bands",
  title: "Título do hero",
  lead: "Texto de apoio do hero.",
  primaryCta: { label: "Começar", href: "#inicio" },
} as const;

describe("HeroShell", () => {
  it("renderiza exatamente um h1 que dá nome à seção (SEO-H1-ONE)", () => {
    render(<HeroShell {...SHELL_PROPS} />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Título do hero" })).toBeInTheDocument();
  });

  it("mostra o CTA primário como link real e o secundário só quando informado", () => {
    const { rerender } = render(<HeroShell {...SHELL_PROPS} />);
    expect(screen.getByRole("link", { name: "Começar" })).toHaveAttribute("href", "#inicio");
    expect(screen.getAllByRole("link")).toHaveLength(1);

    rerender(<HeroShell {...SHELL_PROPS} secondaryCta={{ label: "Saber mais", href: "/demo/hero-r3f" }} />);

    expect(screen.getByRole("link", { name: "Saber mais" })).toHaveAttribute("href", "/demo/hero-r3f");
  });

  it("mostra o eyebrow só quando informado", () => {
    const { rerender } = render(<HeroShell {...SHELL_PROPS} />);
    expect(screen.queryByText("Receita")).not.toBeInTheDocument();

    rerender(<HeroShell {...SHELL_PROPS} eyebrow="Receita" />);

    expect(screen.getByText("Receita")).toBeInTheDocument();
  });

  it("põe o pôster antes do conteúdo e o palco depois, para o CTA vir antes do botão de pausa no foco", () => {
    const { container } = render(
      <HeroShell {...SHELL_PROPS}>
        <div data-testid="palco" />
      </HeroShell>,
    );
    const section = container.querySelector("section");
    const order = [...(section?.children ?? [])].map((child) =>
      child.hasAttribute("data-hero-poster") ? "poster" : child.hasAttribute("data-testid") ? "palco" : "conteudo",
    );

    expect(order).toEqual(["poster", "conteudo", "palco"]);
  });
});

describe("HTML do servidor (GL-FALLBACK)", () => {
  const cases = [
    { name: "ShaderHero", variant: "bands", stage: <ShaderHero /> },
    { name: "RunwayHero", variant: "bands", stage: <RunwayHero /> },
  ] as const;

  for (const { name, variant, stage } of cases) {
    it(`${name}: sai com pôster, texto e palco parado, sem nenhum canvas`, () => {
      const html = renderToString(
        <HeroShell {...SHELL_PROPS} variant={variant}>
          {stage}
        </HeroShell>,
      );

      expect(html).toContain(`data-hero-poster="${variant}"`);
      expect(html).toContain("Título do hero");
      expect(html).toContain('data-hero-state="idle"');
      expect(html).not.toContain("<canvas");
      expect(html).not.toContain("data-hero-toggle");
    });
  }
});

describe("HeroPoster", () => {
  it("é decorativo e identifica a variante", () => {
    const { container } = render(<HeroPoster variant="field" />);
    const poster = container.querySelector("[data-hero-poster]");

    expect(poster).toHaveAttribute("data-hero-poster", "field");
    expect(poster).toHaveAttribute("aria-hidden", "true");
    expect(poster).toHaveClass("poster", "field");
    expect(container.querySelector("img")).toBeNull();
  });

  it("com imagem, entrega a candidata a LCP com prioridade alta, dimensões e sem lazy", () => {
    const { container } = render(
      <HeroPoster variant="orbit" image={{ src: "/hero/poster.png", width: 1600, height: 900 }} />,
    );
    const image = container.querySelector("img");

    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("width", "1600");
    expect(image).toHaveAttribute("height", "900");
    expect(image).not.toHaveAttribute("loading", "lazy");
  });
});

describe("HeroMotionToggle (MOTION-PAUSE-CONTROL)", () => {
  it("oferece pausar enquanto a animação roda e retomar quando está pausada", () => {
    const { rerender } = render(<HeroMotionToggle isPlaying onToggle={() => undefined} />);
    expect(screen.getByRole("button", { name: "Pausar animação de fundo" })).toBeInTheDocument();

    rerender(<HeroMotionToggle isPlaying={false} onToggle={() => undefined} />);

    expect(screen.getByRole("button", { name: "Retomar animação de fundo" })).toBeInTheDocument();
  });

  it("chama onToggle no clique e não usa aria-pressed", () => {
    const onToggle = vi.fn();
    render(<HeroMotionToggle isPlaying onToggle={onToggle} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveAttribute("aria-pressed");
    expect(button).toHaveAttribute("type", "button");
  });
});

describe("StageFrame", () => {
  function renderFrame(status: HeroStatus, isPlaying = true) {
    return render(
      <StageFrame hostRef={{ current: null }} status={status} isPlaying={isPlaying} onTogglePlaying={() => undefined} />,
    );
  }

  it("expõe fase, motivo e reprodução em data attributes e esconde o palco de leitores de tela", () => {
    const { container } = renderFrame({ phase: "fallback", reason: "no-webgl2" }, false);
    const stage = container.querySelector("[data-hero-stage]");

    expect(stage).toHaveAttribute("data-hero-state", "fallback");
    expect(stage).toHaveAttribute("data-hero-reason", "no-webgl2");
    expect(stage).toHaveAttribute("data-hero-playing", "false");
    expect(stage).toHaveAttribute("aria-hidden", "true");
  });

  it("não escreve data-hero-reason quando não há motivo", () => {
    const { container } = renderFrame({ phase: "live", reason: null });

    expect(container.querySelector("[data-hero-stage]")).not.toHaveAttribute("data-hero-reason");
  });

  it("mostra o botão de pausa só com a animação no ar", () => {
    const phases: readonly HeroStatus["phase"][] = ["idle", "loading", "still", "fallback"];
    for (const phase of phases) {
      const { unmount } = renderFrame({ phase, reason: null });
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      unmount();
    }

    renderFrame({ phase: "live", reason: null });

    expect(screen.getByRole("button", { name: "Pausar animação de fundo" })).toBeInTheDocument();
  });
});

describe("HeroErrorBoundary", () => {
  function Broken(): never {
    throw new Error("cena quebrou");
  }

  it("avisa o erro e não renderiza a cena quebrada", () => {
    const onError = vi.fn();
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { container } = render(
      <HeroErrorBoundary onError={onError}>
        <Broken />
      </HeroErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(container).toBeEmptyDOMElement();
    silence.mockRestore();
  });

  it("renderiza os filhos quando não há erro", () => {
    render(
      <HeroErrorBoundary onError={() => undefined}>
        <p>cena</p>
      </HeroErrorBoundary>,
    );

    expect(screen.getByText("cena")).toBeInTheDocument();
  });
});
