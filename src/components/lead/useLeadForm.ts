"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject, SubmitEvent } from "react";
import { useTrack } from "@/components/consent/useMartech";
import { createEventId } from "@/lib/martech/event-id";
import { LEAD_FIELDS, validateLead, validateLeadField } from "@/lib/martech/lead";
import type { LeadErrors, LeadField } from "@/lib/martech/lead";
import { formDataToPayload, submitLead } from "@/lib/martech/lead-client";
import type { LeadFailureReason } from "@/lib/martech/lead-client";

export type FormStatus = "idle" | "pending" | "success" | "error";

/** Nome do evento de conversão. O gate lê este valor em `data-forja-conversion-event`. */
export const LEAD_CONVERSION_EVENT = "generate_lead";

export interface LeadFormOptions {
  /** Identificador do formulário no evento de conversão (`form_id`). */
  readonly formId: string;
  /** Rota que recebe o lead (mesma origem). */
  readonly endpoint: string;
}

interface FieldErrors {
  readonly errors: LeadErrors;
  /** Mostra os erros e leva o foco ao primeiro campo com problema. */
  readonly showErrors: (next: LeadErrors) => void;
  readonly clearErrors: () => void;
  readonly handleBlur: (name: LeadField, value: string) => void;
  readonly handleEdit: (name: LeadField) => void;
}

export interface LeadFormState extends Pick<FieldErrors, "errors" | "handleBlur" | "handleEdit"> {
  readonly status: FormStatus;
  readonly failure: LeadFailureReason | null;
  /** `traceId` da falha, para o visitante citar ao suporte. */
  readonly traceId: string | null;
  readonly handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

/** Cópia dos erros sem o campo informado (o estado nunca é alterado no lugar). */
function withoutField(errors: LeadErrors, name: LeadField): LeadErrors {
  return Object.fromEntries(Object.entries(errors).filter(([field]) => field !== name));
}

function useFieldErrors(formRef: RefObject<HTMLFormElement | null>): FieldErrors {
  const focusTarget = useRef<LeadField | null>(null);
  const [errors, setErrors] = useState<LeadErrors>({});

  useEffect(() => {
    // O foco vai para o primeiro campo com erro depois do render, já com aria-invalid e a descrição.
    const field = focusTarget.current;
    if (field === null) {
      return;
    }
    focusTarget.current = null;
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }, [errors, formRef]);

  return {
    errors,
    showErrors: (next) => {
      focusTarget.current = LEAD_FIELDS.find((field) => next[field] !== undefined) ?? null;
      setErrors(next);
    },
    clearErrors: () => setErrors({}),
    handleBlur: (name, value) => {
      // Ao sair do campo só valida o que foi preenchido; obrigatório vazio aparece no envio.
      const message = value.trim() === "" ? null : validateLeadField(name, value);
      setErrors((current) => (message === null ? withoutField(current, name) : { ...current, [name]: message }));
    },
    handleEdit: (name) => setErrors((current) => (current[name] === undefined ? current : withoutField(current, name))),
  };
}

/**
 * Estado e envio do formulário de lead: valida, envia, mede e confirma na própria página.
 * O evento de conversão sai uma vez, só com `accepted` (conversão única por envio aceito).
 * `formRef` aponta para o `<form>`: é por ele que o foco chega ao campo com erro.
 */
export function useLeadForm({ formId, endpoint }: LeadFormOptions, formRef: RefObject<HTMLFormElement | null>): LeadFormState {
  const track = useTrack();
  const { errors, showErrors, clearErrors, handleBlur, handleEdit } = useFieldErrors(formRef);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [failure, setFailure] = useState<LeadFailureReason | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);

  const send = async (payload: Readonly<Record<string, string>>): Promise<void> => {
    // O id nasce antes do envio: vai no corpo do pedido e no evento, para deduplicar com o servidor.
    const eventId = createEventId();
    const result = await submitLead({ endpoint, payload: { ...payload, event_id: eventId } });
    if (result.status === "invalid") {
      showErrors(result.errors);
      setStatus("idle");
      return;
    }
    if (result.status === "failed") {
      setFailure(result.reason);
      setTraceId(result.traceId);
      setStatus("error");
      return;
    }
    if (result.status === "accepted") {
      track({ name: LEAD_CONVERSION_EVENT, params: { form_id: formId }, eventId });
    }
    setStatus("success");
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (status === "pending" || status === "success") {
      return;
    }
    const payload = formDataToPayload(new FormData(event.currentTarget));
    const validation = validateLead(payload);
    if (!validation.ok) {
      showErrors(validation.errors);
      setStatus("idle");
      return;
    }
    clearErrors();
    setFailure(null);
    setTraceId(null);
    setStatus("pending");
    void send(payload);
  };

  return { status, errors, failure, traceId, handleBlur, handleEdit, handleSubmit };
}
