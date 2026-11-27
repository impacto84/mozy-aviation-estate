"use client";

import { useEffect, useId, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Button } from "./Button";
import styles from "./Dialog.module.css";

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Diálogo modal sobre `<dialog>` nativo (`showModal()`).
 * Gerencia foco, fechamento por `Escape`, clique no backdrop e retorno do foco sem
 * bibliotecas externas.
 */
export function Dialog({ open, onClose, title, description, footer, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    const handleCancel = (event: Event): void => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [open, onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description === undefined ? undefined : descriptionId}
      onClick={handleBackdropClick}
    >
      <div className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headingGroup}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description === undefined ? null : (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar janela">
            Fechar
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer === undefined ? null : <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
