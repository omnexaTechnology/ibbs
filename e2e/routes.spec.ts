import { expect, test } from "@playwright/test";

const ROUTES = ["", "/about", "/projects", "/projects/exec-hq", "/contact", "/privacy", "/terms"];

for (const locale of ["en", "ar"] as const) {
  for (const route of ROUTES) {
    test(`REQ-002: /${locale}${route} renders inside the shell`, async ({ page }) => {
      const res = await page.goto(`/${locale}${route}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByTestId("page-title")).toBeVisible();
      await expect(page.getByTestId("site-header")).toBeVisible();
      await expect(page.getByTestId("site-footer")).toBeVisible();
    });
  }
}

test("AC-002: switching language on a project page keeps the slug", async ({ page }) => {
  await page.goto("/en/projects/exec-hq");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/ar\/projects\/exec-hq$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/en\/projects\/exec-hq$/);
});

test("language switch keeps the query string", async ({ page }) => {
  await page.goto("/en/projects?category=mosque");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/ar\/projects\?category=mosque$/);
});

test("Projects is the active nav item on a project page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/projects/exec-hq");
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Projects");
});

test("footer category links open the filtered projects page", async ({ page }) => {
  await page.goto("/en");
  await page.getByTestId("site-footer").getByRole("link", { name: "Mosques" }).click();
  await expect(page).toHaveURL(/\/en\/projects\?category=mosque$/, { timeout: 4000 });
  await expect(page.getByTestId("page-transition")).toHaveCount(0, { timeout: 5000 });
});

test("legal links reach privacy and terms", async ({ page }) => {
  await page.goto("/en");
  await page.getByTestId("site-footer").getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/, { timeout: 4000 });
});
