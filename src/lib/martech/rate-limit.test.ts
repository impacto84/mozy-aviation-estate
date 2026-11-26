// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("bloqueia quando excede o limite na janela e libera depois que a janela expira", () => {
    let time = 1000;
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => time });

    expect(limiter.check("ip-a").isAllowed).toBe(true);
    expect(limiter.check("ip-a").isAllowed).toBe(true);
    const blocked = limiter.check("ip-a");
    expect(blocked.isAllowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(10);

    time += 10_000;
    expect(limiter.check("ip-a").isAllowed).toBe(true);
  });

  it("remove a chave mais antiga quando maxKeys enche dentro da mesma janela", () => {
    const time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2, now: () => time });

    expect(limiter.check("k1").isAllowed).toBe(true);
    expect(limiter.check("k2").isAllowed).toBe(true);
    // k1 seria bloqueada antes da evicção; ao inserir k3, k1 (a mais antiga) sai do mapa
    expect(limiter.check("k3").isAllowed).toBe(true);
    expect(limiter.check("k1").isAllowed).toBe(true);
  });
});

describe("createRateLimiter — memória limitada", () => {
  it("nunca guarda mais que maxKeys chaves sob rajada de chaves novas", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3, now: () => time });

    for (let index = 0; index < 50; index += 1) {
      time += 1;
      expect(limiter.check(`ip-${index}`).isAllowed).toBe(true);
    }
    // As três últimas chaves continuam no mapa (bloqueadas), as antigas saíram.
    expect(limiter.check("ip-49").isAllowed).toBe(false);
    expect(limiter.check("ip-0").isAllowed).toBe(true);
  });
});
