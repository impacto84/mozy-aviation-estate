"use client";

import { useId } from "react";
import type { RefObject } from "react";
import type { ConsentCategory, ConsentChoices } from "@/lib/martech/consent";
import styles from "./Consent.module.css";

interface ConsentPreferencesProps {
  readonly ref: RefObject<HTMLDialogElement | null>;
  /** Muda a cada abertura: as caixas remontam e voltam a mostrar a escolha salva. */
  readonly formKey: number;
  readonly choices: ConsentChoices;
  readonly onSave: (choices: ConsentChoices) => void;
}

interface CategoryOption {
  readonly category: ConsentCategory;
  readonly label: string;
  readonly description: string;
}

const OPTIONS: readonly CategoryOption[] = [
  {
    category: "analytics",
    label: "Medição",
    description: "Conta visitas e mostra quais páginas funcionam, sem identificar você em outros sites.",
  },
  {
    category: "marketing",
    label: "Anúncios",
    description: "Mede o resultado de campanhas e permite anúncios ligados à sua visita.",
  },
];

interface CategoryRowProps {
  readonly option: CategoryOption;
  readonly idPrefix: string;
  readonly isChecked: boolean;
}

function CategoryRow({ option, idPrefix, isChecked }: CategoryRowProps) {
  const inputId = `${idPrefix}-${option.category}`;
  return (
    <div className={styles.option}>
      <input id={inputId} type="checkbox" name={option.category} defaultChecked={isChecked} aria-describedby={`${inputId}-text`} />
      <label htmlFor={inputId}>{option.label}</label>
      <p id={`${inputId}-text`} className={styles.optionText}>
        {option.description}
      </p>
    </div>
  );
}

/**
 * Diálogo modal nativo com uma caixa por categoria. Nada vem marcado sem escolha
 * anterior do visitante. Fechar por Esc ou "Cancelar" não muda o que estava salvo.
 * Não é um `<form>`: são só caixas e dois botões, sem envio nem estado de erro.
 */
export function ConsentPreferences({ ref, formKey, choices, onSave }: ConsentPreferencesProps) {
  const id = useId();
  const titleId = `${id}-title`;

  const handleSave = (): void => {
    const isChecked = (category: ConsentCategory): boolean =>
      ref.current?.querySelector<HTMLInputElement>(`input[name="${category}"]`)?.checked ?? false;
    onSave({ analytics: isChecked("analytics"), marketing: isChecked("marketing") });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} data-forja-consent="dialog">
      <div key={formKey} className={styles.form}>
        <h2 id={titleId} className={styles.dialogTitle}>
          Preferências de cookies
        </h2>
        <fieldset className={styles.categories}>
          <legend className={styles.legend}>Escolha o que este site pode usar</legend>
          <div className={styles.option}>
            <input id={`${id}-necessary`} type="checkbox" checked disabled readOnly />
            <label htmlFor={`${id}-necessary`}>Necessários</label>
            <p className={styles.optionText}>Guardam esta escolha e mantêm o site funcionando. Não dá para desligar.</p>
          </div>
          {OPTIONS.map((option) => (
            <CategoryRow key={option.category} option={option} idPrefix={id} isChecked={choices[option.category]} />
          ))}
        </fieldset>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => ref.current?.close()}>
            Cancelar
          </button>
          <button type="button" className={styles.choice} data-forja-consent="save" onClick={handleSave}>
            Salvar escolhas
          </button>
        </div>
      </div>
    </dialog>
  );
}
