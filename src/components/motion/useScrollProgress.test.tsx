import { act, render } from "@testing-library/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, resetBrowserStubs } from "@/components/sim/test-support";
import { useScrollProgress } from "./useScrollProgress";
import type { ScrollProgress } from "./useScrollProgress";

let progress: ScrollProgress | null = null;

function Rail() {
  const ref = useRef<HTMLDivElement>(null);
  const current = useScrollProgress(ref, { cssVariable: "--rail" });
  useEffect(() => {
    progress = current;
  }, [current]);
  return <div ref={ref} data-testid="rail" />;
}

/** O ScrollTrigger reposiciona a rolagem ao reverter um matchMedia; o jsdom não implementa `scrollTo`. */
function installStubs(options?: Parameters<typeof installBrowserStubs>[0]) {
  const stubs = installBrowserStubs(options);
  vi.stubGlobal("scrollTo", vi.fn());
  return stubs;
}

/** O GSAP chega por `import()` dentro do efeito: espera o trigger existir. */
async function triggerCreated(): Promise<void> {
  await vi.waitFor(() => expect(ScrollTrigger.getAll()).toHaveLength(1));
}

/** Tempo para um `import()` já em cache resolver e o efeito rodar. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

describe("useScrollProgress", () => {
  afterEach(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    resetBrowserStubs();
    progress = null;
  });

  it("cria um trigger com movimento permitido e o remove ao desmontar", async () => {
    installStubs();

    const { unmount } = render(<Rail />);
    await triggerCreated();
    unmount();

    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });

  it("escreve o progresso na custom property e no objeto estável, sem estado do React", async () => {
    installStubs();
    const { getByTestId, unmount } = render(<Rail />);
    const rail = getByTestId("rail");
    await triggerCreated();
    const [trigger] = ScrollTrigger.getAll();
    const onUpdate = trigger?.vars.onUpdate;

    act(() => {
      onUpdate?.({ progress: 0.4567891 } as ScrollTrigger);
    });

    expect(rail.style.getPropertyValue("--rail")).toBe("0.4568");
    expect(progress?.current).toBeCloseTo(0.4567891);
    unmount();
    expect(rail.style.getPropertyValue("--rail")).toBe("");
  });

  it("não cria trigger com movimento reduzido: o CSS fica no estado final", async () => {
    installStubs({ isReducedMotion: true });

    const { getByTestId } = render(<Rail />);
    await settle();

    expect(ScrollTrigger.getAll()).toHaveLength(0);
    expect(getByTestId("rail").style.getPropertyValue("--rail")).toBe("");
    expect(progress?.current).toBe(0);
  });

  it("não cria trigger se desmontar antes de o GSAP chegar", async () => {
    installStubs();

    render(<Rail />).unmount();
    await settle();

    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });

  it("remove o trigger quando a preferência muda para movimento reduzido", async () => {
    const stubs = installStubs();
    render(<Rail />);
    await triggerCreated();

    act(() => stubs.setReducedMotion(true));

    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });
});
