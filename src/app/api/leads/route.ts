import { createLeadHandler, createWebhookDelivery, resolveLeadWebhookUrl } from "@/lib/martech/lead-handler";
import { combineDeliveries, createDiskDelivery, resolveLeadStorageDir, writeLeadLog } from "@/lib/martech/lead-storage";
import type { DeliverLead } from "@/lib/martech/lead-handler";
import { createRateLimiter } from "@/lib/martech/rate-limit";

/** Envios por IP por minuto. Um formulário legítimo não passa disso. */
const LEADS_PER_WINDOW = 5;
const WINDOW_MS = 60_000;
/** Envio sem JavaScript: volta para o formulário com a âncora do aviso (`:target`). */
const SUCCESS_PATH = "/solicitar-acesso#envio-recebido";
const FAILURE_PATH = "/solicitar-acesso#envio-nao-concluido";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Destinos: disco (`LEADS_STORAGE_DIR`, padrão `.data/leads`, fora do git; `off` desliga)
 * e, se configurado, webhook HTTPS (`LEAD_WEBHOOK_URL`, só servidor). Sem nenhum
 * destino a rota responde 503 RFC 7807 em vez de fingir que guardou.
 */
function resolveDelivery(): DeliverLead | null {
  const storageDir = resolveLeadStorageDir(process.env.LEADS_STORAGE_DIR);
  const webhookUrl = resolveLeadWebhookUrl(process.env.LEAD_WEBHOOK_URL);
  const deliveries: DeliverLead[] = [];
  if (storageDir !== null) {
    deliveries.push(createDiskDelivery(storageDir));
  }
  if (webhookUrl !== null) {
    deliveries.push(createWebhookDelivery(webhookUrl));
  }
  return combineDeliveries(deliveries);
}

const handler = createLeadHandler({
  deliver: resolveDelivery(),
  limiter: createRateLimiter({ limit: LEADS_PER_WINDOW, windowMs: WINDOW_MS }),
  successPath: SUCCESS_PATH,
  failurePath: FAILURE_PATH,
  log: writeLeadLog,
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
