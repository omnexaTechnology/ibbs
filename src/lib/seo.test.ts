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
