import { describe, expect, it, vi } from "vitest";
import { silenceKeepAlive } from "./scroll-trigger";
import type { FrameHost } from "./scroll-trigger";

/** Host com fila de frames manual, para rodar "um frame" de cada vez. */
function createHost() {
  let queue: FrameRequestCallback[] = [];
  const requested: FrameRequestCallback[] = [];
  const host: FrameHost = {
    requestAnimationFrame(callback) {
      queue.push(callback);
      requested.push(callback);
      return requested.length;
    },
  };
  const native = host.requestAnimationFrame;
  const runFrame = (): void => {
    const callbacks = queue;
    queue = [];
    for (const callback of callbacks) {
      callback(0);
    }
  };
  return { host, native, runFrame, requested, pendingCount: () => queue.length };
}

/** Imita o ScrollTrigger: `enable()` liga um laço que se reagenda enquanto estiver habilitado. */
function createFakeScrollTrigger(host: FrameHost) {
  let isEnabled = false;
  let loopRuns = 0;
  const keepAlive = (): void => {
    loopRuns += 1;
    if (isEnabled) {
      host.requestAnimationFrame(keepAlive);
    }
  };
  return {
    enable() {
      isEnabled = true;
      if (isEnabled) {
        host.requestAnimationFrame(keepAlive);
      }
    },
    disable() {
      isEnabled = false;
    },
    loopRuns: () => loopRuns,
  };
}

describe("silenceKeepAlive", () => {
  it("descarta o laço que o enable tenta ligar", () => {
    const { host, runFrame, pendingCount } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);

    silenceKeepAlive(host, () => scrollTrigger.enable());
    runFrame();
    runFrame();
    runFrame();

    expect(scrollTrigger.loopRuns()).toBe(0);
    expect(pendingCount()).toBe(0);
  });

  it("mata um laço que já estava rodando antes", () => {
    const { host, runFrame, pendingCount } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);
    scrollTrigger.enable();
    runFrame();
    expect(scrollTrigger.loopRuns()).toBe(1);

    silenceKeepAlive(host, (hasCaptured) => {
      expect(hasCaptured()).toBe(false);
      scrollTrigger.disable();
      scrollTrigger.enable();
      expect(hasCaptured()).toBe(true);
    });
    runFrame();
    const runsAfterFilter = scrollTrigger.loopRuns();
    runFrame();
    runFrame();

    expect(runsAfterFilter).toBe(2);
    expect(scrollTrigger.loopRuns()).toBe(2);
    expect(pendingCount()).toBe(0);
  });

  it("devolve o requestAnimationFrame original dois frames depois", () => {
    const { host, native, runFrame } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);

    silenceKeepAlive(host, () => scrollTrigger.enable());

    expect(host.requestAnimationFrame).not.toBe(native);
    runFrame();
    runFrame();
    expect(host.requestAnimationFrame).toBe(native);
  });

  it("deixa passar os pedidos de frame de todo o resto", () => {
    const { host, runFrame } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);
    const other = vi.fn();

    silenceKeepAlive(host, () => {
      scrollTrigger.enable();
      host.requestAnimationFrame(other);
    });
    host.requestAnimationFrame(other);
    runFrame();

    expect(other).toHaveBeenCalledTimes(2);
  });

  it("restaura na hora quando o enable não pede frame nenhum", () => {
    const { host, native, pendingCount } = createHost();

    silenceKeepAlive(host, () => undefined);

    expect(host.requestAnimationFrame).toBe(native);
    expect(pendingCount()).toBe(0);
  });

  it("restaura e propaga quando o enable lança", () => {
    const { host, native } = createHost();

    expect(() =>
      silenceKeepAlive(host, () => {
        throw new Error("sem ScrollTrigger");
      }),
    ).toThrow("sem ScrollTrigger");
    expect(host.requestAnimationFrame).toBe(native);
  });

  it("não desfaz a troca de outro código que embrulhou o requestAnimationFrame depois", () => {
    const { host, runFrame } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);
    const restore = silenceKeepAlive(host, () => scrollTrigger.enable());
    const filtered = host.requestAnimationFrame;
    const wrapper = (callback: FrameRequestCallback): number => filtered.call(host, callback);
    host.requestAnimationFrame = wrapper;

    restore();
    runFrame();
    runFrame();

    expect(host.requestAnimationFrame).toBe(wrapper);
  });

  it("a função devolvida remove o filtro imediatamente", () => {
    const { host, native } = createHost();
    const scrollTrigger = createFakeScrollTrigger(host);

    const restore = silenceKeepAlive(host, () => scrollTrigger.enable());
    restore();

    expect(host.requestAnimationFrame).toBe(native);
  });
});
