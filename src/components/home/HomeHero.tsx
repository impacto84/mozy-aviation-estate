import Image from "next/image";
import Link from "next/link";
import { RunwayHero } from "@/components/hero/RunwayHero";
import { CTA, HERO } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import { stats } from "@/lib/site-data";
import styles from "./HomeHero.module.css";

/**
 * Hero da home. Server Component: fotografia (LCP, `priority`), `<h1>`, texto e
 * CTA saem no HTML do servidor. A luz de pista em WebGL2 (`RunwayHero`) é a
 * única folha de cliente e entra depois do primeiro paint (Pisos P2, P3).
 */
export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-forja-scene="hero">
      <div className={styles.poster} data-forja-poster="" aria-hidden="true">
        <Image
          className={styles.image}
          src="/media/estate-dusk.jpg"
          alt=""
          width={1672}
          height={942}
          sizes="100vw"
          quality={72}
          priority
        />
      </div>
      <RunwayHero />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.kicker}>{HERO.kicker}</p>
        <h1 id="hero-title" className={styles.title}>
          {HERO.title}
        </h1>
        <p className={styles.lead}>{HERO.body}</p>
        <div className={styles.actions}>
          <Link className={styles.cta} href={ACCESS_PATH} data-forja-cta="primary">
            {CTA.primary}
          </Link>
          <Link className={styles.ctaGhost} href="/aviacao" data-forja-cta="secondary">
            {CTA.aviation}
          </Link>
        </div>
      </div>
      <dl className={styles.hud} aria-label="Números-chave do empreendimento">
        {stats.map((stat) => (
          <div key={stat.label} className={styles.hudItem}>
            <dt className={styles.hudLabel}>{stat.label}</dt>
            <dd className={`${styles.hudValue} tnum`}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
