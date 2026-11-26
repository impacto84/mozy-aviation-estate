import { describe, expect, it, vi } from "vitest";
import { createClock } from "./clock";
import type { FrameInfo, FrameScheduler } from "./clock";

type TickCallback = (timestampMs: number) => void;

interface FakeScheduler extends FrameScheduler {
  readonly pendingCount: () => number;
  readonly requestCount: () => number;
  readonly cancelCount: () => number;
  readonly flush: (timestampMs: number) => void;
}

function createFakeScheduler(): FakeScheduler {
  const pending = new Map<number, TickCallback>();
  let nextHandle = 1;
  let requests = 0;
  let cancels = 0;
  return {
    request(callback) {
      requests += 1;
      const handle = nextHandle;
      nextHandle += 1;
      pending.set(handle, callback);
      return handle;
    },
    cancel(handle) {
      cancels += 1;
      pending.delete(handle);
    },
    pendingCount: () => pending.size,
    requestCount: () => requests,
    cancelCount: () => cancels,
    flush(timestampMs) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) {
        callback(timestampMs);
      }
    },
  };
}

function setup(gates: readonly string[] = ["ready", "visible"]) {
  const scheduler = createFakeScheduler();
  const frames: FrameInfo[] = [];
  const clock = createClock({ gates, scheduler, onFrame: (frame) => frames.push(frame) });
  return { scheduler, frames, clock };
}

