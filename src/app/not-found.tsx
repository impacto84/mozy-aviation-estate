import type { Metadata } from "next";
import Link from "next/link";
import { CTA } from "@/lib/editorial";
import { ACCESS_PATH } from "@/lib/martech/seo/site";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "O endereço aberto não existe neste site. Volte para a visão geral do MOZY Private Aviation Estate ou solicite acesso ao Data Room.",
  robots: { index: false, follow: false },
};

/** 404 com um `<h1>`, explicação curta e caminhos de volta. */
export default function NotFound() {
  return (
    <section className={styles.wrap} data-surface="void">
      <p className={styles.code}>Erro 404 · fora da rota</p>
      <h1 className={styles.title}>Esta página saiu do plano de voo.</h1>
      <p className={styles.text}>O endereço pode ter mudado ou ter sido digitado com erro.</p>
      <div className={styles.actions}>
        <Link className={styles.link} href="/">
          Voltar para a visão geral
        </Link>
        <Link className={styles.linkGhost} href={ACCESS_PATH}>
          {CTA.primaryShort}
        </Link>
      </div>
    </section>
  );
}
