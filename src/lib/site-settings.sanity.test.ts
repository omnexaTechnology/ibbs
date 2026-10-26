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

  it("when Sanity is unreachable, falls back to the defaults instead of throwing", async () => {
    sanityFetch.mockRejectedValue(new Error("network down"));
    const getSiteSettings = await load(true);
    const s = await getSiteSettings();
    expect(s.emails).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });
});
