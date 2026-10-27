import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { PROJECT_CATEGORY_KEYS, SCOPE_KEYS, projectCategories, scopeItems } from "./taxonomy";

type Msgs = { projects: Record<string, string>; footer: Record<string, string> };

describe("taxonomy", () => {
  it("has every category and scope key from the design, in order", () => {
    expect(projectCategories.map((c) => c.key)).toEqual([...PROJECT_CATEGORY_KEYS]);
    expect(scopeItems.map((s) => s.key)).toEqual([...SCOPE_KEYS]);
  });
  it("has en and ar text and an icon for each entry", () => {
    for (const e of [...projectCategories, ...scopeItems]) {
      expect(e.label.en && e.label.ar && e.icon).toBeTruthy();
    }
    for (const s of scopeItems) expect(s.description.en && s.description.ar).toBeTruthy();
  });
  it("category labels agree with the design strings in the messages", () => {
    const m = { hq: "fHq", exec: "fExec", health: "fHealth", mosque: "fMosque", school: "fSchool", uni: "fUni" } as const;
    const lookup = (msgs: Msgs, key: string) => msgs.projects[key] ?? msgs.footer[key];
    for (const c of projectCategories) {
      expect(c.label.en).toBe(lookup(en as Msgs, m[c.key]));
      expect(c.label.ar).toBe(lookup(ar as Msgs, m[c.key]));
    }
  });
});
