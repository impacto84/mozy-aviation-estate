/**
 * Limite de requisições por janela fixa, em memória.
 *
 * Vale por instância do servidor: em plataforma serverless ou com várias réplicas ele
 * só freia rajadas na mesma instância. Para limite de verdade em produção use o da
 * plataforma (WAF, edge) ou um armazenamento compartilhado; este é o piso.
 */

export interface RateLimitDecision {
  readonly isAllowed: boolean;
  /** Segundos até a janela atual acabar (0 quando permitido). */
  readonly retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitDecision;
}

export interface RateLimiterOptions {
  readonly limit: number;
  readonly windowMs: number;
  readonly now?: () => number;
  /** Teto de chaves guardadas, para a memória não crescer sem fim. */
  readonly maxKeys?: number;
}

interface Bucket {
  readonly startedAt: number;
  readonly count: number;
}

const DEFAULT_MAX_KEYS = 5000;
const MS_PER_SECOND = 1000;

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const now = options.now ?? Date.now;
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  // Estado interno do limitador: o Map é atualizado no lugar, de propósito.
  const buckets = new Map<string, Bucket>();

  const dropExpired = (time: number): void => {
    for (const [key, bucket] of buckets) {
      if (time - bucket.startedAt >= options.windowMs) {
        buckets.delete(key);
      }
    }
  };

  return {
    check: (key) => {
      const time = now();
      const current = buckets.get(key);
      const isFresh = current === undefined || time - current.startedAt >= options.windowMs;
      if (isFresh && buckets.size >= maxKeys) {
        dropExpired(time);
        // Ainda cheio (rajada de chaves novas na mesma janela): sai a chave mais antiga.
        // O Map preserva a ordem de inserção, então a primeira chave é a mais antiga.
        if (buckets.size >= maxKeys) {
          const oldestKey = buckets.keys().next().value;
          if (oldestKey !== undefined) {
            buckets.delete(oldestKey);
          }
        }
      }
      const bucket: Bucket = isFresh ? { startedAt: time, count: 1 } : { startedAt: current.startedAt, count: current.count + 1 };
      buckets.set(key, bucket);
      if (bucket.count <= options.limit) {
        return { isAllowed: true, retryAfterSeconds: 0 };
      }
      const remainingMs = options.windowMs - (time - bucket.startedAt);
      return { isAllowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / MS_PER_SECOND)) };
    },
  };
}
