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

test("proxy does not touch /api, /studio, static files", async ({ request }) => {
  const r = await request.get("/studio", { maxRedirects: 0 });
  expect(r.headers()["location"] ?? "").not.toMatch(/\/(en|ar)\/studio/);
  const f = await request.get("/favicon.ico", { maxRedirects: 0 });
  expect(f.headers()["location"] ?? "").not.toMatch(/\/(en|ar)\//);
});
