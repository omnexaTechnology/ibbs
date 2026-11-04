import { describe, expect, it } from "vitest";
import { alternatesFor, siteUrl } from "./seo";

describe("seo", () => {
  it("builds canonical, hreflang and x-default", () => {
    expect(alternatesFor("ar", "/about")).toEqual({
      canonical: "/ar/about",
      languages: { en: "/en/about", ar: "/ar/about", "x-default": "/en/about" },
    });
  });
  it("siteUrl always returns a URL", () => {
    expect(siteUrl().protocol).toMatch(/^https?:$/);
  });
});

describe("sitemap + JSON-LD", () => {
  it("lists every page and project in both locales, absolute, with hreflang", async () => {
    const { sitemapEntries, SITEMAP_PATHS } = await import("./seo");
    const entries = sitemapEntries(["boardroom"]);
    expect(entries).toHaveLength((SITEMAP_PATHS.length + 1) * 2);
    const ar = entries.find((e) => e.url.endsWith("/ar/projects/boardroom"))!;
    expect(ar.url).toMatch(/^https?:\/\//);
    expect(ar.alternates?.languages).toMatchObject({
      en: expect.stringMatching(/\/en\/projects\/boardroom$/),
      "x-default": expect.stringMatching(/\/en\/projects\/boardroom$/),
    });
  });

  it("escapes < so editor text cannot close the script tag", async () => {
    const { jsonLdHtml } = await import("./seo");
    expect(jsonLdHtml({ name: "</script><b>" })).not.toContain("<");
  });

  it("organization leaves out unset contacts and non-http socials", async () => {
    const { organizationJsonLd } = await import("./seo");
    const base = { phones: [], emails: [], social: { linkedin: "javascript:x", instagram: "", x: "", snapchat: "", tiktok: "" } };
    const org = organizationJsonLd(base as never, "en", "IBSS", "d");
    expect(org).not.toHaveProperty("contactPoint");
    expect(org).not.toHaveProperty("sameAs");
  });
});
