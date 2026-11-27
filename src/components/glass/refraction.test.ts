import { describe, expect, it } from "vitest";
import {
  REFRACTION_LEVELS,
  REFRACTION_SUPPORT_PROBE,
  readRefractionEnvironment,
  refractionFilterId,
  refractionSpec,
  supportsRefraction,
} from "./refraction";
import type { RefractionEnvironment } from "./refraction";

function environment(overrides: Partial<RefractionEnvironment> = {}): RefractionEnvironment {
  return { supports: () => true, brands: ["Chromium", "Google Chrome"], ...overrides };
}

describe("supportsRefraction", () => {
  it("liga em motor Chromium que aceita filtro SVG no backdrop-filter", () => {
    expect(supportsRefraction(environment())).toBe(true);
  });

  it("pergunta ao CSS pela declaração exata usada na folha de estilo", () => {
    const asked: string[] = [];
    const supports = (property: string, value: string): boolean => {
      asked.push(`${property}: ${value}`);
      return true;
    };

    supportsRefraction(environment({ supports }));

    expect(asked).toEqual([`${REFRACTION_SUPPORT_PROBE.property}: ${REFRACTION_SUPPORT_PROBE.value}`]);
  });

  it("desliga quando o CSS recusa a declaração", () => {
    expect(supportsRefraction(environment({ supports: () => false }))).toBe(false);
  });

  it("desliga em motor que aceita a sintaxe mas não é Chromium (WebKit e Gecko não desenham o filtro)", () => {
    expect(supportsRefraction(environment({ brands: null }))).toBe(false);
    expect(supportsRefraction(environment({ brands: [] }))).toBe(false);
    expect(supportsRefraction(environment({ brands: ["Safari"] }))).toBe(false);
  });

  it("desliga se a consulta ao CSS lançar", () => {
    const supports = (): boolean => {
      throw new Error("CSS.supports indisponível");
    };

    expect(supportsRefraction(environment({ supports }))).toBe(false);
  });
});

describe("readRefractionEnvironment", () => {
  it("lê CSS.supports e as marcas de navigator.userAgentData", () => {
    const view = {
      CSS: { supports: (property: string) => property === "backdrop-filter" },
      navigator: { userAgentData: { brands: [{ brand: "Chromium", version: "140" }, { brand: "Not.A/Brand" }] } },
    };

    const env = readRefractionEnvironment(view);

    expect(env.supports("backdrop-filter", "blur(1px)")).toBe(true);
    expect(env.supports("color", "red")).toBe(false);
    expect(env.brands).toEqual(["Chromium", "Not.A/Brand"]);
  });

  it("sem CSS.supports, nada é suportado", () => {
    const env = readRefractionEnvironment({ navigator: {} });

    expect(env.supports("backdrop-filter", "blur(1px)")).toBe(false);
  });

  it("sem userAgentData, não há marcas", () => {
    expect(readRefractionEnvironment({ navigator: {} }).brands).toBeNull();
    expect(readRefractionEnvironment({}).brands).toBeNull();
    expect(readRefractionEnvironment(null).brands).toBeNull();
  });

  it("ignora entradas de marca malformadas", () => {
    const view = { navigator: { userAgentData: { brands: [{ brand: 7 }, null, "Chromium", { brand: "Chromium" }] } } };

    expect(readRefractionEnvironment(view).brands).toEqual(["Chromium"]);
  });

  it("trata brands que não é lista como ausência de marcas", () => {
    expect(readRefractionEnvironment({ navigator: { userAgentData: { brands: "Chromium" } } }).brands).toBeNull();
  });

  it("funciona com o window do jsdom, que não tem CSS.supports de backdrop-filter nem userAgentData", () => {
    expect(supportsRefraction(readRefractionEnvironment(window))).toBe(false);
  });
});

describe("refractionSpec", () => {
  it("não tem filtro para o nível none", () => {
    expect(refractionSpec("none")).toBeNull();
  });

  it("devolve só números finitos e positivos, prontos para atributo de SVG", () => {
    for (const level of REFRACTION_LEVELS) {
      const spec = refractionSpec(level);
      if (spec === null) {
        continue;
      }
      const values = [spec.scale, spec.frequencyX, spec.frequencyY, spec.octaves, spec.softness, spec.seed];
      expect(values.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
      expect(Number.isInteger(spec.octaves)).toBe(true);
      expect(Number.isInteger(spec.seed)).toBe(true);
    }
  });

  it("desloca mais no nível strong do que no soft", () => {
    const soft = refractionSpec("soft");
    const strong = refractionSpec("strong");

    expect(strong?.scale ?? 0).toBeGreaterThan(soft?.scale ?? 0);
  });
});

describe("refractionFilterId", () => {
  it("deriva do id da instância um id que pode ir sem aspas dentro de url()", () => {
    expect(refractionFilterId("_r_1a_")).toBe("glass-refraction-_r_1a_");
    expect(refractionFilterId(":r1:")).toBe("glass-refraction-_r1_");
    expect(refractionFilterId('a b)"c')).toBe("glass-refraction-a_b__c");
  });

  it("ids de instância diferentes dão ids de filtro diferentes", () => {
    expect(refractionFilterId("_r_1_")).not.toBe(refractionFilterId("_r_2_"));
  });
});
