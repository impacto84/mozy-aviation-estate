"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Dialog } from "./Dialog";
import styles from "./CommandPalette.module.css";

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  readonly shortcut?: string;
  readonly onSelect: () => void;
}

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly items: readonly CommandItem[];
  readonly placeholder?: string;
}

/**
 * Paleta de comandos acessível com atalho global `Cmd+K` / `Ctrl+K`,
 * filtragem instantânea e navegação por setas + `Enter`.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Buscar comando ou rota...",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return items;
    }
    return items.filter(
      (item) => item.label.toLowerCase().includes(needle) || item.group.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const safeIndex = filtered.length === 0 ? -1 : Math.min(activeIndex, filtered.length - 1);

  const handleClose = (): void => {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
  };

  const runItem = (item: CommandItem): void => {
    handleClose();
    item.onSelect();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (filtered.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter" && safeIndex >= 0) {
      event.preventDefault();
      const chosen = filtered[safeIndex];
      if (chosen !== undefined) {
        runItem(chosen);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Comandos rápidos" description="Use as setas e Enter para navegar.">
      <div className={styles.container}>
        <label className="visually-hidden" htmlFor={`${listId}-input`}>
          Buscar comando
        </label>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={safeIndex >= 0 ? `${listId}-opt-${safeIndex}` : undefined}
        />
        <ul id={listId} role="listbox" aria-label="Resultados de comando" className={styles.list}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>Nenhum comando encontrado para &ldquo;{query}&rdquo;.</li>
          ) : (
            filtered.map((item, index) => {
              const isActive = index === safeIndex;
              return (
                <li key={item.id} id={`${listId}-opt-${index}`} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={isActive ? `${styles.item} ${styles.itemActive}` : styles.item}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runItem(item)}
                  >
                    <span className={styles.itemMeta}>
                      <span className={styles.itemGroup}>{item.group}</span>
                      <span className={styles.itemLabel}>{item.label}</span>
                    </span>
                    {item.shortcut === undefined ? null : <kbd className={styles.kbd}>{item.shortcut}</kbd>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </Dialog>
  );
}
