import type { LegalDoc, LegalKind } from "./types";
import { arLegal } from "./ar";
import { enLegal } from "./en";

export type { LegalDoc, LegalKind, LegalSection } from "./types";

/** Legal document for a locale (falls back to English for an unknown locale). */
export function getLegalDoc(locale: string, kind: LegalKind): LegalDoc {
  return (locale === "ar" ? arLegal : enLegal)[kind];
}
