import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityFetch = vi.fn();
vi.mock("@/sanity/fetch", () => ({ sanityFetch }));

async function load(configured: boolean) {
  vi.resetModules();
  vi.doMock("@/sanity/env", () => ({ isSanityConfigured: configured, projectId: configured ? "p" : "", dataset: "production", apiVersion: "x" }));
  return (await import("./site-settings")).getSiteSettings;
}

beforeEach(() => {
  sanityFetch.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getSiteSettings with Sanity (FEAT-002 T-004)", () => {
  it("without Sanity configuration returns the empty defaults and never calls Sanity", async () => {
    const getSiteSettings = await load(false);
    const s = await getSiteSettings();
    expect(sanityFetch).not.toHaveBeenCalled();
    expect(s.phones).toEqual([]);
    expect(s.whatsapp.number).toBe("");
  });

  it("reads the Sanity document and keeps the SiteSettings shape", async () => {
    sanityFetch.mockResolvedValue({
      phones: [{ label: { en: "Sales", ar: "المبيعات" }, number: "+966 50 123 4567" }],
      whatsappNumber: "966501234567",
      social: { instagram: "https://instagram.com/ibss" },
    });
    const getSiteSettings = await load(true);
    const s = await getSiteSettings();
    expect(sanityFetch).toHaveBeenCalledWith(expect.objectContaining({ tags: ["siteSettings"] }));
    expect(s.phones[0].value).toBe("+966 50 123 4567");
    expect(s.whatsapp.number).toBe("966501234567");
    expect(s.social.instagram).toBe("https://instagram.com/ibss");
    expect(s.social.tiktok).toBe("");
  });

  it("AC-006: a cleared field is hidden (empty), not replaced by a placeholder", async () => {
    sanityFetch.mockResolvedValue({ social: { instagram: "https://instagram.com/ibss", tiktok: null } });
    const getSiteSettings = await load(true);
    expect((await getSiteSettings()).social.tiktok).toBe("");
  });

  it("when no settings document exists yet, returns the defaults", async () => {
    sanityFetch.mockResolvedValue(null);
    const getSiteSettings = await load(true);
    const s = await getSiteSettings();
    expect(s.phones).toEqual([]);
    expect(s.whatsapp.message.en).toContain("IBSS");
  });

  it("F-02: configured but Sanity fails -> throws (build fails loudly, ISR keeps the last good page)", async () => {
    sanityFetch.mockRejectedValue(new Error("network down"));
    const getSiteSettings = await load(true);
    await expect(getSiteSettings()).rejects.toThrow("network down");
  });

  it("R-04: in next dev only, a failed read falls back to the defaults with a warning", async () => {
    sanityFetch.mockRejectedValue(new Error("offline"));
    vi.stubEnv("NODE_ENV", "development");
    const getSiteSettings = await load(true);
    expect((await getSiteSettings()).phones).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "production");
    await expect(getSiteSettings()).rejects.toThrow("offline");
    vi.unstubAllEnvs();
  });

  it("F-02: not configured -> defaults, even if the fetch would fail", async () => {
    sanityFetch.mockRejectedValue(new Error("must not be called"));
    const getSiteSettings = await load(false);
    expect((await getSiteSettings()).emails).toEqual([]);
    expect(sanityFetch).not.toHaveBeenCalled();
  });

  it("F-01: only display fields reach the client components, even if Sanity returns more", async () => {
    sanityFetch.mockResolvedValue({
      phones: [],
      leadNotificationEmails: ["secret@example.com"],
      recipients: ["secret@example.com"],
      _id: "siteSettings",
    });
    const getSiteSettings = await load(true);
    const s = await getSiteSettings();
    expect(Object.keys(s).sort()).toEqual(
      ["address", "emails", "mapUrl", "phones", "social", "website", "whatsapp", "workingHours"],
    );
    expect(JSON.stringify(s)).not.toContain("secret@example.com");
  });
});
