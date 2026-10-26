import { describe, expect, it } from "vitest";
import { localize, nonEmpty, socialLinks, toTelHref, whatsappHref } from "./contact";
import { getSiteSettings } from "./site-settings";

describe("getSiteSettings", () => {
  it("is async and returns an independent copy each call", async () => {
    const a = await getSiteSettings();
    a.phones.push("x");
    const b = await getSiteSettings();
    expect(b.phones).not.toContain("x");
  });

  it("matches the design defaults", async () => {
    const s = await getSiteSettings();
    expect(s.whatsapp.number).toBe("966500000000");
    expect(s.emails).toEqual(["info@example.com", "sales@example.com"]);
    expect(s.leadNotificationEmails).toEqual([]);
    expect(Object.keys(s.social)).toEqual(["linkedin", "instagram", "x", "snapchat", "tiktok"]);
  });
});

describe("contact helpers", () => {
  it("toTelHref strips formatting", () => {
    expect(toTelHref("+966 50 000 0000")).toBe("tel:+966500000000");
  });
  it("nonEmpty trims and drops blanks", () => {
    expect(nonEmpty([" a ", "", "  "])).toEqual(["a"]);
  });
  it("localize falls back to the other locale", () => {
    expect(localize({ en: "x", ar: "" }, "ar")).toBe("x");
    expect(localize({ en: "", ar: "y" }, "en")).toBe("y");
  });
  it("whatsappHref is null without a number and encodes the message", async () => {
    const s = await getSiteSettings();
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
