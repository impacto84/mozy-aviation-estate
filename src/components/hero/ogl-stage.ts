/**
 * Palco das cenas em ogl (ShaderHero e ParticlesHero): liga o ciclo de vida
 * comum (`stage-runtime`) a um canvas criado no cliente.
 *
 * O canvas é criado aqui, não no JSX: o HTML do servidor só tem o pôster
 * (`GL-FALLBACK`), e cada montagem do efeito tem o próprio canvas e o próprio
 * contexto, que é devolvido ao navegador no cleanup.
 */

import type { FrameScheduler } from "@/lib/motion/clock";
import { readHeroPalette } from "./palette";
import type { HeroPalette } from "./palette";
import type { HeroScene, HeroSceneLoader, HeroSceneModule } from "./scene-contract";
import type { ProgressSource } from "./scroll-progress";
import { createStageRuntime } from "./stage-runtime";
import type { StageRuntime } from "./stage-runtime";
import type { HeroStatus } from "./status";
import { acquireWebGL2, measureCanvas, releaseWebGL } from "./support";
import type { SceneSize } from "./support";

export interface OglStageOptions {
  readonly loadScene: HeroSceneLoader;
  readonly onStatus: (status: HeroStatus) => void;
  readonly progress?: ProgressSource;
  /** Relógio compartilhado da página; ver `StageRuntimeOptions.scheduler`. */
  readonly scheduler?: FrameScheduler;
}

export interface StageHandle {
  readonly setPlaying: (isPlaying: boolean) => void;
  readonly dispose: () => void;
}

interface SceneSessionInit {
  readonly host: HTMLElement;
  readonly view: Window;
  readonly canvas: HTMLCanvasElement;
  readonly sceneModule: HeroSceneModule;
  readonly palette: HeroPalette;
  readonly runtime: StageRuntime;
}

type Cleanup = () => void;

const noop: Cleanup = () => undefined;

function createCanvas(host: HTMLElement): HTMLCanvasElement {
  const canvas = host.ownerDocument.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  return canvas;
}

/** Cria a cena, redimensiona com o host e recria depois de um contexto restaurado. */
function runSceneSession({ host, view, canvas, sceneModule, palette, runtime }: SceneSessionInit): Cleanup {
  let scene: HeroScene | null = null;
  const measure = (): SceneSize =>
    measureCanvas({ width: host.clientWidth, height: host.clientHeight }, view.devicePixelRatio);

  const start = (): void => {
    try {
      const created = sceneModule.createScene({ canvas, palette, size: measure() });
      scene = created;
      runtime.attach(created.render);
    } catch (error) {
      scene = null;
      runtime.fail("scene-error", error);
    }
  };
  const handleContextLost = (event: Event): void => {
    // Sem preventDefault o navegador nunca dispara `webglcontextrestored`.
    event.preventDefault();
    scene = null;
    runtime.suspend();
  };
  const observer = new ResizeObserver(() => {
    if (scene !== null) {
      scene.resize(measure());
      runtime.redraw();
    }
  });

  canvas.addEventListener("webglcontextlost", handleContextLost);
  canvas.addEventListener("webglcontextrestored", start);
  observer.observe(host);
  start();

  return () => {
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", start);
    scene?.dispose();
    scene = null;
  };
}

function mountScene(host: HTMLElement, sceneModule: HeroSceneModule, runtime: StageRuntime): Cleanup {
  const view = host.ownerDocument.defaultView;
  const palette = view === null ? null : readHeroPalette(view.getComputedStyle(host));
  if (view === null || palette === null) {
    runtime.fail("no-palette", null);
    return noop;
  }
  const canvas = createCanvas(host);
  const gl = acquireWebGL2(canvas, sceneModule.contextAttributes);
  if (gl === null) {
    canvas.remove();
    runtime.fail("no-webgl2", null);
    return noop;
  }
  const stopSession = runSceneSession({ host, view, canvas, sceneModule, palette, runtime });
  return () => {
    stopSession();
    releaseWebGL(gl);
    canvas.remove();
  };
}

/**
 * Monta o palco no `host`. Chame dentro de um efeito e devolva `dispose` no cleanup.
 * Nada acontece de forma síncrona: o pôster do servidor fica na tela até a cena
 * desenhar o primeiro frame.
 */
export function mountOglStage(host: HTMLElement, options: OglStageOptions): StageHandle {
  const runtime = createStageRuntime(host, { onStatus: options.onStatus, progress: options.progress, scheduler: options.scheduler });
  let unmountScene = noop;
  let isDisposed = false;

  const loadAndMount = async (): Promise<void> => {
    if (!(await runtime.whenActive)) {
      return;
    }
    let sceneModule: HeroSceneModule;
    try {
      sceneModule = await options.loadScene();
    } catch (error) {
      runtime.fail("load-error", error);
      return;
    }
    if (!isDisposed) {
      unmountScene = mountScene(host, sceneModule, runtime);
    }
  };
  void loadAndMount();

  return {
    setPlaying: runtime.setPlaying,
    dispose() {
      isDisposed = true;
      unmountScene();
      unmountScene = noop;
      runtime.dispose();
    },
  };
}
