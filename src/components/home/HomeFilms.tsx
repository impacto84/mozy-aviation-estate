import { AmbientVideo } from "@/components/media/AmbientVideo";
import { LinkButton } from "@/components/ui/LinkButton";
import { AVIATION, CTA, DISCIPLINE } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { contact, days90 } from "@/lib/site-data";
import styles from "./Home.module.css";

/** Filme noturno: a pista acesa em banda de cinema, com a infraestrutura aeronáutica. */
export function NightFilm() {
  return (
    <section className={styles.film} aria-labelledby="noite-titulo" data-surface="void">
      <div className={styles.filmMedia}>
        <AmbientVideo src="/media/night.mp4" poster="/media/night.jpg" label="Filme: a pista privada à noite, com as luzes de borda e as residências acesas" />
        <div className={styles.filmShade} aria-hidden="true" />
      </div>
      <div className={styles.filmCopy}>
        <p className={styles.kicker}>Plataforma aeronáutica · operação 24/7</p>
        <h2 id="noite-titulo" className={styles.filmTitle}>
          {AVIATION.title}
        </h2>
        <ol className={styles.infra}>
          {AVIATION.infrastructure.map((item, index) => (
            <li key={item} className={styles.infraItem}>
              <span className={`${styles.ruleIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
              <span className="tnum">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Convite final: o filme de fechamento, os próximos 90 dias e o acesso privado ao Data Room. */
export function Closing() {
  return (
    <section id="convite" className={styles.closing} aria-labelledby="fechamento-titulo" data-surface="void">
      <div className={styles.filmMedia}>
        <AmbientVideo src="/media/closer.mp4" poster="/media/closer.jpg" label="Filme de fechamento: o jato da abertura cruzando a pista ao pôr do sol" />
        <div className={styles.closingShade} aria-hidden="true" />
      </div>
      <div className={styles.closingInner}>
        <div className={styles.invitation}>
          <p className={styles.kicker}>Convite privado · Data Room confidencial</p>
          <h2 id="fechamento-titulo" className={styles.closingTitle}>
            {DISCIPLINE.closing}
          </h2>
          <div className={styles.heroActions}>
            <LinkButton href={ACCESS_PATH} ctaRole="primary">
              {CTA.primary}
            </LinkButton>
            <LinkButton href={contact.phoneHref} variant="ghost">
              <span className="tnum">{contact.phone}</span>
            </LinkButton>
          </div>
        </div>
        <div className={styles.plan}>
          <p className={styles.kicker}>Próximos 90 dias</p>
          <p className={styles.planTitle}>{DISCIPLINE.days90Title}</p>
          <ol className={styles.rules}>
            {days90.map((step, index) => (
              <li key={step} className={styles.rule}>
                <span className={styles.ruleName}>
                  <span className={`${styles.ruleIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
