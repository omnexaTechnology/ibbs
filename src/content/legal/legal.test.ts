import { describe, expect, it } from "vitest";
import { getLegalDoc } from ".";

describe("legal content", () => {
  for (const kind of ["privacy", "terms"] as const) {
    it(`${kind}: English and Arabic have the same number of non-empty sections`, () => {
      const en = getLegalDoc("en", kind);
      const ar = getLegalDoc("ar", kind);
      expect(en.sections.length).toBeGreaterThanOrEqual(5);
      expect(ar.sections).toHaveLength(en.sections.length);
      for (const doc of [en, ar]) {
        expect(doc.title).toBeTruthy();
        expect(doc.lead).toBeTruthy();
        for (const s of doc.sections) {
          expect(s.heading).toBeTruthy();
          expect(s.body.every(Boolean) && s.body.length > 0).toBe(true);
        }
      }
    });
  }

  it("falls back to English for an unknown locale", () => {
    expect(getLegalDoc("fr", "privacy")).toBe(getLegalDoc("en", "privacy"));
  });
});
