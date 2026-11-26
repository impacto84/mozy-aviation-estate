import { BRAND, HERO, VISION } from "@/lib/editorial";
import { LinkButton } from "@/components/ui/LinkButton";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Visão: a frase da marca em escala editorial, com o posicionamento ao lado. */
export function Vision() {
  return (
    <section className={section.section} aria-labelledby="visao-titulo" data-surface="navy">
      <div className={`${section.inner} ${styles.vision}`}>
        <h2 id="visao-titulo" className={styles.visionStatement}>
          {VISION.title}
        </h2>
        <div className={styles.visionAside}>
          <p className={styles.visionBody}>{HERO.positioning}</p>
          <p className={styles.visionSponsor}>
            Sponsor: {BRAND.sponsor} · {BRAND.region}
          </p>
          <LinkButton href="/tese-capital" variant="text">
            Ler a tese de capital
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
