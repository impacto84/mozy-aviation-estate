import { SatelliteAtlas } from "@/components/atlas/SatelliteAtlas";
import { FleetSimulator } from "@/components/aviation/FleetSimulator";
import { LinkButton } from "@/components/ui/LinkButton";
import { DISCIPLINE, LANDS } from "@/lib/editorial";
import { capital, gates } from "@/lib/site-data";
import styles from "./Home.module.css";

/** Teaser interativo da engenharia aeronáutica: escala física e alcance real. */
export function AviationSection() {
  return (
    <section id="escala" className={styles.instrument} aria-labelledby="escala-titulo" data-surface="dossier">
      <div className={`${styles.inner} ${styles.wide}`}>
        <div className={styles.headSplit}>
          <div>
            <p className={styles.kicker}>Engenharia aeronáutica · escala real</p>
            <h2 id="escala-titulo" className={styles.sectionTitle}>
              Seis aeronaves críticas, na proporção métrica real e no alcance real a partir de Orlando.
            </h2>
          </div>
          <p className={styles.bodyText}>
            Escolha a aeronave: a silhueta assume a envergadura e o comprimento publicados pelo fabricante sobre os 45 m de largura da pista-premissa, e o mapa mostra
            quais polos ficam dentro do alcance nominal sem escala.
          </p>
        </div>
        <FleetSimulator variant="teaser" />
        <div className={styles.rowActions}>
          <LinkButton href="/aviacao" variant="ghost">
            Abrir o console completo de pista & frota
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

/** Disciplina: os sete stage-gates em régua. */
export function Discipline() {
  return (
    <section className={styles.ruledSection} aria-labelledby="disciplina-titulo" data-surface="dossier">
      <div className={`${styles.inner} ${styles.split}`}>
        <div>
          <p className={styles.kicker}>Disciplina de capital</p>
          <h2 id="disciplina-titulo" className={styles.sectionTitle}>
            {DISCIPLINE.title}
          </h2>
          <p className={styles.bodyText}>{DISCIPLINE.rejection}</p>
        </div>
        <ol className={styles.gates}>
          {gates.map((gate) => (
            <li key={gate.n} className={styles.gate}>
              <span className={`${styles.gateNumber} tnum`}>{gate.n}</span>
              <span className={styles.gateTitle}>{gate.title}</span>
              <span className={styles.gateBody}>{gate.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Atlas Satelital na home: a mesma câmera fly-to de /terrenos. */
export function AtlasSection() {
  return (
    <section id="atlas" className={styles.instrument} aria-labelledby="atlas-home-titulo" data-surface="void">
      <div className={`${styles.inner} ${styles.wide}`}>
        <div className={styles.headSplit}>
          <div>
            <p className={styles.kicker}>Atlas Satelital · Central Florida</p>
            <h2 id="atlas-home-titulo" className={styles.sectionTitle}>
              {LANDS.title}
            </h2>
          </div>
          <p className={styles.bodyText}>{LANDS.body} Escolha um terreno: a câmera desce da carta regional até o satélite e a foto do anúncio.</p>
        </div>
        <SatelliteAtlas dossierId="dossie-home" />
        <div className={styles.rowActions}>
          <LinkButton href="/terrenos" variant="ghost">
            Scorecard, corredores e aprovações
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

/** Escala de capital por fase, com o aviso legal obrigatório. */
export function CapitalTeaser() {
  const total = capital.at(-1);
  const phases = capital.slice(0, -1);
  return (
    <section className={styles.ruledSection} aria-labelledby="capital-titulo" data-surface="void">
      <div className={styles.inner}>
        <p className={styles.kicker}>Escala & capital</p>
        <h2 id="capital-titulo" className={styles.sectionTitle}>
          {DISCIPLINE.scaleTitle}
        </h2>
        <ol className={styles.phases}>
          {phases.map((phase, index) => (
            <li key={phase.range} className={styles.phase}>
              <span className={`${styles.ruleIndex} tnum`}>Fase {index + 1}</span>
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
        <p className={styles.note}>{DISCIPLINE.capitalDisclaimer}</p>
        <div className={styles.rowActions}>
          <LinkButton href="/tese-capital" variant="ghost">
            Estrutura, stage-gates e governança
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
