/**
 * Contrato do lead: um schema só, usado no navegador (mensagens de erro) e no
 * servidor (a validação que vale). Validação no cliente é experiência; a do servidor
 * é a defesa.
 *
 * Data Room MOZY: nome, e-mail e perfil obrigatórios; telefone, organização e
 * mensagem opcionais. Os perfis são os da RFC-0001 (coleções + capital + terra).
 */

import * as z from "zod/mini";

const NAME_MIN = 2;
const NAME_MAX = 120;
const EMAIL_MAX = 254;
const COMPANY_MAX = 120;
const PHONE_MAX = 32;
const MESSAGE_MAX = 2000;

/** Perfis de qualificação do Data Room (RFC-0001, seção 3.5). */
export const LEAD_PROFILES = [
  "Founder Estate",
  "Runway Signature",
  "Reserve Estate",
  "LP / Equity Partner",
  "Land / Co-Development",
] as const;

export type LeadProfile = (typeof LEAD_PROFILES)[number];

const PHONE_PATTERN = /^[+()\d][\d\s().+-]{6,31}$/;

/** Texto opcional: ausente vira "", presente é aparado e limitado. */
function optionalText(max: number, tooLong: string) {
  return z._default(z.optional(z.string().check(z.trim(), z.maxLength(max, { error: tooLong }))), "");
}

/**
 * `zod/mini`: mesma validação do Zod, em funções soltas que o bundler consegue cortar.
 * O schema vai para o navegador junto com o formulário, então o peso importa.
 */
export const leadSchema = z.object({
  name: z.string({ error: "Informe seu nome." }).check(
    z.trim(),
    z.minLength(NAME_MIN, { error: "Informe seu nome, com pelo menos 2 letras." }),
    z.maxLength(NAME_MAX, { error: `Use até ${NAME_MAX} caracteres no nome.` }),
  ),
  email: z.pipe(
    z.string({ error: "Informe seu e-mail." }).check(
      z.trim(),
      z.toLowerCase(),
      z.minLength(1, { error: "Informe seu e-mail." }),
      z.maxLength(EMAIL_MAX, { error: "E-mail longo demais." }),
    ),
    z.email({ error: "Informe um e-mail válido, como nome@empresa.com.br." }),
  ),
  profile: z.enum(LEAD_PROFILES, { error: "Escolha o perfil que melhor descreve seu interesse." }),
  phone: z._default(
    z.optional(
      z.string().check(
        z.trim(),
        z.maxLength(PHONE_MAX, { error: "Telefone longo demais." }),
        z.refine((value) => value === "" || PHONE_PATTERN.test(value), { error: "Informe um telefone válido, com DDI, como +1 754 271 6203." }),
      ),
    ),
    "",
  ),
  company: optionalText(COMPANY_MAX, `Use até ${COMPANY_MAX} caracteres no nome da organização.`),
  message: optionalText(MESSAGE_MAX, `Use até ${MESSAGE_MAX} caracteres na mensagem.`),
});

export type Lead = z.infer<typeof leadSchema>;
export type LeadField = keyof Lead;
export type LeadErrors = Readonly<Partial<Record<LeadField, string>>>;

export const LEAD_FIELDS: readonly LeadField[] = ["name", "email", "profile", "phone", "company", "message"];

/**
 * Campo-isca: fica fora da vista e do teclado. Gente não preenche; robô que preenche
 * tudo, sim. Quem decide o que fazer é o servidor (`lead-handler.ts`).
 */
export const HONEYPOT_FIELD = "website";

export type LeadValidation =
  | { readonly ok: true; readonly lead: Lead }
  | { readonly ok: false; readonly errors: LeadErrors };

function isLeadField(value: unknown): value is LeadField {
  return typeof value === "string" && (LEAD_FIELDS as readonly string[]).includes(value);
}

/** Valida dado de origem desconhecida. No erro, devolve a primeira mensagem de cada campo. */
export function validateLead(raw: unknown): LeadValidation {
  const parsed = leadSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, lead: parsed.data };
  }
  const errors: Partial<Record<LeadField, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (isLeadField(field) && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  if (Object.keys(errors).length === 0) {
    // O dado nem é um objeto: aponta para o primeiro campo obrigatório.
    return { ok: false, errors: { name: "Informe seu nome." } };
  }
  return { ok: false, errors };
}

/** Mensagem de erro de um campo só (validação ao sair do campo), ou `null` se está certo. */
export function validateLeadField(field: LeadField, value: string): string | null {
  const parsed = leadSchema.shape[field].safeParse(value);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
}

export function isHoneypotTripped(raw: unknown): boolean {
  if (raw === null || typeof raw !== "object") {
    return false;
  }
  const value: unknown = (raw as Readonly<Record<string, unknown>>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim() !== "";
}
