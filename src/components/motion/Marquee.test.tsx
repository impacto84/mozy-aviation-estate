import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, resetBrowserStubs } from "@/components/sim/test-support";
import { Marquee, MarqueeItem } from "./Marquee";
import { MARQUEE_DURATION_PROPERTY, MARQUEE_IDLE_ATTRIBUTE } from "./marquee-runtime";
import { PLACEHOLDER_LOGOS, PlaceholderLogoView } from "./PlaceholderLogos";

function renderMarquee(speed?: number) {
  return render(
    <Marquee label="Marcas de exemplo" speed={speed}>
      {PLACEHOLDER_LOGOS.map((logo) => (
        <MarqueeItem key={logo.name}>
          <PlaceholderLogoView logo={logo} />
        </MarqueeItem>
      ))}
    </Marquee>,
  );
}

const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

describe("Marquee", () => {
  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = nativeGetBoundingClientRect;
    resetBrowserStubs();
    vi.restoreAllMocks();
  });

  it("mostra a lista uma vez para leitor de tela; a cópia é aria-hidden e inert", () => {
    installBrowserStubs();
    renderMarquee();
    const group = screen.getByRole("group", { name: "Marcas de exemplo" });
    const lists = group.querySelectorAll("ul");

    expect(within(group).getAllByRole("list")).toHaveLength(1);
    expect(within(group).getAllByRole("listitem")).toHaveLength(PLACEHOLDER_LOGOS.length);
    expect(lists).toHaveLength(2);
    expect(lists[1]).toHaveAttribute("aria-hidden", "true");
    expect(lists[1]).toHaveAttribute("inert");
    expect(lists[1]?.children).toHaveLength(PLACEHOLDER_LOGOS.length);
  });

  it("tem botão de pausa que alterna o rótulo e o estado, sem aria-pressed", async () => {
    installBrowserStubs();
    const user = userEvent.setup();
    renderMarquee();
    const group = screen.getByRole("group");
    const button = screen.getByRole("button", { name: "Pausar faixa" });

    expect(group).toHaveAttribute("data-forja-autoplay");
    expect(button).toHaveAttribute("data-forja-pause");
    expect(group).toHaveAttribute("data-marquee-paused", "false");
    await user.click(button);

    expect(group).toHaveAttribute("data-marquee-paused", "true");
    expect(screen.getByRole("button", { name: "Retomar faixa" })).not.toHaveAttribute("aria-pressed");
  });

  it("fica parado fora da viewport e volta quando entra", () => {
    const stubs = installBrowserStubs();
    renderMarquee();
    const group = screen.getByRole("group");

    expect(group).toHaveAttribute(MARQUEE_IDLE_ATTRIBUTE, "true");
    act(() => stubs.enterView());
    expect(group).toHaveAttribute(MARQUEE_IDLE_ATTRIBUTE, "false");
    act(() => stubs.leaveView());
    expect(group).toHaveAttribute(MARQUEE_IDLE_ATTRIBUTE, "true");
  });

  it("fica parado com a aba oculta", () => {
    const stubs = installBrowserStubs();
    renderMarquee();
    act(() => stubs.enterView());

    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByRole("group")).toHaveAttribute(MARQUEE_IDLE_ATTRIBUTE, "true");
  });

  it("calcula a duração a partir da largura medida e da velocidade", () => {
    const stubs = installBrowserStubs();
    HTMLElement.prototype.getBoundingClientRect = () => ({ width: 1200 }) as DOMRect;
    renderMarquee(40);
    const group = screen.getByRole("group");

    expect(group.style.getPropertyValue(MARQUEE_DURATION_PROPERTY)).toBe("30.00s");
    HTMLElement.prototype.getBoundingClientRect = () => ({ width: 600 }) as DOMRect;
    act(() => stubs.triggerResize());

    expect(group.style.getPropertyValue(MARQUEE_DURATION_PROPERTY)).toBe("15.00s");
  });

  it("deixa a duração padrão do CSS enquanto não há largura medida", () => {
    installBrowserStubs();
    renderMarquee();

    expect(screen.getByRole("group").style.getPropertyValue(MARQUEE_DURATION_PROPERTY)).toBe("");
  });

  it("desmontar desconecta observers e tira os ouvintes", () => {
    const stubs = installBrowserStubs();
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderMarquee();

    unmount();

    const countOf = (calls: readonly (readonly unknown[])[]): number => calls.filter(([type]) => type === "visibilitychange").length;
    expect(stubs.activeCounts()).toEqual({ intersection: 0, resize: 0, media: 0 });
    expect(countOf(addListener.mock.calls)).toBe(1);
    expect(countOf(removeListener.mock.calls)).toBe(1);
  });

  it("funciona sem ResizeObserver", () => {
    installBrowserStubs();
    vi.stubGlobal("ResizeObserver", undefined);

    expect(() => renderMarquee().unmount()).not.toThrow();
  });
});

describe("logos de exemplo", () => {
  it("têm nome em texto e desenho decorativo", () => {
    render(<PlaceholderLogoView logo={PLACEHOLDER_LOGOS[0] ?? { name: "", mark: null }} />);

    expect(screen.getByText("Orbe")).toBeInTheDocument();
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("não repetem nome", () => {
    const names = PLACEHOLDER_LOGOS.map((logo) => logo.name);

    expect(new Set(names).size).toBe(names.length);
  });
});
