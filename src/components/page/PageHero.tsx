import Image from "next/image";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import styles from "./PageHero.module.css";

interface PageHeroImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Ponto focal no recorte (`object-position`). */
  readonly position?: "center" | "right" | "left";
  /** Ponto focal no phone (retrato), quando difere do desktop. */
  readonly phonePosition?: "center" | "right" | "left";
}

interface PageHeroProps {
  readonly title: string;
  readonly lead: ReactNode;
  readonly kicker: string;
  readonly image: PageHeroImage;
  readonly primaryCta: { readonly href: string; readonly label: string };
  readonly secondaryCta?: { readonly href: string; readonly label: string };
  /** Legenda da imagem (ex.: ilustração conceitual), sob os CTAs. */
  readonly caption?: string;
  /** Linha de dados (HUD) sob o texto. */
  readonly facts?: readonly { readonly label: string; readonly value: string }[];
}

/** Hero das páginas internas: fotografia LCP do servidor, `<h1>` único e CTA na dobra. */
export function PageHero({ title, lead, kicker, image, primaryCta, secondaryCta, caption, facts }: PageHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="page-title" data-surface="void">
      <Image
        className={styles.image}
        data-position={image.position ?? "center"}
        data-phone-position={image.phonePosition ?? image.position ?? "center"}
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        sizes="(max-width: 767px) 270vw, 100vw"
        quality={88}
        priority
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 id="page-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.lead}>{lead}</p>
        <div className={styles.actions}>
          <LinkButton href={primaryCta.href} ctaRole="primary">
            {primaryCta.label}
          </LinkButton>
          {secondaryCta === undefined ? null : (
            <LinkButton href={secondaryCta.href} variant="text" ctaRole="secondary" hasArrow>
              {secondaryCta.label}
            </LinkButton>
          )}
        </div>
        {caption === undefined ? null : <p className={styles.caption}>{caption}</p>}
        {facts === undefined ? null : (
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt className={styles.factLabel}>{fact.label}</dt>
                <dd className={`${styles.factValue} tnum`}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
