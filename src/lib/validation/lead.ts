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

/** Server-side body limit (characters). A real submission is well under 10 KB. */
export const MAX_BODY_CHARS = 20_000;
/** A human needs longer than this to fill a form; faster = bot (AC-003). */
export const MIN_FILL_MS = 2_000;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** ASCII digits (also from Arabic-Indic), optional leading +; spaces, dashes, dots, brackets removed; "00" becomes "+". */
export function normalizePhone(input: string): string {
  const ascii = input
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EASTERN_ARABIC_INDIC.indexOf(d)));
  const cleaned = ascii.replace(/[\s\-().‎‏]/g, "");
  return cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
}

// Saudi mobile: 05xxxxxxxx, 5xxxxxxxx, 9665xxxxxxxx, +9665xxxxxxxx.  International: + and 7-15 digits (E.164).
const SAUDI_MOBILE = /^(?:\+?966|0)?5\d{8}$/;
const INTERNATIONAL = /^\+[1-9]\d{6,14}$/;

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input);
  return SAUDI_MOBILE.test(n) || INTERNATIONAL.test(n);
}

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
    pageUrl: optionalText(500),
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
    area: optionalText(20),
    message: optionalText(5000),
    /** Honeypot: real visitors never see or fill it. */
    website: z.string().max(500).optional(),
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
