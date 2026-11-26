import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { BRAND, COLLECTIONS, CONCEPT_CAPTION, CLUB, HANGAR_HOME, HERO, SPONSOR, TECH, VISION } from "@/lib/editorial";
import { contact, stats, tech, tiers } from "@/lib/site-data";
import styles from "./Home.module.css";

const TOTAL_RESIDENCES = tiers.reduce((sum, tier) => sum + tier.count, 0);

const TIER_MEDIA = {
  "Founder Estates": { src: "/media/mansion.jpg", alt: "Founder Estate com piscina de borda infinita, hangar integrado e jato na plataforma" },
  "Runway Signature": { src: "/media/interior.jpg", alt: "Living de pé-direito duplo aberto para o hangar privativo, com o jato estacionado" },
  "Reserve Estates": { src: "/media/pool.jpg", alt: "Espelho d’água ao entardecer com vista para o hangar central e a paisagem de lagos" },
} as const;

/** Tese: a frase da marca em escala editorial e a ficha técnica em mono. */
export function Thesis() {
  return (
    <section className={styles.thesis} aria-labelledby="tese-titulo" data-surface="void">
      <div className={styles.inner}>
        <p className={styles.kicker}>A tese · {BRAND.region}</p>
        <h2 id="tese-titulo" className={styles.statement}>
          {VISION.title}
        </h2>
        <div className={styles.thesisGrid}>
          <p className={styles.thesisBody}>{HERO.positioning}</p>
          <div className={styles.thesisAside}>
            <p className={styles.meta}>
              Sponsor · {BRAND.sponsor} · {BRAND.sponsorDetail}
            </p>
            <LinkButton href="/tese-capital" variant="text">
              Ler a tese de capital
            </LinkButton>
          </div>
        </div>
        <dl className={styles.ledger}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.ledgerItem}>
              <dt className={styles.ledgerLabel}>{stat.label}</dt>
              <dd className={`${styles.ledgerValue} tnum`}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Coleções: três produtos em fotografia editorial de sangria, dados em mono. */
export function Collections() {
  return (
    <section className={styles.collections} aria-labelledby="colecoes-titulo" data-surface="navy">
      <div className={styles.inner}>
        <p className={styles.kicker}>Coleções residenciais · {TOTAL_RESIDENCES} residências</p>
        <h2 id="colecoes-titulo" className={styles.sectionTitle}>
          {COLLECTIONS.title}
        </h2>
        <div className={styles.composition} role="img" aria-label="Composição das 60 residências: 12 Founder Estates, 30 Runway Signature e 18 Reserve Estates">
          {tiers.map((tier) => (
            <span key={tier.name} className={styles.compositionPart} data-tier={tier.name === "Runway Signature" ? "core" : "edge"} style={{ flexGrow: tier.count }}>
              <span className="tnum">{tier.count}</span> {tier.name}
            </span>
          ))}
        </div>
      </div>
      <ol className={styles.tiers} role="list">
        {tiers.map((tier, index) => {
          const media = TIER_MEDIA[tier.name];
          return (
            <li key={tier.name} className={styles.tier} data-side={index % 2 === 0 ? "left" : "right"}>
              <figure className={styles.tierMedia}>
                <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1200px) 62vw, 100vw" quality={88} className={styles.cover} />
                <figcaption className={styles.mediaCaption}>{CONCEPT_CAPTION}</figcaption>
              </figure>
              <div className={styles.tierBody}>
                <p className={`${styles.tierIndex} tnum`}>{String(index + 1).padStart(2, "0")} / 03</p>
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
      </ol>
    </section>
  );
}

/** Prelúdio do Ato II: a entrada e o interior da casa de Orlando, em díptico de sangria. */
export function ResidencePrelude() {
  return (
    <div className={styles.diptych} data-surface="void">
      <figure className={styles.diptychFigure} data-shape="tall">
        <Image src="/media/orlando-entrance.jpg" alt="Entrada da residência em pedra clara sob carvalhos, com o hangar e o jato ao fundo" fill sizes="(min-width: 768px) 50vw, 100vw" quality={88} className={styles.cover} />
        <figcaption className={styles.mediaCaption}>Orlando · entrada · {CONCEPT_CAPTION}</figcaption>
      </figure>
      <figure className={styles.diptychFigure} data-shape="offset">
        <Image src="/media/orlando-interior.jpg" alt="Living com portas de vidro abertas para a taxiway e o jato estacionado diante do hangar" fill sizes="(min-width: 768px) 50vw, 100vw" quality={88} className={styles.cover} />
        <figcaption className={styles.mediaCaption}>Orlando · living · {CONCEPT_CAPTION}</figcaption>
      </figure>
    </div>
  );
}

/** Casa + hangar: duas fotografias que preparam o Ato III. */
export function HangarPrelude() {
  return (
    <section className={styles.hangarPrelude} aria-labelledby="hangar-titulo" data-surface="void">
      <figure className={styles.hangarMain}>
        <Image src="/media/hangar-dual.jpg" alt="Hangar integrado à residência, com o jato sobre o piso espelhado e a mata ao fundo" fill sizes="(min-width: 1200px) 66vw, 100vw" quality={88} className={styles.cover} />
        <figcaption className={styles.mediaCaption}>{CONCEPT_CAPTION}</figcaption>
      </figure>
      <div className={styles.hangarCopy}>
        <p className={styles.kicker}>Casa + hangar</p>
        <h2 id="hangar-titulo" className={styles.sectionTitle}>
          {HANGAR_HOME.title}
        </h2>
        <p className={styles.bodyText}>{HANGAR_HOME.body}</p>
        <figure className={styles.hangarSecond}>
          <Image src="/media/hangar-entry.jpg" alt="Jato diante do hangar envidraçado da residência ao entardecer" fill sizes="(min-width: 1200px) 30vw, 100vw" quality={88} className={styles.cover} />
        </figure>
      </div>
    </section>
  );
}

/** Aviation Club: fotografia em sangria total com o título em escala de capa. */
export function ClubBand() {
  return (
    <section className={styles.club} aria-labelledby="club-titulo" data-surface="void">
      <Image className={styles.bandImage} src="/media/club.jpg" alt="Aviation Club ao entardecer, lounge envidraçado diante da pista" fill sizes="100vw" quality={88} />
      <div className={styles.bandShade} aria-hidden="true" />
      <div className={styles.clubCopy}>
        <p className={styles.kicker}>Aviation Club</p>
        <h2 id="club-titulo" className={styles.clubTitle}>
          {CLUB.title}
        </h2>
        <p className={styles.clubAmenities}>{CLUB.amenities}</p>
        <p className={styles.caption}>{CONCEPT_CAPTION}</p>
      </div>
    </section>
  );
}

/** Tecnologia invisível: régua editorial, não cartões. */
export function TechList() {
  return (
    <section className={styles.ruledSection} aria-labelledby="tecnologia-titulo" data-surface="navy">
      <div className={`${styles.inner} ${styles.split}`}>
        <div>
          <p className={styles.kicker}>Tecnologia invisível</p>
          <h2 id="tecnologia-titulo" className={styles.sectionTitle}>
            {TECH.title}
          </h2>
        </div>
        <dl className={styles.rules}>
          {tech.map((item) => (
            <div key={item.n} className={styles.rule}>
              <dt className={styles.ruleName}>
                <span className={`${styles.ruleIndex} tnum`}>{item.n}</span>
                {item.title}
              </dt>
              <dd className={`${styles.ruleBody} tnum`}>{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Sponsor: quem executa, com os papéis declarados. */
export function Sponsor() {
  return (
    <section className={styles.ruledSection} aria-labelledby="sponsor-titulo" data-surface="navy">
      <div className={`${styles.inner} ${styles.split}`}>
        <div className={styles.sponsorIdentity}>
          <Image src="/media/logo.png" alt="Logotipo MOZY Construction" width={534} height={380} sizes="160px" className={styles.sponsorLogo} />
          <p className={styles.sponsorName}>{BRAND.sponsor}</p>
          <p className={styles.meta}>{BRAND.sponsorDetail}</p>
          <p className={styles.meta}>{contact.address}</p>
          <p className={styles.meta}>{BRAND.sponsorRegion}</p>
        </div>
        <div>
          <h2 id="sponsor-titulo" className={styles.sectionTitle}>
            {SPONSOR.title}
          </h2>
          <ol className={styles.rules}>
            {SPONSOR.roles.map((role, index) => (
              <li key={role} className={styles.rule}>
                <span className={styles.ruleName}>
                  <span className={`${styles.ruleIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                  {role}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
