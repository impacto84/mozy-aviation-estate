import { TECH } from "@/lib/editorial";
import { tech } from "@/lib/site-data";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Tecnologia invisível: lista editorial em régua, não cartões. */
export function TechList() {
  return (
    <section className={section.section} aria-labelledby="tecnologia-titulo" data-surface="navy">
      <div className={`${section.inner} ${styles.tech}`}>
        <div className={styles.techIntro}>
          <p className={styles.smallHeading}>Tecnologia invisível</p>
          <h2 id="tecnologia-titulo" className={styles.techTitle}>
            {TECH.title}
          </h2>
        </div>
        <dl className={styles.techList}>
          {tech.map((item) => (
            <div key={item.n} className={styles.techRow}>
              <dt className={styles.techName}>
                <span className={`${styles.infraIndex} tnum`}>{item.n}</span>
                <span>{item.title}</span>
              </dt>
              <dd className={`${styles.techBody} tnum`}>{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
