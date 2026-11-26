import Image from "next/image";
import { COLLECTIONS } from "@/lib/editorial";
import { tiers } from "@/lib/site-data";
import { SectionHeader } from "@/components/ui/SectionHeader";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

const TOTAL_RESIDENCES = tiers.reduce((sum, tier) => sum + tier.count, 0);

const TIER_MEDIA = {
  "Founder Estates": { src: "/media/mansion.jpg", alt: "Residência Founder Estate com hangar integrado" },
  "Runway Signature": { src: "/media/hangar-entry.jpg", alt: "Entrada de hangar privativo ligada à taxiway" },
  "Reserve Estates": { src: "/media/pool.jpg", alt: "Piscina com vista para o hangar central e a paisagem de lagos" },
} as const;

/**
 * Coleções residenciais em Bento assimétrico: Founder é a peça-âncora (duas linhas),
 * Runway Signature ocupa a faixa larga e Reserve fecha em formato compacto.
 * A barra de composição mostra as 60 residências na proporção real (12 / 30 / 18).
 */
export function Collections() {
  return (
    <section className={section.section} aria-labelledby="colecoes-titulo" data-surface="ivory">
      <div className={`${section.inner} ${section.wide}`}>
        <SectionHeader
          id="colecoes-titulo"
          title={COLLECTIONS.title}
          lede={`${TOTAL_RESIDENCES} residências em três coleções, cada uma com seu tipo de hangar e de acesso à pista.`}
          isSplit
        />
        <div className={styles.composition} role="img" aria-label="Composição das 60 residências: 12 Founder Estates, 30 Runway Signature e 18 Reserve Estates">
          {tiers.map((tier) => (
            <span key={tier.name} className={styles.compositionPart} style={{ flexGrow: tier.count }}>
              <span className="tnum">{tier.count}</span> {tier.name}
            </span>
          ))}
        </div>
        <ul className={styles.bento} role="list">
          {tiers.map((tier, index) => {
            const media = TIER_MEDIA[tier.name];
            return (
              <li key={tier.name} className={styles.tier} data-tier={index}>
                <div className={styles.tierMedia}>
                  <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1200px) 60vw, 100vw" quality={72} className={styles.cover} />
                </div>
                <div className={styles.tierBody}>
                  <h3 className={styles.tierName}>{tier.name}</h3>
                  <p className={styles.tierNote}>{tier.note}</p>
                  <dl className={styles.tierFacts}>
                    <div>
                      <dt>Unidades</dt>
                      <dd className="tnum">{tier.count}</dd>
                    </div>
                    <div>
                      <dt>Lote</dt>
                      <dd className="tnum">{tier.acres}</dd>
                    </div>
                    <div>
                      <dt>Área</dt>
                      <dd className="tnum">{tier.size}</dd>
                    </div>
                    <div>
                      <dt>Faixa</dt>
                      <dd className={`${styles.tierPrice} tnum`}>{tier.price}</dd>
                    </div>
                  </dl>
                  <p className={styles.tierHangar}>{tier.hangar}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
