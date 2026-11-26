import { AmbientVideo } from "@/components/media/AmbientVideo";
import { LinkButton } from "@/components/ui/LinkButton";
import { CTA, DISCIPLINE } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { contact, days90 } from "@/lib/site-data";
import styles from "./Home.module.css";

/** Fechamento: os próximos 90 dias, a frase de chegada e o acesso ao Data Room. */
export function Closing() {
  return (
    <section className={styles.closing} aria-labelledby="fechamento-titulo" data-surface="void">
      <div className={styles.nightMedia}>
        <AmbientVideo src="/media/closer.mp4" poster="/media/closer.jpg" label="O jato da abertura cruzando a pista" />
        <div className={styles.closingShade} aria-hidden="true" />
      </div>
      <div className={styles.closingInner}>
        <div className={styles.closingPlan}>
          <p className={styles.smallHeading}>Próximos 90 dias</p>
          <p className={styles.closingPlanTitle}>{DISCIPLINE.days90Title}</p>
          <ol className={styles.days}>
            {days90.map((step, index) => (
              <li key={step} className={styles.day}>
                <span className={`${styles.infraIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.closingCta}>
          <h2 id="fechamento-titulo" className={styles.closingTitle}>
            {DISCIPLINE.closing}
          </h2>
          <div className={styles.rowActions}>
            <LinkButton href={ACCESS_PATH} ctaRole="secondary">
              {CTA.primary}
            </LinkButton>
            <LinkButton href={contact.phoneHref} variant="ghost">
              <span className="tnum">{contact.phone}</span>
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
