import { AVIATION } from "@/lib/editorial";
import { aircraft } from "@/lib/site-data";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Plataforma aeronáutica: aeronaves críticas e infraestrutura, com entrada para o simulador. */
export function AviationTeaser() {
  return (
    <section className={section.section} aria-labelledby="aviacao-titulo" data-surface="void">
      <div className={section.inner}>
        <SectionHeader id="aviacao-titulo" index="Plataforma aeronáutica" title={AVIATION.title} />
        <div className={styles.aviation}>
          <div>
            <p className={styles.smallHeading}>Aeronaves críticas suportadas</p>
            <ul className={styles.chips} role="list">
              {aircraft.map((model) => (
                <li key={model} className={styles.chip}>
                  {model}
                </li>
              ))}
            </ul>
            <LinkButton href="/aviacao" variant="ghost">
              Abrir o simulador de pista & hangar
            </LinkButton>
          </div>
          <ol className={styles.infraList}>
            {AVIATION.infrastructure.map((item, index) => (
              <li key={item} className={styles.infraItem}>
                <span className={`${styles.infraIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
                <span className="tnum">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
