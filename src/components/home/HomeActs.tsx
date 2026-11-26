import Image from "next/image";
import { CinematicAct } from "@/components/chapter/CinematicAct";
import { LinkButton } from "@/components/ui/LinkButton";
import { CHAPTER_COPY, CONCEPT_CAPTION, CTA, HERO } from "@/lib/editorial";
import { findChapter, framePath } from "@/lib/chapters";
import type { ChapterId } from "@/lib/chapters";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { stats } from "@/lib/site-data";
import styles from "./Home.module.css";

/**
 * Pôster dos Atos II e III: o quadro nítido da própria sequência, servido direto do
 * arquivo WebP original (`unoptimized`: nada passa por `/_next/image`).
 */
function FramePoster({ id, alt }: { readonly id: ChapterId; readonly alt: string }) {
  const chapter = findChapter(id);
  return <Image src={framePath(chapter.dir, chapter.stillFrame)} alt={alt} width={chapter.width} height={chapter.height} sizes="100vw" unoptimized loading="lazy" />;
}

/**
 * Ato I — abertura em cinema. A própria primeira dobra é o palco: fotografia do
 * hero (LCP, `priority`, q88) no HTML do servidor com `<h1>`, telemetria e CTA; o
 * canvas da sequência `approach` entra em fusão com a rolagem.
 */
export function ActApproach() {
  const copy = CHAPTER_COPY.approach;
  return (
    <CinematicAct
      chapterId="approach"
      sectionId="ato-i"
      numeral="I"
      label="Aproximação"
      headingId="hero-title"
      poster={
        <Image
          className={styles.heroPoster}
          data-forja-poster=""
          src="/media/hero.jpg"
          alt="Jato executivo na pista privada ao pôr do sol, com as residências e hangares ao lado"
          width={1920}
          height={1088}
          sizes="(max-width: 767px) 300vw, (max-width: 1199px) 180vw, 100vw"
          quality={88}
          priority
        />
      }
      opening={
        <div className={styles.heroCopy} data-forja-allow-hidden="">
          <p className={styles.heroKicker}>{HERO.kicker}</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            {HERO.title}
          </h1>
          <p className={styles.heroLead}>{HERO.body}</p>
          <div className={styles.heroActions}>
            <LinkButton href={ACCESS_PATH} ctaRole="primary">
              {CTA.primary}
            </LinkButton>
            <LinkButton href="/aviacao" variant="ghost" ctaRole="secondary">
              {CTA.aviation}
            </LinkButton>
          </div>
          <p className={styles.caption}>{CONCEPT_CAPTION}</p>
        </div>
      }
      mid={copy.mid}
      arrival={{ kicker: copy.intro.kicker, title: copy.intro.title, body: "Premissa inicial de 3.000 × 45 m, sujeita a estudo e aprovação." }}
      telemetry={
        <dl className={styles.telemetry} aria-label="Números-chave do empreendimento">
          {stats.map((stat) => (
            <div key={stat.label} className={styles.telemetryItem}>
              <dt className={styles.telemetryLabel}>{stat.label}</dt>
              <dd className={`${styles.telemetryValue} tnum`}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      }
    />
  );
}

interface ActOpeningProps {
  readonly id: string;
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
}

function ActOpening({ id, kicker, title, body }: ActOpeningProps) {
  return (
    <div className={styles.actOpening} data-forja-allow-hidden="">
      <p className={styles.heroKicker}>{kicker}</p>
      <h2 id={id} className={styles.actTitle}>
        {title}
      </h2>
      <p className={styles.heroLead}>{body}</p>
      <p className={styles.caption}>{CONCEPT_CAPTION}</p>
    </div>
  );
}

/** Ato II — The Founder Residence: da entrada da casa ao living com vista para o hangar. */
export function ActVilla() {
  const copy = CHAPTER_COPY.villa;
  return (
    <CinematicAct
      chapterId="villa"
      sectionId="ato-ii"
      numeral="II"
      label="Founder Residence"
      headingId="ato-residencia"
      poster={<FramePoster id="villa" alt="Living da Founder Residence com a pista e o hangar do outro lado do vidro" />}
      opening={<ActOpening id="ato-residencia" kicker={`Ato II · The Founder Residence · ${copy.intro.kicker}`} title={copy.intro.title} body={copy.intro.body} />}
      mid={copy.mid}
      arrival={copy.arrival}
    />
  );
}

/** Ato III — Private Hangar & Apron: da taxiway ao nariz da aeronave, dentro do hangar. */
export function ActHangar() {
  const copy = CHAPTER_COPY.hangar;
  return (
    <CinematicAct
      chapterId="hangar"
      sectionId="ato-iii"
      numeral="III"
      label="Hangar & Apron"
      headingId="ato-hangar"
      poster={<FramePoster id="hangar" alt="Interior do hangar privativo com o jato estacionado sobre o piso claro" />}
      opening={<ActOpening id="ato-hangar" kicker={`Ato III · Private Hangar & Apron · ${copy.intro.kicker}`} title={copy.intro.title} body={copy.intro.body} />}
      mid={copy.mid}
      arrival={copy.arrival}
    />
  );
}
