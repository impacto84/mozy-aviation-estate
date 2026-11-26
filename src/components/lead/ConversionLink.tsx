"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useAttribution, useTrack } from "@/components/consent/useMartech";
import { decorateUrl } from "@/lib/martech/utm";

interface ConversionLinkProps {
  /** URL única do formulário externo, vinda de `NEXT_PUBLIC_FORM_URL` (nunca escrita à mão). */
  readonly href: string;
  /** Identificador do CTA no evento `cta_click`. */
  readonly ctaId: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Link para formulário externo que leva a campanha da sessão na query.
 * No servidor sai o `href` limpo; depois de montar, com os parâmetros. Só o host do
 * próprio `href` recebe parâmetros. `data-forja-conversion` é o contrato do gate.
 */
export function ConversionLink({ href, ctaId, className, children }: ConversionLinkProps) {
  const attribution = useAttribution();
  const track = useTrack();
  const decorated = useMemo(() => {
    if (!URL.canParse(href)) {
      return href;
    }
    const url = new URL(href);
    return decorateUrl(href, attribution, { base: url.origin, allowedHosts: [url.hostname] });
  }, [href, attribution]);

  return (
    <a
      className={className}
      href={decorated}
      referrerPolicy="strict-origin-when-cross-origin"
      data-forja-conversion=""
      onClick={() => track({ name: "cta_click", params: { cta_id: ctaId } })}
    >
      {children}
    </a>
  );
}
