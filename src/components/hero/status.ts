/**
 * Estado do hero, exposto no DOM em `data-hero-state` e `data-hero-reason`
 * (o gate e os testes de navegador leem daí).
 *
 *   idle      pôster do servidor; nada carregado ainda
 *   loading   pôster; chunk da cena a caminho
 *   live      canvas visível, laço ligado (ou pausado pelo visitante / fora da tela)
 *   still     canvas visível com um frame parado (`prefers-reduced-motion`)
 *   fallback  pôster de novo; `reason` diz por quê
 */

export type HeroPhase = "idle" | "loading" | "live" | "still" | "fallback";

export type HeroFallbackReason =
  | "save-data"
  | "no-webgl2"
  | "no-palette"
  | "load-error"
  | "scene-error"
  | "context-lost";

export interface HeroStatus {
  readonly phase: HeroPhase;
  readonly reason: HeroFallbackReason | null;
}

export const IDLE_STATUS: HeroStatus = { phase: "idle", reason: null };

/** Evento disparado no host do canvas quando o hero cai para o pôster. Ouça para registrar o erro. */
export const HERO_FALLBACK_EVENT = "forja:hero-fallback";

export interface HeroFallbackDetail {
  readonly reason: HeroFallbackReason;
  readonly error: unknown;
}

export function isCanvasShown(status: HeroStatus): boolean {
  return status.phase === "live" || status.phase === "still";
}

/** Contexto perdido pode voltar (`webglcontextrestored`); os outros fallbacks são definitivos. */
export function shouldKeepScene(status: HeroStatus): boolean {
  if (status.phase === "idle") {
    return false;
  }
  return status.phase !== "fallback" || status.reason === "context-lost";
}

const CHUNK_LOAD_ERROR_NAME = "ChunkLoadError";

/** Erro capturado ao renderizar a cena: falha de rede ao baixar o chunk ou erro da própria cena. */
export function classifySceneError(error: unknown): HeroFallbackReason {
  return error instanceof Error && error.name === CHUNK_LOAD_ERROR_NAME ? "load-error" : "scene-error";
}
