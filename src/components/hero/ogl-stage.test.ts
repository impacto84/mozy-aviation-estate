import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountOglStage } from "./ogl-stage";
import type { HeroSceneInit, HeroSceneModule } from "./scene-contract";
import type { HeroStatus } from "./status";
import {
  FAKE_TIMER_TARGETS,
  createStageHost,
  installHeroTestEnvironment,
  resetHeroTestEnvironment,
} from "./test-environment";

function createFakeGl() {
  const loseContext = vi.fn();
  return { gl: { getExtension: () => ({ loseContext }) }, loseContext };
}

function createFakeModule() {
  const scene = { render: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
  const createScene = vi.fn((init: HeroSceneInit) => {
    void init;
    return scene;
  });
  const sceneModule: HeroSceneModule = { contextAttributes: { alpha: true }, createScene };
  return { scene, createScene, sceneModule };
}

function stubCanvasContext(context: unknown) {
  return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as RenderingContext | null);
}

async function mountAndActivate(sceneModule: HeroSceneModule, host = createStageHost()) {
  const environment = installHeroTestEnvironment();
  const statuses: HeroStatus[] = [];
  const handle = mountOglStage(host, {
    loadScene: () => Promise.resolve(sceneModule),
    onStatus: (status) => statuses.push(status),
  });
  environment.activate();
  await vi.waitFor(() => expect(statuses.length).toBeGreaterThanOrEqual(2));
  return { environment, host, statuses, handle };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: [...FAKE_TIMER_TARGETS] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetHeroTestEnvironment();
});

describe("mountOglStage", () => {
  it("não cria canvas nem emite status de forma síncrona", () => {
    installHeroTestEnvironment();
    const { sceneModule } = createFakeModule();
    const host = createStageHost();
    const onStatus = vi.fn();

    const handle = mountOglStage(host, { loadScene: () => Promise.resolve(sceneModule), onStatus });

    expect(host.querySelector("canvas")).toBeNull();
    expect(onStatus).not.toHaveBeenCalled();
    handle.dispose();
  });

  it("cria o canvas, pede WebGL2 com os atributos da cena e vai para live", async () => {
    const { gl } = createFakeGl();
    const getContext = stubCanvasContext(gl);
    const { scene, createScene, sceneModule } = createFakeModule();

    const { host, statuses } = await mountAndActivate(sceneModule);

    const canvas = host.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(getContext).toHaveBeenCalledWith("webgl2", { alpha: true });
    expect(createScene).toHaveBeenCalledTimes(1);
    expect(createScene.mock.calls[0]?.[0].palette.accent).toEqual([0, 0, 1]);
    expect(createScene.mock.calls[0]?.[0].size.pixelRatio).toBeLessThanOrEqual(2);
    expect(scene.render).toHaveBeenCalled();
    expect(statuses.map((status) => status.phase)).toEqual(["loading", "live"]);
  });

  it("sem WebGL2 fica no pôster, sem canvas e sem tocar na cena (GL-FALLBACK)", async () => {
    stubCanvasContext(null);
    const { createScene, sceneModule } = createFakeModule();

    const { host, statuses } = await mountAndActivate(sceneModule);

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "no-webgl2" });
    expect(host.querySelector("canvas")).toBeNull();
    expect(createScene).not.toHaveBeenCalled();
  });

  it("sem paleta legível fica no pôster", async () => {
    stubCanvasContext(createFakeGl().gl);
    const { sceneModule } = createFakeModule();
    const host = createStageHost({ "--hero-color-base": "light-dark(#fff, #000)" });

    const { statuses } = await mountAndActivate(sceneModule, host);

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "no-palette" });
    expect(host.querySelector("canvas")).toBeNull();
  });

  it("falha ao baixar a cena vira fallback load-error", async () => {
    const environment = installHeroTestEnvironment();
    const statuses: HeroStatus[] = [];
    mountOglStage(createStageHost(), {
      loadScene: () => Promise.reject(new Error("rede caiu")),
      onStatus: (status) => statuses.push(status),
    });

    environment.activate();
    await vi.waitFor(() => expect(statuses.length).toBeGreaterThanOrEqual(2));

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "load-error" });
  });

  it("erro ao criar a cena (shader que não compila) vira fallback scene-error", async () => {
    stubCanvasContext(createFakeGl().gl);
    const sceneModule: HeroSceneModule = {
      contextAttributes: {},
      createScene: () => {
        throw new Error("Shader do hero não compilou");
      },
    };

    const { statuses } = await mountAndActivate(sceneModule);

    expect(statuses.at(-1)).toEqual({ phase: "fallback", reason: "scene-error" });
  });

  it("contexto perdido mostra o pôster; restaurado, recria a cena (GL-CONTEXT-LOST)", async () => {
    stubCanvasContext(createFakeGl().gl);
    const { createScene, sceneModule } = createFakeModule();
    const { host, statuses } = await mountAndActivate(sceneModule);
    const canvas = host.querySelector("canvas");
    const lostEvent = new Event("webglcontextlost", { cancelable: true });

    canvas?.dispatchEvent(lostEvent);
    const afterLoss = statuses.at(-1);
    canvas?.dispatchEvent(new Event("webglcontextrestored"));

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(afterLoss).toEqual({ phase: "fallback", reason: "context-lost" });
    expect(createScene).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toEqual({ phase: "live", reason: null });
  });

  it("redimensiona a cena e redesenha quando o host muda de tamanho", async () => {
    stubCanvasContext(createFakeGl().gl);
    const { scene, sceneModule } = createFakeModule();
    const { environment } = await mountAndActivate(sceneModule);
    const rendersBefore = scene.render.mock.calls.length;

    environment.triggerResize();

    expect(scene.resize).toHaveBeenCalledTimes(1);
    expect(scene.render.mock.calls.length).toBe(rendersBefore + 1);
  });

  it("dispose libera a cena, devolve o contexto e remove o canvas", async () => {
    const { gl, loseContext } = createFakeGl();
    stubCanvasContext(gl);
    const { scene, sceneModule } = createFakeModule();
    const { host, handle } = await mountAndActivate(sceneModule);

    handle.dispose();

    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(loseContext).toHaveBeenCalledTimes(1);
    expect(host.querySelector("canvas")).toBeNull();
  });

  it("dispose antes de a cena chegar impede a montagem", async () => {
    stubCanvasContext(createFakeGl().gl);
    const environment = installHeroTestEnvironment();
    const { createScene, sceneModule } = createFakeModule();
    const host = createStageHost();
    let deliver: (loaded: HeroSceneModule) => void = () => undefined;
    const pending = new Promise<HeroSceneModule>((resolve) => {
      deliver = resolve;
    });
    const loadScene = vi.fn(() => pending);
    const handle = mountOglStage(host, { loadScene, onStatus: () => undefined });
    environment.activate();
    await vi.waitFor(() => expect(loadScene).toHaveBeenCalled());

    handle.dispose();
    deliver(sceneModule);
    await pending;
    await Promise.resolve();

    expect(createScene).not.toHaveBeenCalled();
    expect(host.querySelector("canvas")).toBeNull();
  });
});
