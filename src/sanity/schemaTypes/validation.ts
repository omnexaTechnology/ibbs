import type { CustomValidator } from "sanity";

type Locale = { en?: string; ar?: string } | undefined;

const filled = (v: string | undefined) => typeof v === "string" && v.trim().length > 0;

/** True when both the English and the Arabic text are filled in. */
export function hasBothLocales(value: Locale): boolean {
  return filled(value?.en) && filled(value?.ar);
}

/** Validator: English AND Arabic are required (BR-004 title). */
export const requireBothLocales: CustomValidator<Locale> = (value) =>
  hasBothLocales(value) ? true : "Fill in both the English and the Arabic text.";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** BR-001: lowercase letters, digits and single dashes only (e.g. "executive-hq"). */
export function isKebabSlug(value: string | undefined): boolean {
  return typeof value === "string" && KEBAB.test(value);
}

export const requireKebabSlug: CustomValidator<{ current?: string } | undefined> = (value) =>
  isKebabSlug(value?.current)
    ? true
    : "Use lowercase letters, numbers and single dashes only, e.g. executive-hq.";

/** WhatsApp number: international format, digits only, no "+" or spaces. */
export function isWhatsappNumber(value: string | undefined): boolean {
  return value === undefined || value === "" || /^[1-9]\d{7,14}$/.test(value);
}

export const requireWhatsappNumber: CustomValidator<string | undefined> = (value) =>
  isWhatsappNumber(value)
    ? true
    : "Digits only, with the country code, no + or spaces. Example: 966501234567.";
