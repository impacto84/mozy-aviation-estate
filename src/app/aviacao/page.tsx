import type { Metadata } from "next";
import Image from "next/image";
import { FleetSimulator } from "@/components/aviation/FleetSimulator";
import { PageHero } from "@/components/page/PageHero";
import { BenchmarksTable } from "@/components/sections/Benchmarks";
import { CtaBand } from "@/components/sections/CtaBand";
import sections from "@/components/sections/Sections.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import section from "@/components/ui/Section.module.css";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AVIATION, BENCHMARKS, CLUB, CONCEPT_CAPTION, CTA } from "@/lib/editorial";
import { placeJsonLd } from "@/lib/martech/seo/json-ld";
import { buildPageMetadata } from "@/lib/martech/seo/metadata";
import { ACCESS_PATH, SITE_NAME } from "@/lib/martech/seo/site";
import { aircraft } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = buildPageMetadata({
  title: "Aviação: pista, taxiway, hangares e simulador de frota",
  description:
    "Pista de 3.000 × 45 m (premissa inicial), taxiway paralelo, hangares por coleção e simulador interativo com as seis aeronaves críticas suportadas.",
  path: "/aviacao",
  siteName: SITE_NAME,
});

function aviationJsonLd() {
  return placeJsonLd({
    type: "Place",
    name: "Pista privada e Aviation Club — MOZY Private Aviation Estate",
    description: "Pista de 3.000 × 45 m como premissa inicial, taxiway paralelo, terminal privado, apron e hangares. IFR / GPS sujeito à aprovação.",
    url: `${siteUrl()}/aviacao`,
    containedIn: "Orlando · Central Florida",
  });
}

export default function AviationPage() {
  return (
    <>
      <JsonLd data={aviationJsonLd()} />
      <PageHero
        kicker="Aviação · pista, taxiway e hangares"
        title="A pista como extensão da casa."
        lead={AVIATION.title}
        image={{ src: "/media/taxiway.jpg", width: 1792, height: 1008, position: "right" }}
        primaryCta={{ href: ACCESS_PATH, label: CTA.primary }}
        secondaryCta={{ href: "#simulador", label: "Abrir o simulador" }}
        caption={CONCEPT_CAPTION}
        facts={[
          { label: "pista como premissa inicial", value: "3.000 × 45 m" },
          { label: "aeronaves críticas suportadas", value: String(aircraft.length) },
          { label: "residências com hangar", value: "60" },
          { label: "operação, concierge e segurança", value: "24/7" },
        ]}
      />

      <section id="simulador" className={section.section} aria-labelledby="simulador-titulo" data-surface="navy">
        <div className={`${section.inner} ${section.wide}`}>
          <SectionHeader
            id="simulador-titulo"
            index="Simulador de pista & hangar"
            title="Escolha a aeronave e a coleção. Siga o táxi da pista ao hangar."
            lede="Cada coleção tem um tipo de hangar: múltiplas aeronaves nas Founder Estates, hangar privativo com taxiway na Runway Signature e hangar central nas Reserve Estates."
            isSplit
          />
          <FleetSimulator />
        </div>
      </section>

      <section className={section.section} aria-labelledby="infra-titulo" data-surface="ivory">
        <div className={`${section.inner} ${sections.split}`}>
          <div>
            <h2 id="infra-titulo" className={section.title}>
              Infraestrutura aeronáutica, sujeita a aprovação.
            </h2>
            <p className={section.lede}>Aeronaves críticas: {aircraft.join(" · ")}.</p>
          </div>
          <ol className={sections.ruled}>
            {AVIATION.infrastructure.map((item, index) => (
              <li key={item} className={sections.ruledItem}>
                <span className={`${sections.ruledIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                <span className={`${sections.ruledTitle} tnum`}>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={section.section} aria-labelledby="masterplan-titulo" data-surface="void">
        <div className={`${section.inner} ${section.wide}`}>
          <SectionHeader id="masterplan-titulo" title={AVIATION.masterplanTitle} isSplit lede={AVIATION.masterplanNote} />
          <div className={`${sections.split}`}>
            <figure className={sections.figure}>
              <Image
                className={sections.figureImage}
                src="/media/masterplan.jpg"
                alt="Master plan conceitual: pista, taxiway, 60 estates, Aviation Club e preservação"
                width={1536}
                height={1024}
                sizes="(min-width: 1200px) 58vw, 100vw"
                quality={72}
              />
            </figure>
            <figure className={sections.figure}>
              <Image
                className={sections.figureImage}
                src="/media/masterplan-diagram.jpg"
                alt="Diagrama do master plan com a organização entre pista, residências e serviços"
                width={753}
                height={652}
                sizes="(min-width: 1200px) 34vw, 100vw"
                quality={72}
              />
              <ul className={sections.legend} role="list">
                {AVIATION.masterplanLabels.map((label) => (
                  <li key={label} className={sections.legendItem}>
                    {label}
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </div>
      </section>

      <section className={section.section} aria-labelledby="benchmarks-titulo" data-surface="ivory">
        <div className={section.inner}>
          <SectionHeader id="benchmarks-titulo" title={BENCHMARKS.title} lede="Quatro referências diretas e o que cada uma ensina ao projeto." isSplit />
          <BenchmarksTable />
        </div>
      </section>

      <section className={section.section} aria-labelledby="club-aviacao-titulo" data-surface="void">
        <div className={`${section.inner} ${section.wide}`}>
          <SectionHeader id="club-aviacao-titulo" index="Aviation Club" title={CLUB.title} lede={CLUB.amenities} isSplit />
          <div className={sections.photoGrid}>
            <div className={sections.photo}>
              <Image className={sections.cover} src="/media/club.jpg" alt="Aviation Club ao entardecer" fill sizes="(min-width: 768px) 66vw, 100vw" quality={72} />
            </div>
            <div className={sections.photo}>
              <Image className={sections.cover} src="/media/orlando-interior.jpg" alt="Interior residencial integrado à paisagem" fill sizes="(min-width: 768px) 33vw, 100vw" quality={72} />
            </div>
            <div className={sections.photo}>
              <Image className={sections.cover} src="/media/interior.jpg" alt="Interior residencial com vista para o hangar" fill sizes="(min-width: 768px) 33vw, 100vw" quality={72} />
            </div>
          </div>
        </div>
      </section>

      <CtaBand id="aviacao-cta" title="Aprofunde a tese aeronáutica no Data Room confidencial." />
    </>
  );
}
