"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav-items";

interface NavLinksProps {
  readonly items: readonly NavItem[];
  readonly className: string | undefined;
  readonly linkClassName: string | undefined;
  /** Dentro de um `popover`: fecha o menu ao navegar. */
  readonly closesPopover?: boolean;
}

function hideParentPopover(target: HTMLElement): void {
  const popover = target.closest<HTMLElement>("[popover]");
  if (popover !== null && popover.matches(":popover-open")) {
    popover.hidePopover();
  }
}

/** Links da navegação com `aria-current="page"` na rota atual. */
export function NavLinks({ items, className, linkClassName, closesPopover = false }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <ul className={className} role="list">
      {items.map((item) => (
        <li key={item.href}>
          <Link className={linkClassName} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
            onClick={closesPopover ? (event) => hideParentPopover(event.currentTarget) : undefined}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
