import { AmbientVideo } from "@/components/media/AmbientVideo";
import { LinkButton } from "@/components/ui/LinkButton";
import { DISCIPLINE } from "@/lib/editorial";
import { gates } from "@/lib/site-data";
import styles from "./Home.module.css";

/** Disciplina: pista à noite (vídeo ambiente com pausa) e os sete stage-gates. */
export function Discipline() {
  return (
    <section className={styles.night} aria-labelledby="disciplina-titulo" data-surface="void">
      <div className={styles.nightMedia}>
        <AmbientVideo src="/media/night.mp4" poster="/media/night.jpg" label="Pista privada à noite com luzes âmbar" />
        <div className={styles.photoBandShade} aria-hidden="true" />
      </div>
      <div className={styles.nightInner}>
        <h2 id="disciplina-titulo" className={styles.nightTitle}>
          {DISCIPLINE.title}
        </h2>
        <ol className={styles.gates}>
          {gates.map((gate) => (
            <li key={gate.n} className={styles.gate}>
              <span className={`${styles.gateNumber} tnum`}>{gate.n}</span>
              <span className={styles.gateTitle}>{gate.title}</span>
              <span className={styles.gateBody}>{gate.body}</span>
            </li>
          ))}
        </ol>
        <p className={styles.nightNote}>{DISCIPLINE.rejection}</p>
        <LinkButton href="/tese-capital" variant="ghost">
          Ver stage-gates e governança
        </LinkButton>
      </div>
    </section>
  );
}
