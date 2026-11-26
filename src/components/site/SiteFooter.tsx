import Link from "next/link";
import { ConsentPreferencesButton } from "@/components/consent/ConsentPreferencesButton";
import { BRAND, LEGAL } from "@/lib/editorial";
import { contact } from "@/lib/site-data";
import { FOOTER_ITEMS } from "./nav-items";
import styles from "./SiteFooter.module.css";

/** Rodapé: contatos diretos, mapa do site, aviso legal obrigatório e preferências de cookies. */
export function SiteFooter() {
  return (
    <footer className={styles.footer} data-surface="void">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <p className={styles.brand}>{BRAND.name}</p>
          <p className={styles.sponsor}>
            {BRAND.sponsor} · {BRAND.sponsorDetail}
          </p>
          <p className={styles.muted}>{contact.address}</p>
        </div>
        <div className={styles.contact}>
          <p className={styles.heading}>Contato direto</p>
          <a className={`${styles.contactLink} tnum`} href={contact.phoneHref}>
            {contact.phone}
          </a>
          <a className={styles.contactLink} href={contact.emailHref}>
            {contact.email}
          </a>
          <p className={styles.muted}>{contact.web}</p>
        </div>
        <nav className={styles.sitemap} aria-label="Mapa do site">
          <p className={styles.heading}>Páginas</p>
          <ul className={styles.list} role="list">
            {FOOTER_ITEMS.map((item) => (
              <li key={item.href}>
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.legal}>
        <p className={styles.disclaimer}>{LEGAL.disclaimer}</p>
        <div className={styles.legalRow}>
          <p className={styles.muted}>
            {LEGAL.footer} · {BRAND.sponsor}
          </p>
          <ConsentPreferencesButton />
        </div>
      </div>
    </footer>
  );
}
