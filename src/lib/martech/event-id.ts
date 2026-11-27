/**
 * `event_id` único por evento, compartilhado por todos os destinos (navegador e
 * servidor). É o que permite deduplicar a mesma conversão vista por dois caminhos.
 */

const UUID_BYTES = 16;
const HEX_RADIX = 16;
const VERSION_BYTE = 6;
const VARIANT_BYTE = 8;

export const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type CryptoSource = Partial<Pick<Crypto, "randomUUID" | "getRandomValues">>;

function uuidFromRandomValues(source: Pick<Crypto, "getRandomValues">): string {
  const bytes = source.getRandomValues(new Uint8Array(UUID_BYTES));
  const hex = [...bytes].map((byte, index) => {
    // RFC 9562: versão 4 no byte 6 e variante 10xx no byte 8.
    const value = index === VERSION_BYTE ? (byte & 0x0f) | 0x40 : index === VARIANT_BYTE ? (byte & 0x3f) | 0x80 : byte;
    return value.toString(HEX_RADIX).padStart(2, "0");
  });
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

/**
 * UUID v4. `crypto.randomUUID` só existe em contexto seguro (https ou localhost);
 * em http comum o caminho é `getRandomValues`, que existe em todo navegador.
 */
export function createEventId(source: CryptoSource | undefined = globalThis.crypto): string {
  if (source?.randomUUID !== undefined) {
    return source.randomUUID();
  }
  if (source?.getRandomValues !== undefined) {
    return uuidFromRandomValues({ getRandomValues: source.getRandomValues.bind(source) });
  }
  throw new Error("Web Crypto indisponível: não é possível gerar event_id.");
}

export function isEventId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4_PATTERN.test(value);
}