describe("createClock", () => {
  it("não agenda frame enquanto algum portão está fechado", () => {
    const { scheduler, clock } = setup();

    clock.setGate("ready", true);

    expect(clock.isRunning()).toBe(false);
    expect(scheduler.requestCount()).toBe(0);
  });

  it("começa a rodar quando todos os portões abrem", () => {
    const { scheduler, clock } = setup();

    clock.setGate("ready", true);
    clock.setGate("visible", true);

    expect(clock.isRunning()).toBe(true);
    expect(scheduler.pendingCount()).toBe(1);
  });

  it("mantém um único frame pendente mesmo com aberturas repetidas (um relógio por cena)", () => {
    const { scheduler, clock } = setup();

    clock.setGate("ready", true);
    clock.setGate("visible", true);
    clock.setGate("visible", true);
    clock.setGate("ready", true);

    expect(scheduler.pendingCount()).toBe(1);
    expect(scheduler.requestCount()).toBe(1);
  });

  it("entrega tempo acumulado e delta em segundos", () => {
    const { scheduler, frames, clock } = setup(["ready"]);
    clock.setGate("ready", true);

    scheduler.flush(1000);
    scheduler.flush(1016);
    scheduler.flush(1048);

    expect(frames).toHaveLength(3);
    expect(frames[0]).toEqual({ time: 0, delta: 0 });
    expect(frames[1]?.delta).toBeCloseTo(0.016);
    expect(frames[2]?.time).toBeCloseTo(0.048);
    expect(clock.time()).toBeCloseTo(0.048);
  });

  it("cancela o frame pendente quando um portão fecha", () => {
    const { scheduler, frames, clock } = setup(["ready"]);
    clock.setGate("ready", true);
    scheduler.flush(0);

    clock.setGate("ready", false);
    scheduler.flush(16);

    expect(clock.isRunning()).toBe(false);
    expect(scheduler.cancelCount()).toBe(1);
    expect(scheduler.pendingCount()).toBe(0);
    expect(frames).toHaveLength(1);
  });

  it("não conta o tempo em pausa: o primeiro frame depois de retomar tem delta zero", () => {
    const { scheduler, frames, clock } = setup(["ready"]);
    clock.setGate("ready", true);
    scheduler.flush(0);
    scheduler.flush(100);

    clock.setGate("ready", false);
    clock.setGate("ready", true);
    scheduler.flush(60_000);

    expect(frames.at(-1)).toEqual({ time: 0.1, delta: 0 });
  });

  it("limita o delta a maxDelta depois de um frame longo", () => {
    const scheduler = createFakeScheduler();
    const frames: FrameInfo[] = [];
    const clock = createClock({ gates: ["ready"], scheduler, maxDelta: 0.05, onFrame: (frame) => frames.push(frame) });
    clock.setGate("ready", true);

    scheduler.flush(0);
    scheduler.flush(2000);

    expect(frames[1]).toEqual({ time: 0.05, delta: 0.05 });
  });

  it("ignora timestamp que anda para trás", () => {
    const { scheduler, frames, clock } = setup(["ready"]);
    clock.setGate("ready", true);

    scheduler.flush(500);
    scheduler.flush(400);

    expect(frames[1]).toEqual({ time: 0, delta: 0 });
  });

  it("começa em initialTime quando informado", () => {
    const scheduler = createFakeScheduler();
    const frames: FrameInfo[] = [];
    const clock = createClock({ gates: ["ready"], scheduler, initialTime: 12, onFrame: (frame) => frames.push(frame) });

    clock.renderStill();

    expect(frames).toEqual([{ time: 12, delta: 0 }]);
    expect(clock.time()).toBe(12);
  });

  it("renderStill desenha um frame parado sem agendar nada", () => {
    const { scheduler, frames, clock } = setup();

    clock.renderStill();

    expect(frames).toEqual([{ time: 0, delta: 0 }]);
    expect(scheduler.requestCount()).toBe(0);
  });

  it("dispose cancela o frame pendente e torna as chamadas seguintes inertes", () => {
    const { scheduler, frames, clock } = setup(["ready"]);
    clock.setGate("ready", true);

    clock.dispose();
    clock.setGate("ready", true);
    clock.renderStill();
    scheduler.flush(16);

    expect(clock.isRunning()).toBe(false);
    expect(scheduler.pendingCount()).toBe(0);
    expect(frames).toEqual([]);
  });

  it("para o relógio e avisa onError quando o frame lança", () => {
    const scheduler = createFakeScheduler();
    const failure = new Error("shader quebrou");
    const onError = vi.fn();
    const clock = createClock({
      gates: ["ready"],
      scheduler,
      onError,
      onFrame: () => {
        throw failure;
      },
    });
    clock.setGate("ready", true);

    scheduler.flush(0);

    expect(onError).toHaveBeenCalledWith(failure);
    expect(clock.isRunning()).toBe(false);
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("propaga o erro do frame quando não há onError", () => {
    const scheduler = createFakeScheduler();
    const clock = createClock({
      gates: ["ready"],
      scheduler,
      onFrame: () => {
        throw new Error("sem tratamento");
      },
    });
    clock.setGate("ready", true);

    expect(() => scheduler.flush(0)).toThrow("sem tratamento");
    expect(clock.isRunning()).toBe(false);
  });

  it("não volta a rodar depois de um erro de frame", () => {
    const scheduler = createFakeScheduler();
    const clock = createClock({
      gates: ["ready"],
      scheduler,
      onError: () => undefined,
      onFrame: () => {
        throw new Error("falha");
      },
    });
    clock.setGate("ready", true);
    scheduler.flush(0);

    clock.setGate("ready", false);
    clock.setGate("ready", true);

    expect(scheduler.pendingCount()).toBe(0);
  });

  it("recusa portão desconhecido", () => {
    const { clock } = setup(["ready"]);

    expect(() => clock.setGate("inexistente", true)).toThrow(RangeError);
  });

  it("recusa configuração inválida", () => {
    const scheduler = createFakeScheduler();
    const onFrame = () => undefined;

    expect(() => createClock({ gates: [], scheduler, onFrame })).toThrow(RangeError);
    expect(() => createClock({ gates: ["a", "a"], scheduler, onFrame })).toThrow(RangeError);
    expect(() => createClock({ gates: ["a"], scheduler, onFrame, maxDelta: 0 })).toThrow(RangeError);
    expect(() => createClock({ gates: ["a"], scheduler, onFrame, initialTime: Number.NaN })).toThrow(RangeError);
  });

  it("usa requestAnimationFrame do navegador quando não recebe scheduler", () => {
    const request = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const clock = createClock({ gates: ["ready"], onFrame: () => undefined });

    clock.setGate("ready", true);
    clock.setGate("ready", false);

    expect(request).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(7);
    request.mockRestore();
    cancel.mockRestore();
  });
});
