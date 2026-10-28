/** One numbered section of a legal page. `body` is a list of paragraphs. */
export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; lead: string; sections: LegalSection[] };
export type LegalKind = "privacy" | "terms";
