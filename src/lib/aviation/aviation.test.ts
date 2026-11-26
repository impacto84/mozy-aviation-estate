// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aircraft } from "@/lib/site-data";
import { LANDMASSES, densify } from "./continents";
import { HUBS, ORIGIN, greatCircleKm, initialBearing, projectAzimuthal, projectedPath } from "./geo";
import { hubReach, reachStatus } from "./range";
import { fuselageWidth, silhouettePath } from "./silhouette";
import { AIRCRAFT_SPECS, RUNWAY_PREMISE, findAircraft, formatMeters, formatNm, lateralClearance, nmToKm, runwayUse } from "./specs";

describe("especificações das aeronaves críticas", () => {
  it("cobre exatamente as seis aeronaves do brief", () => {
    expect(AIRCRAFT_SPECS.map((spec) => spec.name)).toEqual([...aircraft]);
  });

  it("toda aeronave cabe na pista-premissa (largura e decolagem publicada)", () => {
    for (const spec of AIRCRAFT_SPECS) {
      expect(lateralClearance(spec)).toBeGreaterThan(0);
      expect(runwayUse(spec)).toBeLessThan(1);
    }
    expect(RUNWAY_PREMISE).toEqual({ lengthM: 3000, widthM: 45 });
  });

  it("calcula folga lateral e uso de pista", () => {
    const g7500 = findAircraft("Global 7000 / 7500");
    expect(lateralClearance(g7500)).toBeCloseTo(6.65, 2);
    expect(runwayUse(g7500)).toBeCloseTo(0.589, 3);
    expect(runwayUse(g7500, 0)).toBe(0);
    expect(nmToKm(1000)).toBeCloseTo(1852, 6);
  });

  it("formata em pt-BR", () => {
    expect(formatMeters(28.5)).toBe("28,5 m");
    expect(formatNm(6750)).toBe("6.750 nm");
  });

  it("recusa aeronave sem especificação", () => {
    expect(() => findAircraft("Concorde" as never)).toThrow("sem especificação");
  });
});

describe("geodésia a partir de Orlando", () => {
  it("distâncias ortodrômicas plausíveis (±2%)", () => {
    const byId = Object.fromEntries(HUBS.map((hub) => [hub.id, greatCircleKm(ORIGIN, hub)]));
    expect(byId["new-york"]).toBeGreaterThan(1490);
    expect(byId["new-york"]).toBeLessThan(1550);
    expect(byId.london).toBeGreaterThan(6830);
    expect(byId.london).toBeLessThan(7110);
    expect(byId.tokyo).toBeGreaterThan(11_460);
    expect(byId.tokyo).toBeLessThan(11_940);
  });

  it("a projeção azimutal preserva a distância ao centro", () => {
    const london = HUBS.find((hub) => hub.id === "london");
    expect(london).toBeDefined();
    if (london === undefined) return;
    const point = projectAzimuthal(london, ORIGIN, 10);
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(greatCircleKm(ORIGIN, london) / 10, 6);
    expect(projectAzimuthal(ORIGIN, ORIGIN, 10)).toEqual({ x: 0, y: 0 });
  });

  it("norte para cima: Nova York fica acima e à direita de Orlando", () => {
    const newYork = HUBS[0];
    expect(newYork).toBeDefined();
    if (newYork === undefined) return;
    const point = projectAzimuthal(newYork, ORIGIN, 10);
    expect(point.y).toBeLessThan(0);
    expect(point.x).toBeGreaterThan(0);
    expect(initialBearing(ORIGIN, newYork)).toBeGreaterThan(0);
  });

  it("gera caminhos SVG fechados e densifica contornos", () => {
    expect(projectedPath([[0, 0], [10, 10]], ORIGIN, 10, true)).toMatch(/^M.+L.+Z$/);
    expect(densify([[0, 0], [0, 10]], 2)).toHaveLength(6);
    expect(LANDMASSES.length).toBeGreaterThan(8);
  });
});

describe("alcance sem escala", () => {
  it("classifica com margem de 10%", () => {
    expect(reachStatus(0.9)).toBe("nonstop");
    expect(reachStatus(0.95)).toBe("limit");
    expect(reachStatus(1.01)).toBe("out");
  });

  it("Global 7500 alcança Tóquio sem escala; Falcon 2000 não alcança Dubai", () => {
    const tokyo = hubReach(findAircraft("Global 7000 / 7500")).find((entry) => entry.hub.id === "tokyo");
    const dubai = hubReach(findAircraft("Falcon 2000")).find((entry) => entry.hub.id === "dubai");
    expect(tokyo?.status).toBe("nonstop");
    expect(dubai?.status).toBe("out");
  });
});

describe("silhueta em escala métrica", () => {
  it("as pontas da asa ficam em ±envergadura/2 e o nariz em +comprimento/2", () => {
    const spec = findAircraft("G450 / G550");
    const numbers = (silhouettePath(spec).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const ys = numbers.filter((_, index) => index % 2 === 1);
    const xs = numbers.filter((_, index) => index % 2 === 0);
    expect(Math.max(...ys)).toBeCloseTo(spec.wingspanM / 2, 1);
    expect(Math.max(...xs)).toBeCloseTo(spec.lengthM / 2, 1);
    expect(fuselageWidth(spec)).toBeGreaterThanOrEqual(2.2);
  });

  it("trijatos ganham a terceira nacele", () => {
    const twin = silhouettePath(findAircraft("Falcon 2000")).split("Z").length;
    const trijet = silhouettePath(findAircraft("Falcon 900XP")).split("Z").length;
    expect(trijet).toBe(twin + 1);
  });
});
