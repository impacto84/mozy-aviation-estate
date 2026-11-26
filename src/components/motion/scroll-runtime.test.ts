import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, resetBrowserStubs } from "@/components/sim/test-support";
import { createClock } from "@/lib/motion/clock";
import { ensureScrollTrigger, sharedScheduler, startScrollRuntime } from "./scroll-runtime";

/** Tempo real: o jsdom entrega requestAnimationFrame a cerca de 60 fps. */
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Conta os pedidos de frame por nome da função pedida (as funções do GSAP têm nome no pacote sem minificar). */
function countFrameRequests(): { readonly counts: Map<string, number>; readonly restore: () => void } {
  const counts = new Map<string, number>();
  const wrapped = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback) => {
    counts.set(callback.name, (counts.get(callback.name) ?? 0) + 1);
    return wrapped.call(window, callback);
  };
  return { counts, restore: () => (window.requestAnimationFrame = wrapped) };
}

const isSmoothClassOn = (): boolean => document.documentElement.classList.contains("lenis");

describe("ensureScrollTrigger (gsap de verdade)", () => {
  beforeEach(() => {
    installBrowserStubs();
  });

  afterEach(() => {
    resetBrowserStubs();
  });

  it("registra o ScrollTrigger sem deixar o laço de keep-alive rodando", async () => {
    const probe = countFrameRequests();

    const registered = ensureScrollTrigger();
    await wait(250);
    const keepAliveRequests = probe.counts.get("_rafBugFix") ?? 0;
    probe.restore();

    expect(registered).toBe(ScrollTrigger);
    expect(typeof ScrollTrigger.create).toBe("function");
    expect(keepAliveRequests).toBe(0);
  });

  it("o laço de keep-alive existe quando o ScrollTrigger é religado sem o filtro (o motivo do filtro)", async () => {
    ensureScrollTrigger();
    const probe = countFrameRequests();

    ScrollTrigger.disable(false);
    ScrollTrigger.enable();
    await wait(250);
    const loopRequests = probe.counts.get("_rafBugFix") ?? 0;
    ScrollTrigger.disable(false);
    await wait(50);
    probe.restore();

    expect(loopRequests).toBeGreaterThan(3);
  });

  it("pode ser chamado de novo sem religar nada", async () => {
    const enable = vi.spyOn(ScrollTrigger, "enable");

    ensureScrollTrigger();
    ensureScrollTrigger();

    expect(enable).not.toHaveBeenCalled();
    enable.mockRestore();
  });
});

describe("sharedScheduler (ticker do gsap de verdade)", () => {
  it("dirige um relógio de cena e solta o ticker quando a cena para", async () => {
    const frames: number[] = [];
    const clock = createClock({ gates: ["ready"], onFrame: ({ time }) => frames.push(time), scheduler: sharedScheduler });

    clock.setGate("ready", true);
    await wait(200);
    clock.setGate("ready", false);
    const framesWhenStopped = frames.length;
    await wait(100);

    expect(framesWhenStopped).toBeGreaterThan(2);
    expect(frames).toHaveLength(framesWhenStopped);
    expect(frames.at(-1)).toBeGreaterThan(0);
    clock.dispose();
  });
});

describe("startScrollRuntime", () => {
  afterEach(() => {
    resetBrowserStubs();
    vi.restoreAllMocks();
  });

  it("liga a rolagem suave com ponteiro fino e movimento permitido", () => {
    installBrowserStubs();

    const runtime = startScrollRuntime();

    expect(runtime.isSmooth()).toBe(true);
    expect(isSmoothClassOn()).toBe(true);
    runtime.stop();
    expect(isSmoothClassOn()).toBe(false);
  });

  it("não cria o Lenis com movimento reduzido", () => {
    installBrowserStubs({ isReducedMotion: true });

    const runtime = startScrollRuntime();

    expect(runtime.isSmooth()).toBe(false);
    expect(isSmoothClassOn()).toBe(false);
    runtime.stop();
  });

  it("fica na rolagem nativa em aparelho só de toque, a menos que peçam o contrário", () => {
    installBrowserStubs({ isTouchOnly: true });

    const native = startScrollRuntime();
    expect(native.isSmooth()).toBe(false);
    native.stop();
    const smooth = startScrollRuntime({ shouldSmoothTouch: true });

    expect(smooth.isSmooth()).toBe(true);
    smooth.stop();
  });

  it("desliga e religa quando a preferência de movimento muda com a página aberta", () => {
    const stubs = installBrowserStubs();
    const runtime = startScrollRuntime();

    stubs.setReducedMotion(true);
    expect(runtime.isSmooth()).toBe(false);
    expect(isSmoothClassOn()).toBe(false);
    stubs.setReducedMotion(false);

    expect(runtime.isSmooth()).toBe(true);
    runtime.stop();
  });

  it("stop tira o ouvinte do ticker, os observers e os ouvintes de mídia", () => {
    const stubs = installBrowserStubs();
    const add = vi.spyOn(gsap.ticker, "add");
    const remove = vi.spyOn(gsap.ticker, "remove");
    const runtime = startScrollRuntime();
    const step = add.mock.calls.at(-1)?.[0];

    runtime.stop();

    expect(step).toBeTypeOf("function");
    expect(remove).toHaveBeenCalledWith(step);
    expect(stubs.activeCounts()).toEqual({ intersection: 0, resize: 0, media: 0 });
  });

  it("rola de forma nativa quando a rolagem suave está desligada", () => {
    installBrowserStubs({ isReducedMotion: true });
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const target = document.createElement("section");
    target.id = "alvo";
    target.getBoundingClientRect = () => ({ top: 400 }) as DOMRect;
    document.body.append(target);
    const runtime = startScrollRuntime();

    runtime.scrollTo(120);
    runtime.scrollTo("#alvo", { offset: -80 });
    runtime.scrollTo(target, { immediate: true });
    runtime.scrollTo("#nao-existe");

    expect(scrollTo.mock.calls).toEqual([
      [{ top: 120, behavior: "auto" }],
      [{ top: 320, behavior: "auto" }],
      [{ top: 400, behavior: "auto" }],
    ]);
    runtime.stop();
  });

  it("usa rolagem nativa suave em aparelho de toque com movimento permitido", () => {
    installBrowserStubs({ isTouchOnly: true });
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const runtime = startScrollRuntime();

    runtime.scrollTo(300);

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 300, behavior: "smooth" });
    runtime.stop();
  });

  it("entrega o destino ao Lenis quando a rolagem suave está ligada", () => {
    installBrowserStubs();
    const nativeScrollTo = vi.fn();
    vi.stubGlobal("scrollTo", nativeScrollTo);
    const runtime = startScrollRuntime();

    expect(() => runtime.scrollTo(200, { immediate: true })).not.toThrow();
    expect(nativeScrollTo).not.toHaveBeenCalledWith({ top: 200, behavior: "smooth" });
    runtime.stop();
  });
});
