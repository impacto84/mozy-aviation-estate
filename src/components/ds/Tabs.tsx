"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly badge?: string;
  readonly content: ReactNode;
}

export interface TabsProps {
  readonly items: readonly TabItem[];
  readonly label: string;
  readonly defaultTabId?: string;
  readonly activeTabId?: string;
  readonly onTabChange?: (tabId: string) => void;
}

/**
 * Abas acessíveis com navegação por teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`)
 * seguindo o padrão ARIA `tablist` / `tab` / `tabpanel`.
 */
export function Tabs({ items, label, defaultTabId, activeTabId, onTabChange }: TabsProps) {
  const baseId = useId();
  const [uncontrolledId, setUncontrolledId] = useState<string>(defaultTabId ?? items[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentId = activeTabId ?? uncontrolledId;

  const selectTab = (id: string, focusIndex?: number): void => {
    if (activeTabId === undefined) {
      setUncontrolledId(id);
    }
    onTabChange?.(id);
    if (focusIndex !== undefined) {
      tabRefs.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (items.length === 0) {
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }
    if (nextIndex !== null) {
      event.preventDefault();
      const target = items[nextIndex];
      if (target !== undefined) {
        selectTab(target.id, nextIndex);
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.list} role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const isSelected = item.id === currentId;
          const tabId = `${baseId}-tab-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              className={isSelected ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span>{item.label}</span>
              {item.badge === undefined ? null : <span className={styles.count}>{item.badge}</span>}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const isSelected = item.id === currentId;
        const tabId = `${baseId}-tab-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;
        return (
          <div
            key={item.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isSelected}
            className={styles.panel}
          >
            {isSelected ? item.content : null}
          </div>
        );
      })}
    </div>
  );
}
