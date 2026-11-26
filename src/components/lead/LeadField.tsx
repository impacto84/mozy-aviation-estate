import type { HTMLAttributes, InputHTMLAttributes } from "react";
import type { LeadField as LeadFieldName } from "@/lib/martech/lead";
import styles from "./LeadForm.module.css";

export interface LeadFieldSpec {
  readonly name: LeadFieldName;
  readonly label: string;
  readonly isRequired: boolean;
  readonly isMultiline?: boolean;
  /** Lista fechada: vira `<select>` com uma opção vazia inicial. */
  readonly options?: readonly string[];
  /** Texto de ajuda sempre visível, ligado por `aria-describedby`. */
  readonly hint?: string;
  readonly type?: InputHTMLAttributes<HTMLInputElement>["type"];
  readonly autoComplete: string;
  readonly inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Campos de identificador (e-mail) não levam correção nem maiúscula automática. */
  readonly isIdentifier?: boolean;
  readonly maxLength: number;
}

/** O erro não depende só de cor: o texto começa dizendo que é um erro (e o leitor de tela lê junto). */
export const ERROR_PREFIX = "Erro: ";

interface LeadFieldProps {
  readonly spec: LeadFieldSpec;
  /** Prefixo de id único do formulário (`useId`). */
  readonly idPrefix: string;
  readonly error: string | undefined;
  readonly onBlurValue: (name: LeadFieldName, value: string) => void;
  readonly onEdit: (name: LeadFieldName) => void;
}

/**
 * Rótulo visível acima do campo, obrigatoriedade escrita por extenso, erro em texto
 * ligado por `aria-describedby` só enquanto existe, e `aria-invalid` sempre presente
 * ("false" até haver erro), para o leitor de tela não anunciar inválido antes da hora.
 */
export function LeadField({ spec, idPrefix, error, onBlurValue, onEdit }: LeadFieldProps) {
  const id = `${idPrefix}-${spec.name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = error !== undefined;
  const describedBy = [spec.hint === undefined ? null : hintId, hasError ? errorId : null].filter(Boolean).join(" ");
  const shared = {
    id,
    name: spec.name,
    className: styles.control,
    required: spec.isRequired,
    autoComplete: spec.autoComplete,
    "aria-invalid": hasError,
    "aria-describedby": describedBy === "" ? undefined : describedBy,
    onInput: () => onEdit(spec.name),
  };
  const identifierHints = spec.isIdentifier === true ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } : {};

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {spec.label} <span className={styles.hint}>{spec.isRequired ? "(obrigatório)" : "(opcional)"}</span>
      </label>
      {spec.hint === undefined ? null : (
        <p id={hintId} className={styles.fieldHint}>
          {spec.hint}
        </p>
      )}
      {spec.options !== undefined ? (
        <select {...shared} defaultValue="" onBlur={(event) => onBlurValue(spec.name, event.currentTarget.value)}>
          <option value="" disabled>
            Selecione um perfil
          </option>
          {spec.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : spec.isMultiline === true ? (
        <textarea {...shared} maxLength={spec.maxLength} rows={4} onBlur={(event) => onBlurValue(spec.name, event.currentTarget.value)} />
      ) : (
        <input
          {...shared}
          maxLength={spec.maxLength}
          {...identifierHints}
          type={spec.type ?? "text"}
          inputMode={spec.inputMode}
          enterKeyHint="next"
          onBlur={(event) => onBlurValue(spec.name, event.currentTarget.value)}
        />
      )}
      <p id={errorId} className={styles.error} hidden={!hasError}>
        {hasError ? `${ERROR_PREFIX}${error}` : null}
      </p>
    </div>
  );
}
