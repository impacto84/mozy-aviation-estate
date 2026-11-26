/**
 * Contrato entre o palco (ciclo de vida) e uma cena desenhada com ogl.
 *
 * O palco cuida de tudo que é igual em todo hero: quando carregar, contexto
 * WebGL2, tamanho e DPR, relógio, pausa, contexto perdido, fallback. A cena só
 * sabe desenhar um frame. Para criar um hero novo, escreva um módulo que exporta
 * `contextAttributes` e `createScene` e aponte um `HeroSceneLoader` para ele.
 */

import type { FrameInfo } from "@/lib/motion/clock";
import type { HeroPalette } from "./palette";
import type { SceneSize } from "./support";

/** Frame do relógio mais o progresso de rolagem da seção (0 a 1). */
export interface SceneFrame extends FrameInfo {
  readonly progress: number;
}

export type SceneRender = (frame: SceneFrame) => void;

export interface HeroScene {
  /** Desenha um frame. Roda dentro do laço: sem alocação, sem leitura de layout, sem estado do React. */
  readonly render: SceneRender;
  readonly resize: (size: SceneSize) => void;
  /** Libera programas, buffers e texturas. O palco libera o contexto e remove o canvas. */
  readonly dispose: () => void;
}

export interface HeroSceneInit {
  /** O contexto WebGL2 deste canvas já foi criado pelo palco com `contextAttributes`. */
  readonly canvas: HTMLCanvasElement;
  readonly palette: HeroPalette;
  readonly size: SceneSize;
}

export interface HeroSceneModule {
  readonly contextAttributes: WebGLContextAttributes;
  /** Pode lançar (shader que não compila): o palco mostra o pôster. */
  readonly createScene: (init: HeroSceneInit) => HeroScene;
}

/** `() => import("./scenes/minha-cena")`: o chunk só é pedido depois que o pôster pintou. */
export type HeroSceneLoader = () => Promise<HeroSceneModule>;
