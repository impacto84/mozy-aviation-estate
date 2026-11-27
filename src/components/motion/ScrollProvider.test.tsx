import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOTION_ERROR_EVENT, useMotionRuntime, useMotionScheduler } from "./MotionContext";
import type { MotionRuntime } from "./MotionContext";
import { browserScheduler, pageScheduler } from "./page-scheduler";
import { ScrollProvider } from "./ScrollProvider";

const runtimeMock = vi.hoisted(() => {
  const scheduler = { request: () => 1, cancel: () => undefined };
  const runtime = { isSmooth: () => true, scrollTo: vi.fn(), stop: vi.fn() };
  return { scheduler, runtime, start: vi.fn(() => runtime) };
});

vi.mock("./scroll-runtime", () => ({
  sharedScheduler: runtimeMock.scheduler,
  startScrollRuntime: runtimeMock.start,
}));

let captured: MotionRuntime | null = null;

function Consumer() {
  const runtime = useMotionRuntime();
  const scheduler = useMotionScheduler();
  useEffect(() => {
    captured = runtime;
  }, [runtime]);
  return <p>{scheduler === pageScheduler ? "relógio da página" : "relógio próprio"}</p>;
}

/** O motor chega por `import()` dentro do efeito: espera a promessa resolver. */
async function engineStarted(): Promise<void> {
  await vi.waitFor(() => expect(runtimeMock.start).toHaveBeenCalled());
}

describe("ScrollProvider", () => {
  afterEach(() => {
    captured = null;
    vi.clearAllMocks();
    runtimeMock.start.mockImplementation(() => runtimeMock.runtime);
  });

  it("renderiza os filhos no servidor sem ligar o motor", () => {
    const html = renderToString(
      <ScrollProvider>
        <p>Conteúdo</p>
      </ScrollProvider>,
    );

    expect(html).toContain("Conteúdo");
    expect(runtimeMock.start).not.toHaveBeenCalled();
  });

  it("carrega o motor depois de montar e desliga ao desmontar", async () => {
    const { unmount } = render(
      <ScrollProvider>
        <Consumer />
      </ScrollProvider>,
    );
    expect(runtimeMock.start).not.toHaveBeenCalled();
    await engineStarted();

    expect(runtimeMock.start).toHaveBeenCalledExactlyOnceWith({ shouldSmoothTouch: false });
    unmount();
    expect(runtimeMock.runtime.stop).toHaveBeenCalledOnce();
  });

  it("passa as cenas para o relógio do motor quando ele chega, e devolve ao desmontar", async () => {
    const use = vi.spyOn(pageScheduler, "use");
    const { unmount } = render(<ScrollProvider>{null}</ScrollProvider>);
    await engineStarted();

    expect(use).toHaveBeenLastCalledWith(runtimeMock.scheduler);
    unmount();
    expect(use).toHaveBeenLastCalledWith(browserScheduler);
    use.mockRestore();
  });

  it("entrega o relógio da página e o scrollTo pelo contexto", async () => {
    render(
      <ScrollProvider>
        <Consumer />
      </ScrollProvider>,
    );
    await engineStarted();

    expect(screen.getByText("relógio da página")).toBeInTheDocument();
    captured?.scrollTo("#alvo", { offset: -40 });
    expect(runtimeMock.runtime.scrollTo).toHaveBeenCalledExactlyOnceWith("#alvo", { offset: -40 });
  });

  it("repassa a opção de suavizar o toque e religa quando ela muda", async () => {
    const { rerender } = render(<ScrollProvider shouldSmoothTouch>{null}</ScrollProvider>);
    await engineStarted();

    rerender(<ScrollProvider>{null}</ScrollProvider>);
    await vi.waitFor(() => expect(runtimeMock.start).toHaveBeenCalledTimes(2));

    expect(runtimeMock.start.mock.calls).toEqual([[{ shouldSmoothTouch: true }], [{ shouldSmoothTouch: false }]]);
    expect(runtimeMock.runtime.stop).toHaveBeenCalledOnce();
  });

  it("não liga o motor se desmontar antes de o chunk chegar", async () => {
    const { unmount } = render(<ScrollProvider>{null}</ScrollProvider>);

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(runtimeMock.start).not.toHaveBeenCalled();
  });

  it("scrollTo antes de o motor chegar ou depois de desmontar não faz nada", async () => {
    const { unmount } = render(
      <ScrollProvider>
        <Consumer />
      </ScrollProvider>,
    );
    const runtime = captured;
    runtime?.scrollTo(0);
    await engineStarted();

    unmount();
    runtime?.scrollTo(0);

    expect(runtimeMock.runtime.scrollTo).not.toHaveBeenCalled();
  });

  it("quando o motor falha, avisa por evento e a página segue no relógio do navegador", async () => {
    const failure = new Error("sem ScrollTrigger");
    runtimeMock.start.mockImplementation(() => {
      throw failure;
    });
    const consoleError = vi.spyOn(console, "error");
    const onError = vi.fn();
    const use = vi.spyOn(pageScheduler, "use");
    document.addEventListener(MOTION_ERROR_EVENT, onError);

    render(<ScrollProvider>{null}</ScrollProvider>);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

    expect((onError.mock.calls[0]?.[0] as CustomEvent<{ error: unknown }>).detail.error).toBe(failure);
    expect(use).toHaveBeenLastCalledWith(browserScheduler);
    expect(consoleError).not.toHaveBeenCalled();
    document.removeEventListener(MOTION_ERROR_EVENT, onError);
    use.mockRestore();
  });

  it("fora do provider não há relógio compartilhado", () => {
    render(<Consumer />);

    expect(screen.getByText("relógio próprio")).toBeInTheDocument();
    expect(captured).toBeNull();
  });
});
