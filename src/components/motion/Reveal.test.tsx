import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { installBrowserStubs, resetBrowserStubs } from "@/components/sim/test-support";
import { REVEAL_STATE_ATTRIBUTE } from "@/lib/motion/reveal";
import { Reveal } from "./Reveal";
import { ScrubReveal } from "./ScrubReveal";

const BELOW_THE_FOLD = 2000;

function placeAllElementsAt(top: number): void {
  HTMLElement.prototype.getBoundingClientRect = () => ({ top }) as DOMRect;
}

const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

describe("Reveal", () => {
  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = nativeGetBoundingClientRect;
    resetBrowserStubs();
  });

  it("sai do servidor visível, sem estado de reveal", () => {
    const html = renderToString(<Reveal>Conteúdo</Reveal>);

    expect(html).toContain("Conteúdo");
    expect(html).not.toContain(REVEAL_STATE_ATTRIBUTE);
  });

  it("esconde só depois de montar, e só o que está abaixo da dobra", () => {
    installBrowserStubs();
    placeAllElementsAt(BELOW_THE_FOLD);

    render(<Reveal>Abaixo</Reveal>);

    expect(screen.getByText("Abaixo")).toHaveAttribute(REVEAL_STATE_ATTRIBUTE, "pending");
  });

  it("revela quando entra na tela", () => {
    const stubs = installBrowserStubs();
    placeAllElementsAt(BELOW_THE_FOLD);
    render(<Reveal>Abaixo</Reveal>);

    stubs.enterView();

    expect(screen.getByText("Abaixo")).toHaveAttribute(REVEAL_STATE_ATTRIBUTE, "in");
  });

  it("não esconde o que já está na primeira dobra", () => {
    installBrowserStubs();
    placeAllElementsAt(100);

    render(<Reveal>Topo</Reveal>);

    expect(screen.getByText("Topo")).not.toHaveAttribute(REVEAL_STATE_ATTRIBUTE);
  });

  it("não esconde nada com movimento reduzido", () => {
    installBrowserStubs({ isReducedMotion: true });
    placeAllElementsAt(BELOW_THE_FOLD);

    render(<Reveal>Abaixo</Reveal>);

    expect(screen.getByText("Abaixo")).not.toHaveAttribute(REVEAL_STATE_ATTRIBUTE);
  });

  it("desmontar desconecta o observer", () => {
    const stubs = installBrowserStubs();
    placeAllElementsAt(BELOW_THE_FOLD);
    const { unmount } = render(<Reveal>Abaixo</Reveal>);
    expect(stubs.activeCounts().intersection).toBe(1);

    unmount();

    expect(stubs.activeCounts().intersection).toBe(0);
  });

  it("aceita outro elemento, variante, posição e classe", () => {
    installBrowserStubs();
    render(
      <ul>
        <Reveal as="li" variant="scale" index={2} className="extra">
          Item
        </Reveal>
      </ul>,
    );
    const item = screen.getByRole("listitem");

    expect(item).toHaveAttribute("data-reveal", "scale");
    expect(item).toHaveClass("reveal", "extra");
    expect(item.style.getPropertyValue("--reveal-index")).toBe("2");
  });
});

describe("ScrubReveal", () => {
  it("é só uma classe de CSS em volta do conteúdo", () => {
    const html = renderToString(<ScrubReveal className="painel">Bloco</ScrubReveal>);

    expect(html).toBe('<div class="scrub painel">Bloco</div>');
  });
});
