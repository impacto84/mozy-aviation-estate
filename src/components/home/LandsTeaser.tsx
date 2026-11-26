import Image from "next/image";
import { LANDS } from "@/lib/editorial";
import { lands } from "@/lib/site-data";
import { LinkButton } from "@/components/ui/LinkButton";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Terrenos candidatos: satélite real com os três sítios e a fila de prioridade. */
export function LandsTeaser() {
  return (
    <section className={section.section} aria-labelledby="terrenos-titulo" data-surface="ivory">
      <div className={`${section.inner} ${section.wide} ${styles.lands}`}>
        <figure className={styles.landsMap}>
          <Image
            src="/media/sat/overview-marked.jpg"
            alt="Satélite da Flórida Central com os três terrenos candidatos marcados"
            width={1920}
            height={1400}
            sizes="(min-width: 1200px) 55vw, 100vw"
            quality={72}
            className={styles.landsImage}
          />
          <figcaption className={styles.figcaption}>Satélite real · Flórida Central</figcaption>
        </figure>
        <div className={styles.landsCopy}>
          <h2 id="terrenos-titulo" className={section.title}>
            {LANDS.title}
          </h2>
          <ol className={styles.landsList}>
            {lands.map((land) => (
              <li key={land.id} className={styles.landRow}>
                <span className={styles.landPriority}>{land.priority}</span>
                <span className={styles.landName}>{land.name}</span>
                <span className={`${styles.landFacts} tnum`}>
                  {land.acres} · {land.price}
                </span>
              </li>
            ))}
          </ol>
          <LinkButton href="/terrenos" variant="ghost">
            Abrir o Atlas Satelital
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
