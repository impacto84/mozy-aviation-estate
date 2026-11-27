"use client";

import styles from "./Consent.module.css";

interface ConsentBannerProps {
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly onOpenPreferences: () => void;
  /** Link da política de privacidade. Em site real é obrigatório; a demo não tem a página. */
  readonly policyHref?: string;
}

/**
 * Aviso de cookies: barra não modal, fixa no rodapé, que não bloqueia a leitura.
 * "Recusar" e "Aceitar" têm o mesmo peso visual; recusar custa um clique, como aceitar.
 * Os atributos `data-forja-consent` são o contrato lido pelo gate (`tracking-check`).
 */
export function ConsentBanner({ onAccept, onReject, onOpenPreferences, policyHref }: ConsentBannerProps) {
  return (
    <section className={styles.banner} aria-label="Aviso de cookies" data-forja-consent="banner">
      <p className={styles.text}>
        Usamos cookies de medição e de anúncios só com o seu aceite.
        {policyHref === undefined ? null : (
          <>
            {" "}
            <a className={styles.policy} href={policyHref}>
              Política de privacidade
            </a>
          </>
        )}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.choice} data-forja-consent="reject" onClick={onReject}>
          Recusar
        </button>
        <button type="button" className={styles.secondary} data-forja-consent="preferences" onClick={onOpenPreferences}>
          Preferências
        </button>
        <button type="button" className={styles.choice} data-forja-consent="accept" onClick={onAccept}>
          Aceitar
        </button>
      </div>
    </section>
  );
}
