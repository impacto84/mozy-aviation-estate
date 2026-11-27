/**
 * Persistência do lead em disco (NDJSON, permissões restritas) e log estruturado
 * sem dado pessoal. Só servidor: importado apenas pela rota `app/api/leads`.
 */

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { DeliverLead, LeadDelivery } from "./lead-handler";

const FILE_MODE = 0o600;
const DIR_MODE = 0o700;
const STORAGE_ENV = "LEADS_STORAGE_DIR";
const DEFAULT_STORAGE_DIR = ".data/leads";

/** Diretório de gravação. `off` desliga; vazio usa o padrão (fora do git). */
export function resolveLeadStorageDir(raw: string | undefined, cwd: string = process.cwd()): string | null {
  const value = raw?.trim() ?? "";
  if (value.toLowerCase() === "off") {
    return null;
  }
  const dir = value === "" ? DEFAULT_STORAGE_DIR : value;
  if (dir.includes("\0")) {
    throw new Error(`${STORAGE_ENV} inválido.`);
  }
  return path.resolve(cwd, dir);
}

/** Arquivo do mês (UTC): `leads-AAAA-MM.ndjson`. */
export function leadFileName(receivedAt: string): string {
  const month = /^\d{4}-\d{2}/.exec(receivedAt)?.[0] ?? "sem-data";
  return `leads-${month}.ndjson`;
}

export function createDiskDelivery(dir: string): DeliverLead {
  return async (delivery: LeadDelivery) => {
    await mkdir(dir, { recursive: true, mode: DIR_MODE });
    const line = `${JSON.stringify(delivery)}\n`;
    await appendFile(path.join(dir, leadFileName(delivery.receivedAt)), line, { encoding: "utf8", mode: FILE_MODE });
  };
}

/** Várias entregas em sequência: a primeira falha interrompe (o cliente recebe erro e pode reenviar). */
export function combineDeliveries(deliveries: readonly DeliverLead[]): DeliverLead | null {
  if (deliveries.length === 0) {
    return null;
  }
  return async (delivery) => {
    for (const deliver of deliveries) {
      await deliver(delivery);
    }
  };
}

export type LeadLogEvent = "lead.accepted" | "lead.discarded" | "lead.rejected" | "lead.delivery_failed";

export interface LeadLogEntry {
  readonly event: LeadLogEvent;
  readonly traceId: string;
  readonly status: number;
  /** Só metadados: perfil escolhido, se veio com campanha. Nunca nome, e-mail, telefone ou mensagem. */
  readonly profile?: string;
  readonly hasAttribution?: boolean;
  readonly problem?: string;
}

/** Log JSON de uma linha (timestamp, nível, evento, traceId). Sem PII por construção do tipo. */
export function formatLeadLog(entry: LeadLogEntry, now: Date = new Date()): string {
  const level = entry.event === "lead.accepted" || entry.event === "lead.discarded" ? "info" : "warn";
  return `${JSON.stringify({ timestamp: now.toISOString(), level, service: "mozy-site", ...entry })}\n`;
}

export function writeLeadLog(entry: LeadLogEntry): void {
  process.stdout.write(formatLeadLog(entry));
}
