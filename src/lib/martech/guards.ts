/**
 * Estreitamento de dado externo (storage, resposta de rede) sem biblioteca.
 * Os módulos que rodam em toda página usam estes guardas; o schema de verdade
 * (o lead) fica em `lead.ts`, com Zod, e só entra no bundle da página do formulário.
 */

export type UnknownRecord = Readonly<Record<string, unknown>>;

/** Objeto simples (não nulo, não array). */
export function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Pares cujo valor é texto; o resto é descartado. */
export function stringEntries(record: UnknownRecord): readonly (readonly [string, string])[] {
  return Object.entries(record).filter((entry): entry is [string, string] => typeof entry[1] === "string");
}

/** `JSON.parse` que devolve `undefined` em vez de lançar. */
export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Texto que não é JSON: quem chama trata como valor ausente.
    return undefined;
  }
}
