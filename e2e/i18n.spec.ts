import { expect, test } from "@playwright/test";

test.describe("locale routing, direction and fonts", () => {
  test("AC-001: /ar/about is RTL with Alexandria", async ({ page }) => {
    await page.goto("/ar/about");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");
    const family = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toContain("alexandria");
    await expect(page.getByTestId("page-title")).toContainText("خبرتنا تظهر");
  });

  test("AC-001: /en/about is LTR with Montserrat", async ({ page }) => {
    await page.goto("/en/about");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
    await expect(html).toHaveAttribute("dir", "ltr");
    const family = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toContain("montserrat");
  });

  test("/ redirects to /en by default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("AC-002: switching language keeps the page", async ({ page }) => {
    await page.goto("/en/about");
    await page.getByTestId("lang-switch").click();
    await expect(page).toHaveURL(/\/ar\/about$/);
    await page.getByTestId("lang-switch").click();
    await expect(page).toHaveURL(/\/en\/about$/);
  });
});

test.describe("browser language redirect", () => {
  test.use({ locale: "ar-SA", extraHTTPHeaders: { "Accept-Language": "ar-SA,ar;q=0.9" } });
  test("/ redirects to /ar for an Arabic browser", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
  });
});

test.describe("proxy matcher (F-02)", () => {
  for (const path of ["/about", "/contact", "/projects/exec-hq", "/projects?category=mosque"]) {
    test(`${path} without a locale redirects to /en${path}`, async ({ request }) => {
      const r = await request.get(path, { maxRedirects: 0 });
      expect(r.status()).toBe(307);
      expect(new URL(r.headers()["location"], "http://x").pathname + new URL(r.headers()["location"], "http://x").search).toBe(
        `/en${path}`,
      );
    });

    test(`${path} redirects to /ar${path} for an Arabic browser`, async ({ request }) => {
      const r = await request.get(path, { maxRedirects: 0, headers: { "Accept-Language": "ar-SA,ar;q=0.9" } });
      expect(r.status()).toBe(307);
      const u = new URL(r.headers()["location"], "http://x");
      expect(u.pathname + u.search).toBe(`/ar${path}`);
    });
  }

  // These are excluded from the proxy: no redirect to a locale-prefixed URL.
  for (const path of ["/studio", "/studio/structure", "/api/x", "/favicon.ico", "/brand/logo-light.png"]) {
    test(`${path} is not redirected`, async ({ request }) => {
      const r = await request.get(path, { maxRedirects: 0 });
      expect(r.status()).not.toBe(307);
      expect(r.headers()["location"] ?? "").toBe("");
    });
  }

  test("a path that merely starts with an excluded word is still localised", async ({ request }) => {
    const r = await request.get("/apiary", { maxRedirects: 0 });
    expect(r.status()).toBe(307);
  });
});
