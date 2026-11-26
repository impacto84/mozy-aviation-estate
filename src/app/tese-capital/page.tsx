import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page/PageHero";
import { CapitalPhases, CapitalStack, EntitiesRow, RevenueGrid, RiskList, TimelineGantt } from "@/components/sections/CapitalBlocks";
import { CtaBand } from "@/components/sections/CtaBand";
import { GatesRail } from "@/components/sections/DataBlocks";
import sections from "@/components/sections/Sections.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import section from "@/components/ui/Section.module.css";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BRAND, CONCEPT_CAPTION, CTA, DISCIPLINE, SPONSOR, TECH } from "@/lib/editorial";
import { faqPageJsonLd } from "@/lib/martech/seo/json-ld";
import { buildPageMetadata } from "@/lib/martech/seo/metadata";
import { ACCESS_PATH, SITE_NAME } from "@/lib/martech/seo/site";
import { contact, tech } from "@/lib/site-data";
import styles from "./page.module.css";
import { CAPITAL_FAQ } from "./faq";

export const metadata: Metadata = buildPageMetadata({
  title: "Tese de capital: fases, stack, stage-gates e governança",
  description:
    "Faixa de investimento de $550M–$1,0B+ em fases, capital stack, stage-gates 0–6, cinco veículos societários, seis receitas e cronograma de 0–84 meses.",
  path: "/tese-capital",
  siteName: SITE_NAME,
});

export default function CapitalPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(CAPITAL_FAQ)} />
      <PageHero
        kicker="Tese de capital · estrutura e governança"
        title="Capital que entra por gates."
        lead="Quatro faixas de capital, de $10–50M+ em controle, terreno e entitlements a $550M–$1,0B+ construídos, liberadas gate a gate, com HoldCo, DevCo, Airport OpCo e Club separando desenvolvimento, ativos e operação."
        image={{ src: "/media/estate-dusk.jpg", width: 1672, height: 942, position: "right" }}
        primaryCta={{ href: ACCESS_PATH, label: CTA.primary }}
        secondaryCta={{ href: "#fases", label: "Ver as fases" }}
        caption={CONCEPT_CAPTION}
        facts={[
          { label: "faixa de investimento construída", value: "$550M–$1,0B+" },
          { label: "cronograma do plano", value: "0–84 meses" },
          { label: "stage-gates", value: "0–6" },
          { label: "veículos societários", value: "5" },
        ]}
      />

      <section id="fases" className={section.section} aria-labelledby="fases-titulo" data-surface="void">
        <div className={section.inner}>
          <SectionHeader id="fases-titulo" title={DISCIPLINE.scaleTitle} lede="Três fases de implantação somam a faixa de investimento construída." isSplit />
          <CapitalPhases />
        </div>
      </section>

      <figure className={styles.band}>
        <Image className={styles.bandImage} src="/media/sat/overview.jpg" alt="Satélite real da Central Florida, região dos três terrenos candidatos" fill sizes="100vw" quality={88} />
        <figcaption className={styles.bandCaption}>
          <span className={styles.bandKicker}>Satélite real · Central Florida</span>
          <span className={styles.bandText}>O capital entra sobre terra real: cada gate é medido em terrenos candidatos, não em render.</span>
        </figcaption>
      </figure>

      <section className={section.section} aria-labelledby="stack-titulo" data-surface="dossier">
        <div className={`${section.inner} ${sections.split}`}>
          <div>
            <h2 id="stack-titulo" className={section.title}>
              {DISCIPLINE.stackTitle}
            </h2>
            <p className={section.lede}>Faixas indicativas por fonte de capital, no eixo de 0 a 60% do total.</p>
          </div>
          <CapitalStack />
        </div>
      </section>

      <section className={section.section} aria-labelledby="cronograma-titulo" data-surface="navy">
        <div className={section.inner}>
          <SectionHeader id="cronograma-titulo" title={DISCIPLINE.timelineTitle} lede="Janelas sobrepostas: aprovação, implantação e entrega correm em paralelo." isSplit />
          <TimelineGantt />
        </div>
      </section>

      <section className={section.section} aria-labelledby="gates-capital-titulo" data-surface="void">
        <div className={section.inner}>
          <SectionHeader id="gates-capital-titulo" title={DISCIPLINE.title} />
          <GatesRail />
        </div>
      </section>

      <section className={section.section} aria-labelledby="estrutura-titulo" data-surface="dossier">
        <div className={section.inner}>
          <SectionHeader id="estrutura-titulo" title={DISCIPLINE.entitiesTitle} />
          <EntitiesRow />
        </div>
      </section>

      <section className={section.section} aria-labelledby="receita-titulo" data-surface="navy">
        <div className={section.inner}>
          <SectionHeader id="receita-titulo" title={DISCIPLINE.revenuesTitle} />
          <RevenueGrid />
        </div>
      </section>

      <section className={section.section} aria-labelledby="riscos-titulo" data-surface="void">
        <div className={section.inner}>
          <SectionHeader id="riscos-titulo" title={DISCIPLINE.risksTitle} />
          <RiskList />
        </div>
      </section>

      <section className={section.section} aria-labelledby="tecnologia-capital-titulo" data-surface="dossier">
        <div className={`${section.inner} ${sections.split}`}>
          <h2 id="tecnologia-capital-titulo" className={section.title}>
            {TECH.title}
          </h2>
          <ol className={sections.ruled}>
            {tech.map((item) => (
              <li key={item.n} className={sections.ruledItem}>
                <span className={`${sections.ruledIndex} tnum`}>{item.n}</span>
                <span className={sections.ruledContent}>
                  <span className={sections.ruledTitle}>{item.title}</span>
                  <span className={`${sections.ruledBody} tnum`}>{item.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={section.section} aria-labelledby="sponsor-capital-titulo" data-surface="navy">
        <div className={`${section.inner} ${sections.split}`}>
          <div className={sections.stackHeader}>
            <h2 id="sponsor-capital-titulo" className={section.title}>
              {SPONSOR.title}
            </h2>
            <p className={section.lede}>
              {BRAND.sponsor} · {BRAND.sponsorDetail}
            </p>
            <p className={styles.address}>{contact.address}</p>
          </div>
          <ul className={sections.ruled} role="list">
            {SPONSOR.roles.map((role) => (
              <li key={role} className={styles.role}>
                {role}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={section.section} aria-labelledby="faq-titulo" data-surface="void">
        <div className={`${section.inner} ${sections.split}`}>
          <h2 id="faq-titulo" className={section.title}>
            Perguntas frequentes de investidores.
          </h2>
          <div className={styles.faq}>
            {CAPITAL_FAQ.map((entry) => (
              <details key={entry.question} className={styles.faqItem} name="faq-capital">
                <summary className={styles.faqQuestion}>{entry.question}</summary>
                <p className={`${styles.faqAnswer} tnum`}>{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand id="capital-cta" title="Aprofunde a tese de capital no Data Room confidencial." />
    </>
  );
}
