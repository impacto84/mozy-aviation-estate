/** Navegação principal: as cinco rotas reais do sitemap. */
export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/aviacao", label: "Aviação" },
  { href: "/terrenos", label: "Terrenos" },
  { href: "/tese-capital", label: "Tese de capital" },
];

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Visão geral" },
  ...NAV_ITEMS,
  { href: "/solicitar-acesso", label: "Data Room" },
];
