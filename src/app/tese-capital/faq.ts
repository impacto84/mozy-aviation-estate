/**
 * Perguntas frequentes da tese de capital. Cada resposta só usa fatos de
 * `site-data.ts` / `editorial.ts` (Piso P11). O mesmo texto alimenta a página e o FAQPage JSON-LD.
 */

import { BRAND, DISCIPLINE, LEGAL, UNDERWRITING } from "@/lib/editorial";
import type { FaqEntry } from "@/lib/martech/seo/json-ld";
import { capital, contact, regulators, stack, timeline } from "@/lib/site-data";

const total = capital.at(-1);

export const CAPITAL_FAQ: readonly FaqEntry[] = [
  {
    question: "O empreendimento já tem aprovações aeronáuticas, ambientais ou de zoning?",
    answer: `Não. Pista, procedimentos IFR / GPS, zoning e licenças são premissas sujeitas a aprovação, conduzidas em paralelo com ${regulators
      .map((regulator) => regulator.title)
      .join(", ")}.`,
  },
  {
    question: "Qual é a faixa de investimento?",
    answer: `${total?.range ?? ""} de faixa de investimento construída, em fases: ${capital
      .slice(0, -1)
      .map((phase) => `${phase.range} (${phase.label.toLowerCase()})`)
      .join("; ")}. Faixas ilustrativas — não constituem orçamento, previsão, oferta ou garantia de retorno.`,
  },
  {
    question: "Quais são as metas de underwriting?",
    answer: `Metas ilustrativas: margem bruta ${UNDERWRITING.grossMargin}, líquida ${UNDERWRITING.netMargin} e IRR ${UNDERWRITING.irr}. Não constituem previsão, oferta ou garantia de retorno.`,
  },
  {
    question: "Como o capital entra no projeto?",
    answer: `${DISCIPLINE.stackTitle} Composição indicativa: ${stack.map((item) => `${item.share} ${item.title}`).join(", ")}.`,
  },
  {
    question: "Qual é o cronograma?",
    answer: `${timeline.map((phase) => `${phase.title}: ${phase.when.replace(" meses", "")} meses`).join("; ")}.`,
  },
  {
    question: "Quem é o sponsor?",
    answer: `${BRAND.sponsor} — ${BRAND.sponsorDetail}. ${contact.address}. Contato: ${contact.phone} · ${contact.email}.`,
  },
  {
    question: "Este material é uma oferta de investimento?",
    answer: LEGAL.disclaimer,
  },
];
