import { z } from "zod";

/**
 * Lead form schema, shared by the browser (inline errors) and POST /api/leads (the server never
 * trusts the browser). Error messages are KEYS into `messages/*.json` -> `forms.errors.*`, so the
 * same failure is shown in the visitor's language (REQ-004). No server-only imports here.
 */

export const FORM_TYPES = ["contact", "project", "call"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const LOCALES = ["en", "ar"] as const;

/** Space-type keys (labels live in `forms.spaceTypes`). The English label is what gets stored/emailed. */
export const SPACE_TYPE_LABELS_EN = {
  hq: "Complete company headquarters",
  offices: "Administrative & executive offices",
  meeting: "Meeting rooms",
  medical: "Medical centre",
  school: "School",
  university: "University",
  mosque: "Mosque",
  other: "Other",
} as const;
export type SpaceTypeKey = keyof typeof SPACE_TYPE_LABELS_EN;
export const SPACE_TYPE_KEYS = Object.keys(SPACE_TYPE_LABELS_EN) as [SpaceTypeKey, ...SpaceTypeKey[]];

export const ERROR_KEYS = ["nameRequired", "phoneRequired", "phoneInvalid", "emailInvalid", "emailOrMessage", "tooLong", "invalid"] as const;
export type ErrorKey = (typeof ERROR_KEYS)[number];

/** Server-side body limit in BYTES (UTF-8). A real submission is well under 20 KB. */
export const MAX_BODY_BYTES = 20_000;
/** A human needs longer than this to fill a form; faster = bot (AC-003). */
export const MIN_FILL_MS = 2_000;

/** Honeypot field name: deliberately not a real-world field name, so password managers do not autofill it (F4-07). */
export const HONEYPOT_FIELD = "hp_extra";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic, Eastern Arabic-Indic and full-width digits become ASCII digits. */
export function normalizeDigits(input: string): string {
  return input
    .normalize("NFKC") // full-width digits/plus, NBSP and similar compatibility forms
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EASTERN_ARABIC_INDIC.indexOf(d)));
}

/**
 * ASCII digits and an optional leading +. Removes spaces (incl. NBSP), dashes, dots, brackets and all
 * invisible format/bidi marks (LRM/RLM, U+202A-202E, U+2066-2069, ...). "00" becomes "+", and the
 * trunk 0 after the Saudi country code is dropped ("+966 05..." -> "+9665...").
 */
export function normalizePhone(input: string): string {
  const cleaned = normalizeDigits(input).replace(/[\s\p{Cf}\p{Pd}−().]/gu, "");
  const intl = cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
  const noTrunk = intl.replace(/^(\+?966)0(?=\d)/, "$1");
  // One stored shape per Saudi number: +9665XXXXXXXX (mobile), +9661XXXXXXXX (landline). 9200/800 stay digits (R2-06).
  return noTrunk.replace(/^(?:\+?966|0)?(5\d{8}|1[1-467]\d{7})$/, "+966$1");
}

// Saudi mobile: 05xxxxxxxx, 5xxxxxxxx, 9665xxxxxxxx, +9665xxxxxxxx.
const SAUDI_MOBILE = /^(?:\+?966|0)?5\d{8}$/;
// Saudi landline: 01x xxxxxxx (011 Riyadh, 012 Jeddah, 013, 014, 016, 017), also with 966 / +966.
const SAUDI_LANDLINE = /^(?:\+?966|0)1[1-467]\d{7}$/;
// Unified numbers: 9200xxxxx and 800xxxxxxx.
const SAUDI_UNIFIED = /^(?:9200\d{5}|800\d{7})$/;
const INTERNATIONAL = /^\+[1-9]\d{6,14}$/;

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input);
  if (SAUDI_MOBILE.test(n) || SAUDI_LANDLINE.test(n) || SAUDI_UNIFIED.test(n)) return true;
  // Anything claiming to be Saudi (+966...) must follow the Saudi rules above, not the generic E.164 rule.
  if (n.startsWith("+966")) return false;
  return INTERNATIONAL.test(n);
}

/** Only a same-site locale path (/en, /ar, /en/..., /ar/...) is accepted for the "sent from" line (F4-08); anything else is dropped. */
const PATH = /^\/(?:en|ar)(?:\/[\w\-/%.~]{0,190})?$/;
export const toPagePath = (input: string | undefined) => (input && PATH.test(input) ? input : undefined);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => v || undefined);

export const leadSchema = z
  .object({
    formType: z.enum(FORM_TYPES),
    locale: z.enum(LOCALES),
    pageUrl: optionalText(500).transform(toPagePath),
    name: optionalText(120),
    company: optionalText(160),
    email: z
      .string()
      .trim()
      .max(254, "tooLong")
      .optional()
      .transform((v) => v || undefined)
      .pipe(z.email("emailInvalid").optional()),
    phone: z
      .string("phoneRequired")
      .trim()
      .min(1, "phoneRequired")
      .max(40, "phoneInvalid")
      .refine(isValidPhone, "phoneInvalid")
      .transform(normalizePhone),
    spaceType: z
      .string()
      .optional()
      .transform((v) => v || undefined)
      .pipe(z.enum(SPACE_TYPE_KEYS).optional()),
    area: optionalText(20).transform((v) => (v ? normalizeDigits(v) : v)),
    message: optionalText(5000),
    /** Honeypot: real visitors never see or fill it. */
    hp_extra: z.string().max(500).optional(),
    /** Milliseconds between rendering the form and submitting it (measured in the browser). */
    elapsedMs: z.number().finite().nonnegative().optional(),
  })
  .superRefine((v, ctx) => {
    // BR-001: name, phone, and email or message. The quick call form only needs a phone (REQ-002).
    if (v.formType === "call") return;
    if (!v.name) ctx.addIssue({ code: "custom", path: ["name"], message: "nameRequired" });
    if (!v.email && !v.message) ctx.addIssue({ code: "custom", path: ["email"], message: "emailOrMessage" });
  });

export type LeadInput = z.infer<typeof leadSchema>;

export type FieldErrors = Partial<Record<string, ErrorKey>>;

const KNOWN = new Set<string>(ERROR_KEYS);

/** First error per field, as message keys (unknown zod messages collapse to "invalid"). */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (out[field]) continue;
    out[field] = KNOWN.has(issue.message) ? (issue.message as ErrorKey) : "invalid";
  }
  return out;
}

export type LeadResponse =
  | { ok: true }
  | { ok: false; error: "invalid"; fields: FieldErrors }
  | { ok: false; error: "too_large" | "delivery_failed" };
