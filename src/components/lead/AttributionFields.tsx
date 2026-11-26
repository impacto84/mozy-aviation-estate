"use client";

import { useAttribution } from "@/components/consent/useMartech";
import { attributionFields } from "@/lib/martech/utm";

/**
 * Campos ocultos com UTM e click-ids da sessão, dentro do formulário nativo.
 * Assim a campanha viaja com o lead no envio por JavaScript e também no envio nativo.
 */
export function AttributionFields() {
  const attribution = useAttribution();
  return (
    <>
      {attributionFields(attribution).map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} readOnly />
      ))}
    </>
  );
}
