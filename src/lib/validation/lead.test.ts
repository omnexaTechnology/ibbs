import { describe, expect, it } from "vitest";
import { isValidPhone, leadSchema, normalizePhone, toFieldErrors, toPagePath } from "./lead";

describe("phone validation (BR-002)", () => {
  it.each(["0501234567", "501234567", "+966501234567", "966501234567", "00966501234567", "+966 50 123 4567", "050-123-4567", "٠٥٠١٢٣٤٥٦٧", "+971501234567", "+44 20 7946 0958", "0044 20 7946 0958", "+966 11 123 4567"])("accepts %s", (p) => {
    expect(isValidPhone(p)).toBe(true);
  });
  it.each(["", "123", "0401234567", "abc", "0501234", "+1234567890123456"])("rejects %j", (p) => {
    expect(isValidPhone(p)).toBe(false);
  });
  it.each(["‪+966 50 123 4567‬", "＋966501234567", "011 234 5678", "0112345678", "966112345678", "920012345", "+966 05 0123 4567"])("accepts %j", (p) => {
    expect(isValidPhone(p)).toBe(true);
  });
  it.each(["0096650123", "+96650123", "+9660"])("rejects %j", (p) => {
    expect(isValidPhone(p)).toBe(false);
  });
  it("drops the trunk 0 after +966", () => {
    expect(normalizePhone("+966 05 0123 4567")).toBe("+966501234567");
    expect(normalizePhone("00966 050 123 4567")).toBe("+966501234567");
  });
  it("normalizes to digits with a leading +", () => {
    expect(normalizePhone("+966 (50) 123-4567")).toBe("+966501234567");
    expect(normalizePhone("0044 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("٠٥٠١٢٣٤٥٦٧")).toBe("+966501234567");
  });
  it.each(["0501234567", "501234567", "966501234567", "+966501234567", "00966 50 123 4567"])("stores mobile %s as +966501234567 (R2-06)", (p) => {
    expect(normalizePhone(p)).toBe("+966501234567");
  });
  it.each(["011 234 5678", "966112345678", "+966 011 234 5678"])("stores landline %s as +966112345678 (R2-06)", (p) => {
    expect(normalizePhone(p)).toBe("+966112345678");
  });
  it("leaves 9200 / 800 numbers as digits and foreign numbers alone (R2-06)", () => {
    expect(normalizePhone("920 012 345")).toBe("920012345");
    expect(normalizePhone("800 124 6000")).toBe("8001246000");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });
});

describe("page path (F4-08, R2-05)", () => {
  it.each(["/en", "/ar", "/en/contact", "/ar/projects/some-slug"])("keeps %s", (p) => expect(toPagePath(p)).toBe(p));
  it.each(["//evil.test/x", "/www.evil.test/login", "/", "/english", "/fr/x", "https://evil.test/en", "en/contact"])("drops %s", (p) => expect(toPagePath(p)).toBeUndefined());
});

describe("leadSchema", () => {
  const base = { formType: "contact", locale: "en", name: "A", phone: "0501234567", message: "hi" };
  it("blank optional fields become undefined", () => {
    const r = leadSchema.parse({ ...base, company: "  ", email: "", area: "" });
    expect(r.company).toBeUndefined();
    expect(r.email).toBeUndefined();
  });
  it("reports a missing phone as phoneRequired", () => {
    const r = leadSchema.safeParse({ ...base, phone: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(toFieldErrors(r.error).phone).toBe("phoneRequired");
  });
  it("rejects an unknown space type", () => {
    expect(leadSchema.safeParse({ ...base, spaceType: "castle" }).success).toBe(false);
  });
});
