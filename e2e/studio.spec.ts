import { expect, test } from "@playwright/test";

// FEAT-002 REQ-001 / T-001: the embedded Sanity Studio lives outside the locale routing.
test("REQ-001: /studio responds and is not redirected to a locale", async ({ request }) => {
  const res = await request.get("/studio", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<meta name="robots" content="noindex"/>');
  // Own root layout: none of the site shell is rendered.
  expect(html).not.toContain('data-testid="site-header"');
});

test("REQ-001: /studio sub-routes are not locale-redirected either", async ({ request }) => {
  const res = await request.get("/studio/structure", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("REQ-001: the Studio page has its own document, not the site's", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByTestId("site-header")).toHaveCount(0);
});
