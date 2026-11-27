import type { Program, Renderer } from "ogl";
import { describe, expect, it, vi } from "vitest";
import { assertProgramLinked, resizeRenderer } from "./ogl-helpers";

const LINK_STATUS = 0x8b82;

function createGl(options: { readonly isLinked: boolean; readonly isContextLost?: boolean; readonly log?: string | null }) {
  return {
    LINK_STATUS,
    isContextLost: () => options.isContextLost ?? false,
    getProgramParameter: vi.fn(() => options.isLinked),
    getProgramInfoLog: () => options.log ?? null,
  } as unknown as WebGL2RenderingContext;
}

const PROGRAM = { program: {} } as unknown as Program;

describe("assertProgramLinked", () => {
  it("não faz nada quando o programa ligou", () => {
    const gl = createGl({ isLinked: true });

    expect(() => assertProgramLinked(gl, PROGRAM)).not.toThrow();
    expect(gl.getProgramParameter).toHaveBeenCalledWith(PROGRAM.program, LINK_STATUS);
  });

  it("lança com o log do driver quando o shader não compilou", () => {
    const gl = createGl({ isLinked: false, log: "ERROR: 0:12: 'uTime' : undeclared identifier" });

    expect(() => assertProgramLinked(gl, PROGRAM)).toThrow(/undeclared identifier/);
  });

  it("lança mesmo sem log do driver", () => {
    const gl = createGl({ isLinked: false });

    expect(() => assertProgramLinked(gl, PROGRAM)).toThrow(/sem log do driver/);
  });

  it("não trata contexto perdido como erro de shader", () => {
    const gl = createGl({ isLinked: false, isContextLost: true });

    expect(() => assertProgramLinked(gl, PROGRAM)).not.toThrow();
  });
});

describe("resizeRenderer", () => {
  function createRenderer(canvas: unknown) {
    const renderer = { dpr: 1, setSize: vi.fn(), gl: { canvas } };
    return renderer as unknown as Renderer & { readonly setSize: ReturnType<typeof vi.fn> };
  }

  it("aplica DPR e tamanho e devolve o layout do canvas ao CSS", () => {
    const canvas = document.createElement("canvas");
    canvas.style.width = "300px";
    canvas.style.height = "150px";
    const renderer = createRenderer(canvas);

    resizeRenderer(renderer, { width: 390, height: 780, pixelRatio: 2 });

    expect(renderer.dpr).toBe(2);
    expect(renderer.setSize).toHaveBeenCalledWith(390, 780);
    expect(canvas.style.width).toBe("");
    expect(canvas.style.height).toBe("");
  });

  it("aceita canvas que não é elemento do DOM (OffscreenCanvas)", () => {
    const renderer = createRenderer({});

    expect(() => resizeRenderer(renderer, { width: 10, height: 10, pixelRatio: 1 })).not.toThrow();
    expect(renderer.setSize).toHaveBeenCalledWith(10, 10);
  });
});
