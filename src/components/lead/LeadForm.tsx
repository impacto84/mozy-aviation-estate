"use client";

import { useId, useRef } from "react";
import { CTA } from "@/lib/editorial";
import { HONEYPOT_FIELD, LEAD_PROFILES } from "@/lib/martech/lead";
import type { LeadErrors } from "@/lib/martech/lead";
import type { LeadFailureReason } from "@/lib/martech/lead-client";
import { AttributionFields } from "./AttributionFields";
import { LeadField } from "./LeadField";
import type { LeadFieldSpec } from "./LeadField";
import styles from "./LeadForm.module.css";
import { LEAD_CONVERSION_EVENT, useLeadForm } from "./useLeadForm";
import type { FormStatus, LeadFormOptions } from "./useLeadForm";

interface LeadFormProps extends LeadFormOptions {
  /** `id` do título visível que dá nome ao formulário. */
  readonly labelledBy: string;
  /** `id` do aviso mostrado quando o envio sem JavaScript falha (alvo do redirect 303). */
  readonly fallbackErrorId: string;
  /** `id` do aviso mostrado quando o envio sem JavaScript dá certo (alvo do redirect 303). */
  readonly fallbackSuccessId: string;
}

const FIELDS: readonly LeadFieldSpec[] = [
  { name: "name", label: "Nome completo", isRequired: true, autoComplete: "name", maxLength: 120 },
  { name: "email", label: "E-mail", isRequired: true, type: "email", inputMode: "email", autoComplete: "email", isIdentifier: true, maxLength: 254 },
  {
    name: "profile",
    label: "Perfil de interesse",
    isRequired: true,
    autoComplete: "off",
    maxLength: 40,
    options: LEAD_PROFILES,
    hint: "Coleção residencial, participação de capital ou terra / co-desenvolvimento.",
  },
  { name: "phone", label: "Telefone com DDI", isRequired: false, type: "tel", inputMode: "tel", autoComplete: "tel", isIdentifier: true, maxLength: 32 },
  { name: "company", label: "Family office, empresa ou organização", isRequired: false, autoComplete: "organization", maxLength: 120 },
  { name: "message", label: "Mensagem", isRequired: false, isMultiline: true, autoComplete: "off", maxLength: 2000 },
];

const FAILURE_MESSAGES: Readonly<Record<LeadFailureReason, string>> = {
  network: "Não foi possível enviar: verifique sua conexão e tente de novo.",
  "rate-limited": "Muitas tentativas em pouco tempo. Aguarde um minuto e envie de novo.",
  server: "Não foi possível enviar agora. Seus dados continuam no formulário: tente de novo em instantes.",
};

function statusMessage(status: FormStatus, errors: LeadErrors, failure: LeadFailureReason | null, traceId: string | null): string {
  const invalidCount = Object.keys(errors).length;
  if (status === "pending") {
    return "Enviando sua solicitação…";
  }
  if (status === "success") {
    return "Solicitação recebida. Entraremos em contato pelos dados informados.";
  }
  if (status === "error" && failure !== null) {
    return traceId === null ? FAILURE_MESSAGES[failure] : `${FAILURE_MESSAGES[failure]} Código de rastreio: ${traceId}.`;
  }
  return invalidCount === 0 ? "" : `Revise ${invalidCount === 1 ? "o campo destacado" : `os ${invalidCount} campos destacados`}.`;
}

/**
 * Formulário de lead nativo, igual nas três larguras (não existe "versão mobile" à parte).
 * Estados idle, pending, success e error, todos visíveis e anunciados em uma região `status`.
 * A lógica (validar, enviar, medir, redirecionar) está em `useLeadForm`.
 * `action` e `method` existem para o envio sem JavaScript: a rota responde com redirect.
 */
export function LeadForm({ labelledBy, fallbackErrorId, fallbackSuccessId, ...options }: LeadFormProps) {
  const idPrefix = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const form = useLeadForm(options, formRef);
  const isBusy = form.status === "pending" || form.status === "success";
  const honeypotId = `${idPrefix}-${HONEYPOT_FIELD}`;

  return (
    <div className={styles.shell}>
      <form
        ref={formRef}
        className={styles.form}
        action={options.endpoint}
        method="post"
        noValidate
        aria-labelledby={labelledBy}
        data-forja-conversion=""
        data-forja-conversion-event={LEAD_CONVERSION_EVENT}
        data-lead-status={form.status}
        onSubmit={form.handleSubmit}
      >
        {FIELDS.map((spec) => (
          <LeadField key={spec.name} spec={spec} idPrefix={idPrefix} error={form.errors[spec.name]} onBlurValue={form.handleBlur} onEdit={form.handleEdit} />
        ))}
        <div className={styles.trap} aria-hidden="true">
          <label htmlFor={honeypotId}>Deixe este campo em branco</label>
          <input id={honeypotId} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <AttributionFields />
        <button type="submit" className={styles.submit} aria-disabled={isBusy}>
          {form.status === "pending" ? "Enviando…" : form.status === "success" ? "Solicitação enviada" : CTA.primary}
          <span className={styles.submitArrow} aria-hidden="true">
            →
          </span>
        </button>
      </form>
      <p className={styles.status} role="status" data-lead-message={form.status}>
        {statusMessage(form.status, form.errors, form.failure, form.traceId)}
      </p>
      <p id={fallbackErrorId} className={styles.fallbackError}>
        Não foi possível concluir o envio. Confira nome, e-mail e perfil e tente de novo.
      </p>
      <p id={fallbackSuccessId} className={styles.fallbackError}>
        Solicitação recebida. Entraremos em contato pelos dados informados.
      </p>
    </div>
  );
}
