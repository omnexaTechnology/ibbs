import { expect, test } from "@playwright/test";

const NIGHT = "rgb(11, 17, 32)"; // --night #0B1120
const CREAM = "rgb(245, 242, 236)"; // --cream #F5F2EC

test.describe("theme", () => {
  test("defaults to light", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(CREAM);
  });

  test("AC-003: dark choice survives reload with no flash", async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId("theme-toggle").first().first().click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("ibss-theme"))).toBe("dark");

    // Record the state at DOMContentLoaded (before React hydrates / any paint-after-script work).
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as Record<string, unknown>).__early = {
          cls: document.documentElement.className,
          bg: getComputedStyle(document.body).backgroundColor,
        };
      });
    });
    await page.reload();
    const early = (await page.evaluate(() => (window as unknown as Record<string, unknown>).__early)) as {
      cls: string;
      bg: string;
    };
    expect(early.cls).toContain("dark");
    expect(early.bg).toBe(NIGHT);
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("theme is shared across locales and pages", async ({ page }) => {
    await page.goto("/en/about");
    await page.getByTestId("theme-toggle").first().first().click();
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("toggling back to light persists", async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId("theme-toggle").first().first().click();
    await page.getByTestId("theme-toggle").first().first().click();
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
