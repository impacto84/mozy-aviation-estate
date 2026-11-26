import { describe, expect, it, vi } from "vitest";
import { createClock } from "./clock";
import { createTickerScheduler } from "./ticker-scheduler";

type Listener = (timeSeconds: number) => void;

function createTicker() {
  const listeners: Listener[] = [];
  return {
    ticker: {
      add: (listener: Listener) => listeners.push(listener),
      remove: (listener: Listener) => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      },
    },
    tick: (timeSeconds: number) => {
      for (const listener of [...listeners]) {
        listener(timeSeconds);
      }
    },
    listenerCount: () => listeners.length,
  };
}

describe("createTickerScheduler", () => {
  it("entrega o frame com o tempo em milissegundos", () => {
    const { ticker, tick } = createTicker();
    const scheduler = createTickerScheduler(ticker);
    const callback = vi.fn();

    scheduler.request(callback);
    tick(1.5);

    expect(callback).toHaveBeenCalledExactlyOnceWith(1500);
  });

  it("usa um único ouvinte no ticker para vários pedidos", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const scheduler = createTickerScheduler(ticker);
    const first = vi.fn();
    const second = vi.fn();

    scheduler.request(first);
    scheduler.request(second);

    expect(listenerCount()).toBe(1);
    tick(0.1);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("sai do ticker quando não há mais pedido", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const scheduler = createTickerScheduler(ticker);

    scheduler.request(vi.fn());
    tick(0.1);

    expect(listenerCount()).toBe(0);
  });

  it("cancela um pedido e sai do ticker se era o último", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const scheduler = createTickerScheduler(ticker);
    const callback = vi.fn();

    const handle = scheduler.request(callback);
    scheduler.cancel(handle);
    tick(0.1);

    expect(callback).not.toHaveBeenCalled();
    expect(listenerCount()).toBe(0);
  });

  it("continua ouvindo quando o callback pede o frame seguinte", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const scheduler = createTickerScheduler(ticker);
    const timestamps: number[] = [];
    const loop = (timestampMs: number): void => {
      timestamps.push(timestampMs);
      if (timestamps.length < 3) {
        scheduler.request(loop);
      }
    };

    scheduler.request(loop);
    tick(0.1);
    tick(0.2);
    tick(0.3);
    tick(0.4);

    expect(timestamps).toEqual([100, 200, 300]);
    expect(listenerCount()).toBe(0);
  });

  it("não chama no mesmo tick um pedido feito durante a entrega", () => {
    const { ticker, tick } = createTicker();
    const scheduler = createTickerScheduler(ticker);
    const late = vi.fn();

    scheduler.request(() => scheduler.request(late));
    tick(0.1);

    expect(late).not.toHaveBeenCalled();
    tick(0.2);
    expect(late).toHaveBeenCalledExactlyOnceWith(200);
  });

  it("sai do ticker mesmo quando um callback lança", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const scheduler = createTickerScheduler(ticker);

    scheduler.request(() => {
      throw new Error("cena quebrou");
    });

    expect(() => tick(0.1)).toThrow("cena quebrou");
    expect(listenerCount()).toBe(0);
  });

  it("dirige o relógio de cena: um laço, que para quando o portão fecha", () => {
    const { ticker, tick, listenerCount } = createTicker();
    const frames: number[] = [];
    const clock = createClock({
      gates: ["ready"],
      onFrame: ({ time }) => frames.push(time),
      scheduler: createTickerScheduler(ticker),
    });

    clock.setGate("ready", true);
    tick(1);
    tick(1.05);
    clock.setGate("ready", false);
    tick(1.1);

    expect(frames).toHaveLength(2);
    expect(frames[1]).toBeCloseTo(0.05);
    expect(listenerCount()).toBe(0);
    clock.dispose();
  });
});
