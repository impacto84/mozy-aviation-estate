import Image from "next/image";
import styles from "./HeroPoster.module.css";

/** `bands` acompanha o ShaderHero, `field` o ParticlesHero e `orbit` o R3FHero. */
export type HeroPosterVariant = "bands" | "field" | "orbit";

export interface HeroPosterImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface HeroPosterProps {
  readonly variant: HeroPosterVariant;
  /**
   * Imagem que cobre o pôster (um frame exportado da cena, por exemplo). Com ela,
   * a imagem é a candidata a LCP e sai com `fetchpriority="high"`, sem lazy.
   */
  readonly image?: HeroPosterImage;
}

const VARIANT_CLASS: Readonly<Record<HeroPosterVariant, string | undefined>> = {
  bands: styles.bands,
  field: styles.field,
  orbit: styles.orbit,
};

/**
 * Pôster renderizado no servidor. É decorativo (`aria-hidden`): o conteúdo do
 * hero é o texto em HTML. Fica na página o tempo todo, atrás do canvas.
 */
export function HeroPoster({ variant, image }: HeroPosterProps) {
  const className = [styles.poster, VARIANT_CLASS[variant]].filter(Boolean).join(" ");

  return (
    <div className={className} data-hero-poster={variant} data-forja-poster="" aria-hidden="true">
      {image === undefined ? null : (
        <Image
          className={styles.image}
          src={image.src}
          width={image.width}
          height={image.height}
          alt=""
          sizes="100vw"
          preload
          fetchPriority="high"
        />
      )}
      <div className={styles.detail} />
    </div>
  );
}
