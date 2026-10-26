import { expect, test } from "@playwright/test";

test.describe("shell", () => {
  test("desktop: header nav, active state, footer, whatsapp", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.locator('[aria-current="page"]')).toHaveText("About Us");
    await expect(page.getByTestId("menu-button")).toBeHidden();
    await expect(page.getByTestId("site-footer")).toBeVisible();
    await expect(page.getByTestId("whatsapp-button")).toHaveAttribute("href", /wa\.me\/966500000000\?text=Hello/);
    // No placeholder "#" links anywhere (social URLs are empty by default).
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    await expect(page.getByTestId("social-links")).toHaveCount(0);
  });

  test("header gets scrolled state after 24px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 500 });
    await page.goto("/en/about");
    const header = page.getByTestId("site-header");
    await expect(header).toHaveAttribute("data-scrolled", "false");
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(header).toHaveAttribute("data-scrolled", "true");
  });

  test("mobile (390px): menu works by keyboard, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/ar");
    const nav = page.getByRole("navigation", { name: "التنقل الرئيسي" });
    await expect(nav).toBeHidden();
    const button = page.getByTestId("menu-button");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("mobile-menu")).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-menu")).toHaveCount(0);
    await expect(button).toBeFocused();
    await button.click();
    await page.getByTestId("mobile-menu").getByRole("link", { name: "عن الشركة" }).or(
      page.getByTestId("mobile-menu").getByRole("link").nth(1),
    ).first().click();
    await expect(page).toHaveURL(/\/ar\/about$/);
    await expect(page.getByTestId("mobile-menu")).toHaveCount(0);
    // No horizontal overflow at 390px in RTL.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("theme toggle and language switch are keyboard reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await page.getByTestId("theme-toggle").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByTestId("lang-switch").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("screenshots for manual RTL review", async ({ page }) => {
    for (const [w, h] of [
      [1440, 900],
      [390, 800],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      for (const loc of ["en", "ar"]) {
        await page.goto(`/${loc}/about`);
        await page.screenshot({ path: `test-results/shell-${loc}-${w}.png`, fullPage: true });
      }
    }
  });
});
