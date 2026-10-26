import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

/** Flatten nested messages to dot-separated key paths. */
function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  const enKeys = keyPaths(en).sort();
  const arKeys = keyPaths(ar).sort();

  it("en and ar have identical key sets", () => {
    const missingInAr = enKeys.filter((k) => !arKeys.includes(k));
    const missingInEn = arKeys.filter((k) => !enKeys.includes(k));
    expect({ missingInAr, missingInEn }).toEqual({ missingInAr: [], missingInEn: [] });
  });

  it("contains the full set of design strings", () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(300);
  });

  it("every Arabic value is a string (empty allowed only if the English one is empty)", () => {
    const flat = (o: Record<string, unknown>): Record<string, string> =>
      Object.fromEntries(keyPaths(o).map((p) => [p, p.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown>)[k], o) as string]));
    const e = flat(en);
    const a = flat(ar);
    for (const k of Object.keys(e)) {
      expect(typeof a[k]).toBe("string");
      if (e[k] !== "") expect(a[k], k).not.toBe("");
    }
  });
});
