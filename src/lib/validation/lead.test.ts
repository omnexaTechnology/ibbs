import { describe, expect, it } from "vitest";
import { isValidPhone, leadSchema, normalizePhone, toFieldErrors } from "./lead";

describe("phone validation (BR-002)", () => {
  it.each(["0501234567", "501234567", "+966501234567", "966501234567", "00966501234567", "+966 50 123 4567", "050-123-4567", "٠٥٠١٢٣٤٥٦٧", "+971501234567", "+44 20 7946 0958", "0044 20 7946 0958", "+966 11 123 4567"])("accepts %s", (p) => {
    expect(isValidPhone(p)).toBe(true);
  });
  it.each(["", "123", "0401234567", "abc", "0501234", "+1234567890123456"])("rejects %j", (p) => {
    expect(isValidPhone(p)).toBe(false);
  });
  it("normalizes to digits with a leading +", () => {
    expect(normalizePhone("+966 (50) 123-4567")).toBe("+966501234567");
    expect(normalizePhone("0044 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("٠٥٠١٢٣٤٥٦٧")).toBe("0501234567");
  });
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
