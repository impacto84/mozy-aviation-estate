import Link from "next/link";
import { useId } from "react";
import type { ReactNode } from "react";
import { HeroPoster } from "./HeroPoster";
import type { HeroPosterImage, HeroPosterVariant } from "./HeroPoster";
import styles from "./HeroShell.module.css";

export interface HeroCta {
  readonly label: string;
  readonly href: string;
}

export interface HeroShellProps {
  /** Desenho do pôster. Tem de ser o par da cena que vai por cima (ver `HeroPoster`). */
  readonly variant: HeroPosterVariant;
  readonly title: string;
  readonly lead: string;
  readonly primaryCta: HeroCta;
  readonly eyebrow?: string;
  readonly secondaryCta?: HeroCta;
  /** Imagem do pôster. Sem ela o pôster é só CSS e o LCP é o `<h1>`. */
  readonly posterImage?: HeroPosterImage;
  /** O palco: `<ShaderHero />`, `<ParticlesHero />` ou `<R3FHero />`. Sem filho, o hero é só o pôster. */
  readonly children?: ReactNode;
}

/**
 * Casca comum dos heros. É Server Component: título, texto, CTA e pôster saem
 * no HTML do servidor. A fronteira de cliente é só o palco passado em `children`.
 *
 * O `<h1>` da página mora aqui: não crie outro (Piso P8).
 *
 * Marcadores do gate: a seção é a cena (`data-forja-scene="hero"`), o pôster leva
 * `data-forja-poster` e o CTA principal leva `data-forja-cta="primary"`.
 */
export function HeroShell({
  variant,
  title,
  lead,
  primaryCta,
  eyebrow,
  secondaryCta,
  posterImage,
  children,
}: HeroShellProps) {
  const titleId = useId();

  return (
    <section className={styles.hero} aria-labelledby={titleId} data-hero={variant} data-forja-scene="hero">
      <HeroPoster variant={variant} image={posterImage} />
      <div className={styles.content}>
        <div className={styles.copy}>
          {eyebrow === undefined ? null : <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 id={titleId} className={styles.title}>
            {title}
          </h1>
          <p className={styles.lead}>{lead}</p>
          <div className={styles.actions}>
            <Link className={styles.cta} href={primaryCta.href} data-forja-cta="primary">
              {primaryCta.label}
            </Link>
            {secondaryCta === undefined ? null : (
              <Link className={styles.ctaSecondary} href={secondaryCta.href} data-forja-cta="secondary">
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
