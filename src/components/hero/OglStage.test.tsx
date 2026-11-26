import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionContext } from "@/components/motion/MotionContext";
import type { MotionRuntime } from "@/components/motion/MotionContext";
import { OglStage } from "./OglStage";
import type { HeroSceneLoader, HeroSceneModule } from "./scene-contract";
import { FAKE_TIMER_TARGETS, installHeroTestEnvironment, resetHeroTestEnvironment } from "./test-environment";
import type { CSSProperties } from "react";
import type { HeroTestEnvironment, HeroTestEnvironmentOptions } from "./test-environment";

const PALETTE_STYLE = {
  "--hero-color-base": "#ffffff",
  "--hero-color-soft": "#8080ff",
  "--hero-color-accent": "#0000ff",
  "--hero-color-ink": "#000000",
} as CSSProperties;

function createScene() {
  const scene = { render: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
  const sceneModule: HeroSceneModule = { contextAttributes: {}, createScene: () => scene };
  const loadScene: HeroSceneLoader = () => Promise.resolve(sceneModule);
  return { scene, loadScene };
}

async function activate(environment: HeroTestEnvironment): Promise<void> {
  await act(async () => {
    environment.activate();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function renderStage(loadScene: HeroSceneLoader, options: HeroTestEnvironmentOptions = {}) {
  const environment = installHeroTestEnvironment(options);
  const view = render(
    <div style={PALETTE_STYLE}>
      <OglStage loadScene={loadScene} />
    </div>,
  );
  const stage = (): Element | null => view.container.querySelector("[data-hero-stage]");
  return { environment, view, stage };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: [...FAKE_TIMER_TARGETS] });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    getExtension: () => null,
  } as unknown as RenderingContext);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetHeroTestEnvironment();
});

describe("OglStage", () => {
  it("sob um ScrollProvider, anda no relógio da página em vez de abrir o próprio laço (MOTION-SINGLE-CLOCK)", async () => {
    const { scene, loadScene } = createScene();
    const environment = installHeroTestEnvironment();
    const pending: FrameRequestCallback[] = [];
    const runtime: MotionRuntime = {
      scheduler: { request: (callback) => pending.push(callback), cancel: () => undefined },
      scrollTo: () => undefined,
    };
    render(
      <MotionContext value={runtime}>
        <div style={PALETTE_STYLE}>
          <OglStage loadScene={loadScene} />
        </div>
      </MotionContext>,
    );

    await activate(environment);
    const rendersBefore = scene.render.mock.calls.length;
    act(() => {
      pending.shift()?.(16);
    });

    expect(rendersBefore).toBeGreaterThanOrEqual(1);
    expect(scene.render.mock.calls.length).toBe(rendersBefore + 1);
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it("começa parado no pôster, sem canvas e sem botão", () => {
    const { loadScene } = createScene();

    const { stage } = renderStage(loadScene);

    expect(stage()).toHaveAttribute("data-hero-state", "idle");
    expect(stage()?.querySelector("canvas")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("depois de ativar mostra o canvas, anuncia live e oferece o botão de pausa", async () => {
    const { loadScene } = createScene();
    const { environment, stage } = renderStage(loadScene);

    await activate(environment);

    expect(stage()).toHaveAttribute("data-hero-state", "live");
    expect(stage()?.querySelector("canvas")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Pausar animação de fundo" })).toBeInTheDocument();
  });

  it("o botão pausa o laço de verdade e depois retoma", async () => {
    const { scene, loadScene } = createScene();
    const { environment, stage } = renderStage(loadScene);
    await activate(environment);
    act(() => vi.advanceTimersToNextFrame());

    fireEvent.click(screen.getByRole("button", { name: "Pausar animação de fundo" }));
    const rendersWhenPaused = scene.render.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(scene.render.mock.calls.length).toBe(rendersWhenPaused);
    expect(stage()).toHaveAttribute("data-hero-playing", "false");

    fireEvent.click(screen.getByRole("button", { name: "Retomar animação de fundo" }));
    act(() => vi.advanceTimersToNextFrame());

    expect(scene.render.mock.calls.length).toBeGreaterThan(rendersWhenPaused);
    expect(stage()).toHaveAttribute("data-hero-playing", "true");
  });

  it("com movimento reduzido fica em still, com um frame e sem botão de pausa", async () => {
    const { scene, loadScene } = createScene();
    const { environment, stage } = renderStage(loadScene, { isReducedMotion: true });

    await activate(environment);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(stage()).toHaveAttribute("data-hero-state", "still");
    expect(scene.render).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("com Save-Data fica no pôster e expõe o motivo", async () => {
    const { loadScene } = createScene();
    const { environment, stage } = renderStage(loadScene, { isSaveData: true });

    await activate(environment);

    expect(stage()).toHaveAttribute("data-hero-state", "fallback");
    expect(stage()).toHaveAttribute("data-hero-reason", "save-data");
    expect(stage()?.querySelector("canvas")).toBeNull();
  });

  it("entrega à cena o progresso da fonte externa, quando informada", async () => {
    const { scene, loadScene } = createScene();
    const environment = installHeroTestEnvironment();
    const progress = { current: 0.7 };
    render(
      <div style={PALETTE_STYLE}>
        <OglStage loadScene={loadScene} progress={progress} />
      </div>,
    );

    await activate(environment);

    expect(scene.render.mock.calls[0]?.[0]).toMatchObject({ progress: 0.7 });
  });

  it("desmontar libera a cena e remove o canvas", async () => {
    const { scene, loadScene } = createScene();
    const { environment, view, stage } = renderStage(loadScene);
    await activate(environment);
    const host = stage();

    view.unmount();

    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(host?.querySelector("canvas")).toBeNull();
  });
});
