import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneFrame } from "./scene-contract";
import { createStageRuntime } from "./stage-runtime";
import { HERO_FALLBACK_EVENT } from "./status";
import type { HeroStatus } from "./status";
import { FAKE_TIMER_TARGETS, installHeroTestEnvironment, resetHeroTestEnvironment } from "./test-environment";
import type { HeroTestEnvironmentOptions } from "./test-environment";

function setup(options: HeroTestEnvironmentOptions = {}) {
  const environment = installHeroTestEnvironment(options);
  const host = document.createElement("div");
  document.body.append(host);
  const statuses: HeroStatus[] = [];
  const runtime = createStageRuntime(host, { onStatus: (status) => statuses.push(status) });
  const activate = async (): Promise<boolean> => {
    environment.activate();
    return runtime.whenActive;
  };
  return { environment, host, statuses, runtime, activate };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: [...FAKE_TIMER_TARGETS] });
});

afterEach(() => {
  vi.useRealTimers();
  resetHeroTestEnvironment();
});

describe("createStageRuntime", () => {
  it("não emite nada de forma síncrona (o pôster do servidor continua valendo)", () => {
    const { statuses } = setup();

    expect(statuses).toEqual([]);
  });

  it("passa para loading quando o hero pode começar", async () => {
    const { statuses, activate } = setup();

    const isActive = await activate();

    expect(isActive).toBe(true);
    expect(statuses).toEqual([{ phase: "loading", reason: null }]);
  });

  it("fica no pôster com Save-Data ligado e não ativa a cena", async () => {
    const { statuses, activate } = setup({ isSaveData: true });

    const isActive = await activate();

    expect(isActive).toBe(false);
    expect(statuses).toEqual([{ phase: "fallback", reason: "save-data" }]);
  });

  it("attach desenha o primeiro frame antes de anunciar live, e liga o laço", async () => {
    const { statuses, runtime, activate } = setup();
    await activate();
    const order: string[] = [];
    const render = vi.fn(() => order.push(`frame:${statuses.at(-1)?.phase ?? "nenhum"}`));

    runtime.attach(render);
    vi.advanceTimersToNextFrame();

    expect(order[0]).toBe("frame:loading");
    expect(statuses.at(-1)).toEqual({ phase: "live", reason: null });
    expect(render.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("com um relógio externo, o laço só anda quando esse relógio chama (MOTION-SINGLE-CLOCK)", () => {
    const environment = installHeroTestEnvironment();
    const host = document.createElement("div");
    document.body.append(host);
    const pending: FrameRequestCallback[] = [];
    const scheduler = { request: (callback: FrameRequestCallback) => pending.push(callback), cancel: () => undefined };
    const runtime = createStageRuntime(host, { onStatus: () => undefined, scheduler });
    const render = vi.fn();
    environment.enterView();

    runtime.attach(render);
    const rendersAfterAttach = render.mock.calls.length;
    vi.advanceTimersByTime(200);
    const rendersWithoutSchedulerTick = render.mock.calls.length;
    pending.shift()?.(16);
    pending.shift()?.(32);

    expect(rendersAfterAttach).toBe(1);
    expect(rendersWithoutSchedulerTick).toBe(1);
    expect(render.mock.calls.length).toBe(3);
    runtime.dispose();
  });

  it("entrega a cada frame o progresso da fonte externa", async () => {
    installHeroTestEnvironment();
    const host = document.createElement("div");
    document.body.append(host);
    const progress = { current: 0.4 };
    const runtime = createStageRuntime(host, { onStatus: () => undefined, progress });
    const frames: SceneFrame[] = [];

    runtime.attach((frame) => frames.push(frame));
    progress.current = 0.9;
    runtime.redraw();

    expect(frames.map((frame) => frame.progress)).toEqual([0.4, 0.9]);
    expect(runtime.progress).toBe(progress);
  });

  it("com movimento reduzido desenha um frame parado e não liga o laço (MOTION-REDUCED)", async () => {
    const { statuses, runtime, activate } = setup({ isReducedMotion: true });
    await activate();
    const render = vi.fn();

    runtime.attach(render);
    vi.advanceTimersByTime(500);

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0]?.[0]).toMatchObject({ delta: 0 });
    expect(statuses.at(-1)).toEqual({ phase: "still", reason: null });
  });

  it("troca entre live e still quando a preferência muda com a cena no ar", async () => {
    const { environment, statuses, runtime, activate } = setup();
    await activate();
    runtime.attach(() => undefined);

    environment.setReducedMotion(true);
    const afterReduce = statuses.at(-1);
    environment.setReducedMotion(false);

    expect(afterReduce).toEqual({ phase: "still", reason: null });
    expect(statuses.at(-1)).toEqual({ phase: "live", reason: null });
  });

  it("setPlaying(false) para de desenhar e setPlaying(true) retoma", async () => {
    const { runtime, activate } = setup();
    await activate();
    const render = vi.fn();
    runtime.attach(render);
    vi.advanceTimersToNextFrame();

    runtime.setPlaying(false);
    const callsWhilePaused = render.mock.calls.length;
    vi.advanceTimersByTime(300);
    const callsAfterPause = render.mock.calls.length;
    runtime.setPlaying(true);
    vi.advanceTimersToNextFrame();

    expect(callsAfterPause).toBe(callsWhilePaused);
    expect(render.mock.calls.length).toBeGreaterThan(callsAfterPause);
  });

  it("suspend (contexto perdido) volta ao pôster e para o laço; attach retoma", async () => {
    const { statuses, runtime, activate } = setup();
    await activate();
    const render = vi.fn();
    runtime.attach(render);

    runtime.suspend();
    const callsAfterSuspend = render.mock.calls.length;
    vi.advanceTimersByTime(300);
    runtime.redraw();

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "context-lost" });
    expect(render.mock.calls.length).toBe(callsAfterSuspend);

    runtime.attach(render);

    expect(statuses.at(-1)).toEqual({ phase: "live", reason: null });
  });

  it("erro no primeiro frame vira fallback scene-error, sem anunciar live", async () => {
    const { host, statuses, runtime, activate } = setup();
    await activate();
    const failure = new Error("uniform inválido");
    const onFallback = vi.fn();
    host.addEventListener(HERO_FALLBACK_EVENT, onFallback);

    runtime.attach(() => {
      throw failure;
    });

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "scene-error" });
    expect(statuses.some((status) => status.phase === "live")).toBe(false);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect((onFallback.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ reason: "scene-error", error: failure });
  });

  it("fail é definitivo: attach depois dele não reativa a cena", async () => {
    const { statuses, runtime, activate } = setup();
    await activate();

    runtime.fail("no-webgl2", null);
    runtime.attach(() => undefined);

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "no-webgl2" });
  });

  it("dispose silencia o runtime e cancela a ativação pendente", async () => {
    const { statuses, runtime, activate } = setup();

    runtime.dispose();
    const isActive = await activate();
    runtime.attach(() => undefined);
    runtime.fail("scene-error", null);

    expect(isActive).toBe(false);
    expect(statuses).toEqual([]);
  });
});
