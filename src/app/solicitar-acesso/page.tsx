import type { Metadata } from "next";
import Image from "next/image";
import { LeadForm } from "@/components/lead/LeadForm";
import { BRAND, CTA, LEGAL } from "@/lib/editorial";
import { buildPageMetadata } from "@/lib/martech/seo/metadata";
import { ACCESS_PATH, SITE_NAME } from "@/lib/martech/seo/site";
import { tiers } from "@/lib/site-data";
import styles from "./page.module.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Solicitar acesso ao Data Room confidencial",
  description:
    "Solicite acesso ao Data Room do MOZY Private Aviation Estate: Founder Estates, Runway Signature, Reserve Estates, LP / equity e co-desenvolvimento.",
  path: ACCESS_PATH,
  siteName: SITE_NAME,
});

const FORM_TITLE_ID = "formulario-titulo";

export default function AccessPage() {
  return (
    <div className={styles.page} data-surface="void">
      <div className={styles.media} aria-hidden="true">
        <Image className={styles.image} src="/media/orlando-entrance.jpg" alt="" fill sizes="(min-width: 1200px) 45vw, 100vw" quality={60} priority />
        <div className={styles.shade} />
      </div>
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="acesso-titulo">
          <p className={styles.kicker}>Data Room confidencial</p>
          <h1 id="acesso-titulo" className={styles.title}>
            {CTA.primary}.
          </h1>
          <p className={styles.lead}>
            Para compradores das coleções residenciais, investidores LP / family offices e originadores de terra na Central Florida. Envie seu
            perfil; o contato é feito pela equipe {BRAND.sponsor} pelos dados informados.
          </p>
        </section>

        <aside className={styles.aside} aria-label="Coleções residenciais">
          <ul className={styles.tiers} role="list">
            {tiers.map((tier) => (
              <li key={tier.name} className={styles.tier}>
                <span>{tier.name}</span>
                <span className="tnum">{tier.price}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className={styles.formPanel} aria-labelledby={FORM_TITLE_ID}>
          <h2 id={FORM_TITLE_ID} className={styles.formTitle}>
            Seu perfil
          </h2>
          <p className={styles.formNote}>Campos obrigatórios estão indicados. Seus dados não são enviados a ferramentas de medição.</p>
          <LeadForm
            formId="data-room"
            endpoint="/api/leads"
            labelledBy={FORM_TITLE_ID}
            fallbackErrorId="envio-nao-concluido"
            fallbackSuccessId="envio-recebido"
          />
          <p className={styles.legal}>{LEGAL.disclaimer}</p>
        </section>
      </div>
    </div>
  );
}
