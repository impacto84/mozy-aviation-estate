import Image from "next/image";
import { CLUB } from "@/lib/editorial";
import styles from "./Home.module.css";

/** Aviation Club: fotografia ao entardecer com o título em escala de capa. */
export function ClubBand() {
  return (
    <section className={`${styles.photoBand} ${styles.photoBandBottom}`} aria-labelledby="club-titulo" data-surface="void">
      <Image className={styles.photoBandImage} src="/media/club.jpg" alt="Aviation Club ao entardecer" fill sizes="100vw" quality={72} />
      <div className={styles.photoBandShade} aria-hidden="true" />
      <div className={styles.photoBandInner}>
        <div className={styles.clubCopy}>
          <p className={styles.smallHeading}>Aviation Club</p>
          <h2 id="club-titulo" className={styles.clubTitle}>
            {CLUB.title}
          </h2>
          <p className={styles.clubAmenities}>{CLUB.amenities}</p>
        </div>
      </div>
    </section>
  );
}
