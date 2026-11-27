import { LinkButton } from "@/components/ui/LinkButton";
import { CTA } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { contact } from "@/lib/site-data";
import styles from "./CtaBand.module.css";

interface CtaBandProps {
  readonly id: string;
  readonly title: string;
}

/** Faixa de conversão repetida ao fim das páginas internas (CTA-VISIBLE-MOBILE). */
export function CtaBand({ id, title }: CtaBandProps) {
  return (
    <section className={styles.band} aria-labelledby={id} data-surface="navy">
      <div className={styles.inner}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        <div className={styles.actions}>
          <LinkButton href={ACCESS_PATH}>{CTA.primary}</LinkButton>
          <LinkButton href={contact.emailHref} variant="ghost">
            {contact.email}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
