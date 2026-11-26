import type { Metadata } from "next";
import { SatelliteAtlas } from "@/components/atlas/SatelliteAtlas";
import { PageHero } from "@/components/page/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { CorridorsTable, GatesRail, RegulatorsMatrix, ScorecardBars } from "@/components/sections/DataBlocks";
import sections from "@/components/sections/Sections.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import section from "@/components/ui/Section.module.css";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CTA, DISCIPLINE, LANDS, LANDS_HERO, LEGAL } from "@/lib/editorial";
import { placeJsonLd } from "@/lib/martech/seo/json-ld";
import type { JsonLdNode } from "@/lib/martech/seo/json-ld";
import { buildPageMetadata } from "@/lib/martech/seo/metadata";
import { ACCESS_PATH, SITE_NAME } from "@/lib/martech/seo/site";
import { days90, lands } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = buildPageMetadata({
  title: "Terrenos: Atlas Satelital da Central Florida e scorecard",
  description:
    "Honey Bee Ranch, Peace River Legacy East e Osceola Ranch em satélite real, corredores regionais, seis frentes de aprovação e scorecard ponderado.",
  path: "/terrenos",
  siteName: SITE_NAME,
});

function landsJsonLd(): readonly JsonLdNode[] {
  const url = `${siteUrl()}/terrenos`;
  return lands.map((land) =>
    placeJsonLd({
      type: "Place",
      name: land.name,
      description: `${land.priority} · ${land.acres} · ${land.zoning}. ${land.note}`,
      url,
      address: { addressLocality: land.place.split("·")[1]?.trim(), addressRegion: "FL", addressCountry: "US" },
    }),
  );
}

export default function LandsPage() {
  return (
    <>
      <JsonLd data={landsJsonLd()} />
      <PageHero
        kicker="Terrenos · originação na Central Florida"
        title="Três terrenos. Um só critério: risco ajustado."
        lead={LANDS_HERO}
        image={{ src: "/media/estate-aerial.jpg", width: 1800, height: 1350 }}
        primaryCta={{ href: ACCESS_PATH, label: CTA.primary }}
        secondaryCta={{ href: "#atlas", label: "Abrir o Atlas Satelital" }}
        facts={[
          { label: "faixa-alvo de área", value: "1.200–1.800 acres" },
          { label: "terrenos candidatos", value: String(lands.length) },
          { label: "corredores regionais", value: "4" },
          { label: "stage-gates até o capital", value: "0–6" },
        ]}
      />

      <section id="atlas" className={section.section} aria-labelledby="atlas-titulo" data-surface="navy">
        <div className={`${section.inner} ${section.wide}`}>
          <SectionHeader
            id="atlas-titulo"
            index="Atlas Satelital"
            title={LANDS.title}
            lede="Alterne entre o satélite regional, o satélite aproximado e a foto do anúncio de cada terreno. Status de anúncios verificado em agosto de 2026."
            isSplit
          />
          <SatelliteAtlas />
          <p className={section.note}>{LEGAL.disclaimer}</p>
        </div>
      </section>

      <section className={section.section} aria-labelledby="corredores-titulo" data-surface="ivory">
        <div className={section.inner}>
          <SectionHeader id="corredores-titulo" title="Quatro corredores, ordenados por tese e por risco." isSplit lede="Conectividade com MCO, SFB, Lake Nona, Tampa e a cultura aeronáutica de Ocala." />
          <CorridorsTable />
        </div>
      </section>

      <section className={section.section} aria-labelledby="scorecard-titulo" data-surface="ivory">
        <div className={section.inner}>
          <SectionHeader id="scorecard-titulo" index="Scorecard de seleção" title={DISCIPLINE.scorecardTitle} isSplit lede="Seis critérios com peso fixo. O espaço aéreo e o encaixe da pista pesam mais do que o preço por acre." />
          <ScorecardBars />
        </div>
      </section>

      <section className={section.section} aria-labelledby="reguladores-titulo" data-surface="void">
        <div className={section.inner}>
          <SectionHeader id="reguladores-titulo" title={DISCIPLINE.regulatorsTitle} isSplit lede="Aprovações conduzidas em paralelo; nenhuma, sozinha, garante o empreendimento." />
          <RegulatorsMatrix />
        </div>
      </section>

      <section className={section.section} aria-labelledby="gates-titulo" data-surface="navy">
        <div className={section.inner}>
          <SectionHeader id="gates-titulo" title={DISCIPLINE.title} />
          <GatesRail />
        </div>
      </section>

      <section className={section.section} aria-labelledby="noventa-titulo" data-surface="void">
        <div className={`${section.inner} ${sections.split}`}>
          <h2 id="noventa-titulo" className={section.title}>
            {DISCIPLINE.days90Title}
          </h2>
          <ol className={sections.ruled}>
            {days90.map((step, index) => (
              <li key={step} className={sections.ruledItem}>
                <span className={`${sections.ruledIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                <span className={sections.ruledTitle}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand id="terrenos-cta" title="Detalhes de diligência dos terrenos, como APNs, são tratados no Data Room confidencial." />
    </>
  );
}
