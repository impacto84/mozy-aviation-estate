// @vitest-environment node
import { describe, expect, it } from "vitest";
import { lands } from "@/lib/site-data";
import { DETAIL_VIEWS, FLY_TO_SCALE, OVERVIEW, detailImage, findLand, flyToOrigin, percentValue } from "./atlas-model";

describe("Atlas Satelital", () => {
  it("preserva os três terrenos do brief com área e preço", () => {
    expect(lands.map((land) => [land.name, land.acres, land.price])).toEqual([
      ["Honey Bee Ranch", "1.100 acres", "Sob consulta"],
      ["Peace River Legacy East", "1.693 acres", "$10,0M · $5.907/acre"],
      ["Osceola Ranch", "1.230 acres", "$5,5M · $4.472/acre"],
    ]);
  });

  it("fly-to mergulha 4,4× a partir do marcador do terreno", () => {
    expect(FLY_TO_SCALE).toBe(4.4);
    expect(flyToOrigin(findLand("honey"))).toBe("75.1% 17.7%");
    expect(OVERVIEW.src).toBe("/media/sat/overview-marked.jpg");
  });

  it("cada vista de detalhe usa a imagem real do terreno", () => {
    const peace = findLand("peace");
    expect(DETAIL_VIEWS.map((view) => detailImage(peace, view.id).src)).toEqual([
      "/media/sat/peace-wide.jpg",
      "/media/sat/peace-close.jpg",
      "/media/listing-peace.jpg",
    ]);
    expect(detailImage(findLand("osceola"), "photo").height).toBe(1116);
  });

  it("percentValue limita e trata valor inválido", () => {
    expect(percentValue("75.1%")).toBe(75.1);
    expect(percentValue("abc")).toBe(50);
    expect(percentValue("140%")).toBe(100);
    expect(() => findLand("x" as never)).toThrow("Terreno desconhecido");
  });
});
