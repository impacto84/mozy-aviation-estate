import { DISCIPLINE } from "@/lib/editorial";
import { corridors, gates, regulators, scorecard } from "@/lib/site-data";
import styles from "./DataBlocks.module.css";

/** Peso numérico de "25%" → 25. */
function weightValue(weight: string): number {
  const value = Number.parseFloat(weight);
  return Number.isFinite(value) ? value : 0;
}

/** Scorecard ponderado: barra composta (100%) + régua por critério, larguras proporcionais ao peso. */
export function ScorecardBars() {
  return (
    <div className={styles.scorecard}>
      <div className={styles.stack} role="img" aria-label={`Pesos do scorecard: ${scorecard.map((item) => `${item.weight} ${item.title}`).join(", ")}`}>
        {scorecard.map((item, index) => (
          <span key={item.title} className={styles.stackPart} data-index={index} style={{ flexGrow: weightValue(item.weight) }}>
            <span className="tnum">{item.weight}</span>
          </span>
        ))}
      </div>
      <ol className={styles.criteria}>
        {scorecard.map((item, index) => (
          <li key={item.title} className={styles.criterion}>
            <span className={`${styles.weight} tnum`}>{item.weight}</span>
            <div className={styles.criterionBody}>
              <p className={styles.criterionTitle}>{item.title}</p>
              <p className={styles.criterionTest}>{item.test}</p>
              <span className={styles.bar} data-index={index} aria-hidden="true">
                <span className={styles.barFill} style={{ inlineSize: `${weightValue(item.weight) * 4}%` }} />
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.footnote}>{DISCIPLINE.scorecardNote}</p>
    </div>
  );
}

/** Tabela de corredores regionais (rank 01..04). */
export function CorridorsTable() {
  return (
    <div className={styles.tableWrap} role="region" aria-labelledby="corredores-titulo" tabIndex={0}>
      <table className={styles.table}>
        <caption className="visually-hidden">Corredores regionais avaliados, por ordem de prioridade</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Corredor</th>
            <th scope="col">Conectividade</th>
            <th scope="col">Tese</th>
            <th scope="col">Risco</th>
          </tr>
        </thead>
        <tbody>
          {corridors.map((corridor) => (
            <tr key={corridor.rank}>
              <td className={`${styles.rank} tnum`}>{corridor.rank}</td>
              <th scope="row" className={styles.rowHead}>
                {corridor.name}
              </th>
              <td data-label="Conectividade">{corridor.connect}</td>
              <td data-label="Tese">{corridor.thesis}</td>
              <td className={styles.muted} data-label="Risco">
                {corridor.risk}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matriz dos seis órgãos reguladores (aprovações em paralelo). */
export function RegulatorsMatrix() {
  return (
    <ul className={styles.matrix} role="list">
      {regulators.map((regulator, index) => (
        <li key={regulator.title} className={styles.matrixCell}>
          <span className={`${styles.matrixIndex} tnum`}>{String(index + 1).padStart(2, "0")}</span>
          <p className={styles.matrixTitle}>{regulator.title}</p>
          <p className={`${styles.matrixBody} tnum`}>{regulator.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** Stage-gates 0..6 como trilho horizontal (desktop) ou vertical (phone). */
export function GatesRail() {
  return (
    <div>
      <ol className={styles.rail}>
        {gates.map((gate) => (
          <li key={gate.n} className={styles.railStep}>
            <span className={`${styles.railNumber} tnum`}>{gate.n}</span>
            <span className={styles.railTitle}>{gate.title}</span>
            <span className={styles.railBody}>{gate.body}</span>
          </li>
        ))}
      </ol>
      <p className={styles.footnote}>{DISCIPLINE.rejection}</p>
    </div>
  );
}
