import { DISCIPLINE } from "@/lib/editorial";
import { capital } from "@/lib/site-data";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Escala de capital por fase, com o aviso legal obrigatório e o caminho para a tese. */
export function CapitalTeaser() {
  const total = capital.at(-1);
  const phases = capital.slice(0, -1);
  return (
    <section className={section.section} aria-labelledby="capital-titulo" data-surface="void">
      <div className={section.inner}>
        <SectionHeader id="capital-titulo" title={DISCIPLINE.scaleTitle} lede={total === undefined ? undefined : `${total.label}: ${total.range}.`} isSplit />
        <ol className={styles.phases}>
          {phases.map((phase, index) => (
            <li key={phase.range} className={styles.phase}>
              <span className={`${styles.phaseIndex} tnum`}>Fase {index + 1}</span>
              <span className={`${styles.phaseRange} tnum`}>{phase.range}</span>
              <span className={styles.phaseLabel}>{phase.label}</span>
            </li>
          ))}
        </ol>
        {total === undefined ? null : (
          <p className={styles.phaseTotal}>
            <span className="tnum">{total.range}</span> {total.label.toLowerCase()}
          </p>
        )}
        <p className={section.note}>{DISCIPLINE.capitalDisclaimer}</p>
        <div className={styles.rowActions}>
          <LinkButton href="/tese-capital" variant="ghost">
            Estrutura, stage-gates e governança
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
