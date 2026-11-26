import Image from "next/image";
import Link from "next/link";
import { CTA } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { NAV_ITEMS } from "./nav-items";
import { NavLinks } from "./NavLinks";
import styles from "./SiteHeader.module.css";

const MENU_ID = "menu-principal";

/**
 * Barra de navegação flutuante (vidro sobre fotografia). Server Component; só os
 * links com estado de rota são cliente. No phone o menu abre em um `popover` nativo,
 * sem JavaScript próprio (fecha com Esc e clique fora).
 */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link className={styles.brand} href="/">
          <Image className={styles.mark} src="/media/logo-nav.png" alt="" width={36} height={36} sizes="36px" />
          <span className={styles.wordmark}>
            <span className={styles.wordmarkName}>MOZY</span>{" "}
            <span className={styles.wordmarkSub}>Private Aviation Estate</span>
            <span className="visually-hidden">, página inicial</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Principal">
          <NavLinks items={NAV_ITEMS} className={styles.links} linkClassName={styles.link} />
        </nav>
        <Link className={styles.cta} href={ACCESS_PATH} data-forja-cta="header">
          {CTA.primaryShort}
        </Link>
        <button className={styles.menuButton} type="button" popoverTarget={MENU_ID} aria-label="Abrir menu">
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.menu} id={MENU_ID} popover="auto">
        <nav aria-label="Menu">
          <NavLinks items={[{ href: "/", label: "Visão geral" }, ...NAV_ITEMS, { href: ACCESS_PATH, label: "Data Room" }]} className={styles.menuLinks} linkClassName={styles.menuLink} closesPopover />
        </nav>
        <button className={styles.menuClose} type="button" popoverTarget={MENU_ID} popoverTargetAction="hide">
          Fechar menu
        </button>
      </div>
    </header>
  );
}
