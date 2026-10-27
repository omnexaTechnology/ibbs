import { describe, expect, it } from "vitest";
import { localize, socialLinks, toTelHref, usableEntries, whatsappHref } from "./contact";
import { getSiteSettings } from "./site-settings";

describe("getSiteSettings", () => {
  it("is async and returns an independent copy each call", async () => {
    const a = await getSiteSettings();
    a.phones.push({ label: { en: "", ar: "" }, value: "x" });
    const b = await getSiteSettings();
    expect(b.phones).toEqual([]);
  });

  it("ships NO placeholder contact data (FEAT-002 BR-009)", async () => {
    const s = await getSiteSettings();
    expect(s.phones).toEqual([]);
    expect(s.emails).toEqual([]);
    expect(s.website).toBe("");
    expect(s.whatsapp.number).toBe("");
    expect(s.workingHours).toEqual([]);
    expect(s.address).toEqual({ en: "", ar: "" });
    expect(s.mapUrl).toBe("");
    expect(Object.values(s.social).every((u) => u === "")).toBe(true);
    expect(s.leadNotificationEmails).toEqual([]);
    expect(JSON.stringify(s)).not.toMatch(/example\.com|000 000|\[Office|\[عنوان/);
  });

  it("keeps the WhatsApp prefilled message per locale and a stable social key order", async () => {
    const s = await getSiteSettings();
    expect(s.whatsapp.message.en).toContain("IBSS Innovations");
    expect(s.whatsapp.message.ar).toBeTruthy();
    expect(Object.keys(s.social)).toEqual(["linkedin", "instagram", "x", "snapchat", "tiktok"]);
  });
});

describe("contact helpers", () => {
  it("toTelHref strips formatting", () => {
    expect(toTelHref("+966 50 000 0000")).toBe("tel:+966500000000");
  });
  it("usableEntries trims and drops blank values", () => {
    const l = { en: "", ar: "" };
    expect(usableEntries([{ label: l, value: " a " }, { label: l, value: "" }, { label: l, value: "  " }])).toEqual([
      { label: l, value: "a" },
    ]);
  });
  it("localize falls back to the other locale", () => {
    expect(localize({ en: "x", ar: "" }, "ar")).toBe("x");
    expect(localize({ en: "", ar: "y" }, "en")).toBe("y");
  });
  it("whatsappHref is null without a number and encodes the message", async () => {
    const s = { ...(await getSiteSettings()) };
    s.whatsapp = { ...s.whatsapp, number: "966500000000" };
    expect(whatsappHref(await getSiteSettings(), "en")).toBeNull();
    expect(whatsappHref({ ...s, whatsapp: { ...s.whatsapp, number: " " } }, "en")).toBeNull();
    expect(whatsappHref(s, "en")).toContain("?text=Hello%20IBSS");
  });
  it("socialLinks skips empty and whitespace URLs", async () => {
    const s = await getSiteSettings();
    expect(socialLinks(s)).toEqual([]);
    expect(socialLinks({ ...s, social: { ...s.social, x: " https://x.com/ibss ", snapchat: "  " } })).toEqual([
      { platform: "x", url: "https://x.com/ibss" },
    ]);
  });
});
