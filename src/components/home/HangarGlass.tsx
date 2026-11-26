import Image from "next/image";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { HANGAR_HOME } from "@/lib/editorial";
import styles from "./Home.module.css";

/** Casa + hangar: fotografia em sangria total com painel de vidro (Piso P7, fallback opaco). */
export function HangarGlass() {
  return (
    <section className={styles.photoBand} aria-labelledby="hangar-titulo" data-surface="void">
      <Image className={styles.photoBandImage} src="/media/hangar-dual.jpg" alt="Interior do hangar com duas aeronaves e o living integrado" fill sizes="100vw" quality={72} />
      <div className={styles.photoBandInner}>
        <GlassPanel className={styles.glassCard} tone="dark" refraction="none">
          <h2 id="hangar-titulo" className={styles.glassTitle}>
            {HANGAR_HOME.title}
          </h2>
          <p className={styles.glassBody}>{HANGAR_HOME.body}</p>
        </GlassPanel>
      </div>
    </section>
  );
}
