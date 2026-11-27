import { describe, expect, it } from "vitest";
import type { HeroPalette } from "./palette";
import {
  PARTICLE_FIELD_DEFAULTS,
  SHADER_HERO_DEFAULTS,
  createParticleUniforms,
  createShaderUniforms,
  resolveParticleParams,
  resolveShaderParams,
  resolveSideLayout,
  toBufferResolution,
} from "./uniforms";

const PALETTE: HeroPalette = {
  base: [1, 1, 1],
  soft: [0.5, 0.5, 0.5],
  accent: [0, 0, 1],
  ink: [0, 0, 0],
};

describe("resolveShaderParams", () => {
  it("devolve os padrões sem sobrescritas", () => {
    expect(resolveShaderParams()).toEqual(SHADER_HERO_DEFAULTS);
  });

  it("aplica sobrescritas válidas sem mutar os padrões", () => {
    const params = resolveShaderParams({ bandCount: 12 });

    expect(params.bandCount).toBe(12);
    expect(params.flowSpeed).toBe(SHADER_HERO_DEFAULTS.flowSpeed);
    expect(SHADER_HERO_DEFAULTS.bandCount).not.toBe(12);
  });

  it("limita valores fora da faixa", () => {
    const params = resolveShaderParams({ bandCount: 500, flowSpeed: -3, grain: 9 });

    expect(params.bandCount).toBe(24);
    expect(params.flowSpeed).toBe(0);
    expect(params.grain).toBe(0.12);
  });

  it("volta ao padrão quando o valor não é número finito", () => {
    const params = resolveShaderParams({ bandCount: Number.NaN, grain: Number.POSITIVE_INFINITY });

    expect(params.bandCount).toBe(SHADER_HERO_DEFAULTS.bandCount);
    expect(params.grain).toBe(SHADER_HERO_DEFAULTS.grain);
  });
});

describe("toBufferResolution", () => {
  it("multiplica o tamanho CSS pela razão de pixels e arredonda para baixo", () => {
    expect(toBufferResolution({ width: 390, height: 780, pixelRatio: 2 })).toEqual([780, 1560]);
    expect(toBufferResolution({ width: 811, height: 301, pixelRatio: 1.5 })).toEqual([1216, 451]);
  });
});

describe("resolveSideLayout", () => {
  it("é 1 só na faixa de desktop, como as media queries do CSS", () => {
    expect(resolveSideLayout(1440)).toBe(1);
    expect(resolveSideLayout(1200)).toBe(1);
    expect(resolveSideLayout(1199)).toBe(0);
    expect(resolveSideLayout(810)).toBe(0);
    expect(resolveSideLayout(390)).toBe(0);
  });

  it("é 0 para largura inválida", () => {
    expect(resolveSideLayout(Number.NaN)).toBe(0);
    expect(resolveSideLayout(-10)).toBe(0);
  });
});

describe("createShaderUniforms", () => {
  it("converte a paleta sRGB para linear e copia os parâmetros", () => {
    const uniforms = createShaderUniforms(PALETTE, SHADER_HERO_DEFAULTS, { width: 100, height: 50, pixelRatio: 2 });

    expect(uniforms.uColorBase.value).toEqual([1, 1, 1]);
    expect(uniforms.uColorSoft.value[0]).toBeCloseTo(0.214, 3);
    expect(uniforms.uColorAccent.value).toEqual([0, 0, 1]);
    expect(uniforms.uResolution.value).toEqual([200, 100]);
    expect(uniforms.uSideLayout.value).toBe(0);
    expect(uniforms.uBandCount.value).toBe(SHADER_HERO_DEFAULTS.bandCount);
    expect(uniforms.uFlow.value).toBe(SHADER_HERO_DEFAULTS.flowSpeed);
    expect(uniforms.uGrain.value).toBe(SHADER_HERO_DEFAULTS.grain);
  });

  it("começa com tempo e progresso em zero", () => {
    const uniforms = createShaderUniforms(PALETTE, SHADER_HERO_DEFAULTS, { width: 1, height: 1, pixelRatio: 1 });

    expect(uniforms.uTime.value).toBe(0);
    expect(uniforms.uProgress.value).toBe(0);
  });
});

describe("resolveParticleParams", () => {
  it("escolhe o orçamento de partículas pela largura (phone < tablet < desktop)", () => {
    const phone = resolveParticleParams(390);
    const tablet = resolveParticleParams(810);
    const desktop = resolveParticleParams(1440);
    const count = (params: { readonly columns: number; readonly rows: number }) => params.columns * params.rows;

    expect(count(phone)).toBeLessThan(count(tablet));
    expect(count(tablet)).toBeLessThan(count(desktop));
    expect(count(desktop)).toBeLessThanOrEqual(10_000);
  });

  it("usa o orçamento do phone para largura inválida", () => {
    expect(resolveParticleParams(Number.NaN)).toEqual(resolveParticleParams(390));
    expect(resolveParticleParams(0)).toEqual(resolveParticleParams(390));
  });

  it("mantém os parâmetros de aparência padrão", () => {
    expect(resolveParticleParams(1440)).toMatchObject(PARTICLE_FIELD_DEFAULTS);
  });
});

describe("createParticleUniforms", () => {
  it("leva a paleta em sRGB e a razão de pixels para o tamanho do ponto", () => {
    const params = resolveParticleParams(1440);
    const uniforms = createParticleUniforms(PALETTE, params, { width: 1440, height: 836, pixelRatio: 2 });

    expect(uniforms.uColorAccent.value).toEqual([0, 0, 1]);
    expect(uniforms.uColorInk.value).toEqual([0, 0, 0]);
    expect(uniforms.uPixelRatio.value).toBe(2);
    expect(uniforms.uResolution.value).toEqual([2880, 1672]);
    expect(uniforms.uSideLayout.value).toBe(1);
    expect(uniforms.uViewportHeight.value).toBe(836);
    expect(uniforms.uPointSize.value).toBe(params.pointSize);
    expect(uniforms.uWaveHeight.value).toBe(params.waveHeight);
    expect(uniforms.uFlow.value).toBe(params.flowSpeed);
  });
});
