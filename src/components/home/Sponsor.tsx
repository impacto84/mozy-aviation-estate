import Image from "next/image";
import { BRAND, SPONSOR } from "@/lib/editorial";
import { contact } from "@/lib/site-data";
import section from "@/components/ui/Section.module.css";
import styles from "./Home.module.css";

/** Sponsor: quem executa, com os papéis declarados na V05. */
export function Sponsor() {
  return (
    <section className={section.section} aria-labelledby="sponsor-titulo" data-surface="navy">
      <div className={`${section.inner} ${styles.sponsor}`}>
        <div className={styles.sponsorIdentity}>
          <Image src="/media/logo.png" alt="Logotipo MOZY Construction" width={534} height={380} sizes="160px" className={styles.sponsorLogo} />
          <p className={styles.sponsorName}>{BRAND.sponsor}</p>
          <p className={styles.sponsorMeta}>{BRAND.sponsorDetail}</p>
          <p className={styles.sponsorMeta}>{contact.address}</p>
          <p className={styles.sponsorMeta}>{BRAND.sponsorRegion}</p>
        </div>
        <div>
          <h2 id="sponsor-titulo" className={section.title}>
            {SPONSOR.title}
          </h2>
          <ul className={styles.roles} role="list">
            {SPONSOR.roles.map((role) => (
              <li key={role} className={styles.role}>
                {role}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
