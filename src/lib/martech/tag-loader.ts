/**
 * Carregador do Google Tag Manager. Só é chamado depois do aceite (ver `runtime.ts`).
 *
 * - Um ponto de inicialização: chamar duas vezes não insere dois scripts
 *   (GATES `TRACK-PIXEL-ONCE`).
 * - A origem é sempre a oficial. Não há opção de trocar o host, servir o loader pelo
 *   próprio domínio ou disfarçar o caminho: isso é evasão de bloqueador e fica fora.
 */

import { isTrackingId } from "./config";
import { ensureDataLayer } from "./destinations/data-layer";
import type { DataLayerHost } from "./destinations/data-layer";

export const GTM_SCRIPT_BASE = "https://www.googletagmanager.com/gtm.js";
export const TAG_MARKER_ATTRIBUTE = "data-forja-tag";

export interface TagHost extends DataLayerHost {
  readonly document: Document;
}

export function gtmScriptUrl(containerId: string): string {
  if (!isTrackingId("gtm", containerId)) {
    throw new Error(`ID de contêiner GTM inválido: "${containerId}".`);
  }
  return `${GTM_SCRIPT_BASE}?id=${encodeURIComponent(containerId)}`;
}

function hasScript(doc: Document, src: string): boolean {
  return [...doc.scripts].some((script) => script.src === src);
}

/**
 * Insere o `gtm.js` do contêiner. Devolve `true` se inseriu agora e `false` se a tag
 * já estava na página.
 */
export function loadGtm(host: TagHost, containerId: string, now: () => number = Date.now): boolean {
  const src = gtmScriptUrl(containerId);
  if (hasScript(host.document, src)) {
    return false;
  }
  ensureDataLayer(host).push({ "gtm.start": now(), event: "gtm.js" });
  const script = host.document.createElement("script");
  script.async = true;
  script.src = src;
  script.setAttribute(TAG_MARKER_ATTRIBUTE, "gtm");
  host.document.head.append(script);
  return true;
}
