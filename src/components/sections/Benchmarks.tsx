import { BENCHMARKS } from "@/lib/editorial";
import { benchmarks } from "@/lib/site-data";
import styles from "./Sections.module.css";

/** Comparativo dos quatro benchmarks: o que cada um tem e o que o MOZY traz. */
export function BenchmarksTable() {
  return (
    <div className={styles.tableWrap} role="region" aria-labelledby="benchmarks-titulo" tabIndex={0}>
      <table className={styles.table}>
        <caption className="visually-hidden">Benchmarks de airparks: referência, o que oferecem e o que o MOZY traz</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Airpark</th>
            <th scope="col">O que tem</th>
            <th scope="col">O que trazemos</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((benchmark) => (
            <tr key={benchmark.n}>
              <td className={`${styles.rank} tnum`}>{benchmark.n}</td>
              <th scope="row" className={styles.rowHead}>
                {benchmark.name}
              </th>
              <td data-label="O que tem">{benchmark.take}</td>
              <td className={styles.emphasis} data-label="O que trazemos">
                {benchmark.bring}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.tableNote}>{BENCHMARKS.complementary}</p>
    </div>
  );
}
