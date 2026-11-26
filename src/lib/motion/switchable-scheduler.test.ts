import { describe, expect, it, vi } from "vitest";
import type { FrameScheduler } from "./clock";
import { createClock } from "./clock";
import { createSwitchableScheduler } from "./switchable-scheduler";

function createSource() {
  const pending = new Map<number, (timestampMs: number) => void>();
  let nextHandle = 1;
  const scheduler: FrameScheduler = {
    request(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      pending.set(handle, callback);
      return handle;
    },
    cancel(handle) {
      pending.delete(handle);
    },
  };
  const flush = (timestampMs: number): void => {
    const callbacks = [...pending.values()];
    pending.clear();
    for (const callback of callbacks) {
      callback(timestampMs);
    }
  };
  return { scheduler, flush, pendingCount: () => pending.size };
}

describe("createSwitchableScheduler", () => {
  it("agenda na fonte inicial", () => {
    const first = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();

    scheduler.request(callback);
    first.flush(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith(100);
  });

  it("cancela na fonte atual", () => {
    const first = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();

    scheduler.cancel(scheduler.request(callback));
    first.flush(100);

    expect(callback).not.toHaveBeenCalled();
    expect(first.pendingCount()).toBe(0);
  });

  it("ignora o cancelamento de um pedido que já rodou ou não existe", () => {
    const first = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const handle = scheduler.request(vi.fn());
    first.flush(0);

    expect(() => {
      scheduler.cancel(handle);
      scheduler.cancel(999);
    }).not.toThrow();
  });

  it("migra os pedidos pendentes na troca, sem deixar nada na fonte antiga", () => {
    const first = createSource();
    const second = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();
    scheduler.request(callback);

    scheduler.use(second.scheduler);
    first.flush(100);
    second.flush(7);

    expect(first.pendingCount()).toBe(0);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("cancela um pedido migrado pelo mesmo identificador", () => {
    const first = createSource();
    const second = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();
    const handle = scheduler.request(callback);

    scheduler.use(second.scheduler);
    scheduler.cancel(handle);
    second.flush(7);

    expect(callback).not.toHaveBeenCalled();
    expect(second.pendingCount()).toBe(0);
  });

  it("emenda o tempo na troca: a fonte nova continua de onde a antiga parou", () => {
    const first = createSource();
    const second = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const times: number[] = [];
    const loop = (timestampMs: number): void => {
      times.push(timestampMs);
      scheduler.request(loop);
    };
    scheduler.request(loop);
    first.flush(5000);
    first.flush(5016);

    scheduler.use(second.scheduler);
    second.flush(40);
    second.flush(56);

    expect(times[2]).toBeCloseTo(5016 + 1000 / 60);
    expect((times[3] ?? 0) - (times[2] ?? 0)).toBeCloseTo(16);
  });

  it("trocar para a mesma fonte não mexe em nada", () => {
    const first = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();
    scheduler.request(callback);

    scheduler.use(first.scheduler);
    first.flush(250);

    expect(callback).toHaveBeenCalledExactlyOnceWith(250);
  });

  it("trocar antes do primeiro frame não inventa deslocamento", () => {
    const first = createSource();
    const second = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const callback = vi.fn();

    scheduler.use(second.scheduler);
    scheduler.request(callback);
    second.flush(300);

    expect(callback).toHaveBeenCalledExactlyOnceWith(300);
  });

  it("mantém um relógio de cena em um laço só durante a troca", () => {
    const first = createSource();
    const second = createSource();
    const scheduler = createSwitchableScheduler(first.scheduler);
    const frames: number[] = [];
    const clock = createClock({ gates: ["ready"], onFrame: ({ delta }) => frames.push(delta), scheduler });
    clock.setGate("ready", true);
    first.flush(1000);
    first.flush(1016);

    scheduler.use(second.scheduler);
    second.flush(3);
    second.flush(19);

    expect(first.pendingCount()).toBe(0);
    expect(second.pendingCount()).toBe(1);
    expect(frames).toHaveLength(4);
    expect(frames[2]).toBeCloseTo(1 / 60, 3);
    expect(frames[3]).toBeCloseTo(0.016, 3);
    clock.dispose();
    expect(second.pendingCount()).toBe(0);
  });
});
