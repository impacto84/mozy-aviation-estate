import { DISCIPLINE, UNDERWRITING } from "@/lib/editorial";
import { capital, entities, revenues, risks, stack, timeline } from "@/lib/site-data";
import styles from "./CapitalBlocks.module.css";

const STACK_AXIS_MAX = 60;
const TIMELINE_MONTHS = 84;

/** "5–10%" → [5, 10]; "48–84" → [48, 84]. Faixa inválida vira [0, 0]. */
export function parseRange(raw: string): readonly [number, number] {
  const numbers = raw.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(",", "."))) ?? [];
  const [start = 0, end = start] = numbers;
  return [start, end];
}

function percent(value: number, max: number): string {
  return `${Math.min(Math.max((value / max) * 100, 0), 100)}%`;
}

/** Fases de investimento (faixas ilustrativas) + metas de underwriting com o aviso obrigatório. */
export function CapitalPhases() {
  return (
    <div className={styles.phases}>
      <ol className={styles.phaseList}>
        {capital.map((phase, index) => (
          <li key={phase.range} className={index === capital.length - 1 ? styles.phaseTotal : styles.phase}>
            <span className={`${styles.phaseRange} tnum`}>{phase.range}</span>
            <span className={styles.phaseLabel}>{phase.label}</span>
          </li>
        ))}
      </ol>
      <dl className={styles.targets} aria-label="Metas de underwriting (ilustrativas)">
        <div>
          <dt>Margem bruta</dt>
          <dd className="tnum">{UNDERWRITING.grossMargin}</dd>
        </div>
        <div>
          <dt>Margem líquida</dt>
          <dd className="tnum">{UNDERWRITING.netMargin}</dd>
        </div>
        <div>
          <dt>IRR</dt>
          <dd className="tnum">{UNDERWRITING.irr}</dd>
        </div>
      </dl>
      <p className={styles.disclaimer}>{DISCIPLINE.capitalDisclaimer}</p>
    </div>
  );
}

/** Capital stack: cada fonte como faixa mínima–máxima sobre um eixo de 0 a 60%. */
export function CapitalStack() {
  return (
    <div className={styles.stack}>
      <ol className={styles.stackList}>
        {stack.map((item) => {
          const [low, high] = parseRange(item.share);
          return (
            <li key={item.title} className={styles.stackRow}>
              <div className={styles.stackHead}>
                <span className={styles.stackTitle}>{item.title}</span>
                <span className={`${styles.stackShare} tnum`}>{item.share}</span>
              </div>
              <span className={styles.track} aria-hidden="true">
                <span className={styles.range} style={{ insetInlineStart: percent(low, STACK_AXIS_MAX), inlineSize: percent(high - low, STACK_AXIS_MAX) }} />
              </span>
              <span className={styles.stackBody}>{item.body}</span>
            </li>
          );
        })}
      </ol>
      <div className={`${styles.axis} tnum`} aria-hidden="true">
        <span>0%</span>
        <span>20%</span>
        <span>40%</span>
        <span>60%</span>
      </div>
    </div>
  );
}

/** Cronograma 0–84 meses em Gantt, com as janelas sobrepostas reais do plano. */
export function TimelineGantt() {
  return (
    <div className={styles.gantt}>
      <ol className={styles.ganttList}>
        {timeline.map((phase) => {
          const [start, end] = parseRange(phase.when);
          return (
            <li key={phase.title} className={styles.ganttRow}>
              <div className={styles.ganttHead}>
                <span className={styles.ganttTitle}>{phase.title}</span>
                <span className={`${styles.ganttWhen} tnum`}>{phase.when.includes("meses") ? phase.when : `${phase.when} meses`}</span>
              </div>
              <span className={styles.track} aria-hidden="true">
                <span className={styles.range} style={{ insetInlineStart: percent(start, TIMELINE_MONTHS), inlineSize: percent(end - start, TIMELINE_MONTHS) }} />
              </span>
              <span className={styles.ganttBody}>{phase.body}</span>
            </li>
          );
        })}
      </ol>
      <div className={`${styles.axis} tnum`} aria-hidden="true">
        <span>0</span>
        <span>24</span>
        <span>48</span>
        <span>72</span>
        <span>84 meses</span>
      </div>
    </div>
  );
}

/** Veículos societários (desenho conceitual). */
export function EntitiesRow() {
  return (
    <div>
      <ol className={styles.entities}>
        {entities.map((entity, index) => (
          <li key={entity.title} className={styles.entity}>
            <span className={`${styles.entityIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.entityTitle}>{entity.title}</span>
            <span className={styles.entityBody}>{entity.body}</span>
          </li>
        ))}
      </ol>
      <p className={styles.disclaimer}>{DISCIPLINE.entitiesNote}</p>
    </div>
  );
}

/** Seis fontes de receita: a primeira é o motor (destacada), as demais sustentam. */
export function RevenueGrid() {
  return (
    <div>
      <ol className={styles.revenues}>
        {revenues.map((revenue) => (
          <li key={revenue.n} className={styles.revenue}>
            <span className={`${styles.entityIndex} tnum`}>{revenue.n}</span>
            <span className={styles.revenueTitle}>{revenue.title}</span>
            <span className={styles.entityBody}>{revenue.body}</span>
          </li>
        ))}
      </ol>
      <p className={styles.disclaimer}>{DISCIPLINE.revenuesNote}</p>
    </div>
  );
}

/** Riscos conhecidos por nível (Alto / Médio), com a resposta de cada um. */
export function RiskList() {
  return (
    <ul className={styles.risks} role="list">
      {risks.map((risk) => (
        <li key={risk.title} className={styles.risk} data-level={risk.level}>
          <span className={styles.riskLevel}>{risk.level}</span>
          <span className={styles.riskTitle}>{risk.title}</span>
          <span className={styles.entityBody}>{risk.body}</span>
        </li>
      ))}
    </ul>
  );
}
