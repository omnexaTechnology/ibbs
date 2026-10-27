import { expect, test } from "@playwright/test";

test.describe("page transition and cursor (motion allowed)", () => {
  test.use({ viewport: { width: 1280, height: 500 } });

  test("close -> swap -> open on internal navigation, scrolled to top, back/forward work", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => window.scrollTo(0, 300));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const overlay = page.getByTestId("page-transition");
    await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" }).click();

    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText("About Us");
    // Swap happens only after the curtains close (~1.15s): the URL is still the old one.
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/en$/);

    await expect(page).toHaveURL(/\/en\/about$/, { timeout: 3000 });
    // Page is at the top once swapped, then the curtains open and the overlay is removed (~2.4s total).
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByTestId("page-title")).toBeVisible();

    // Back/forward use the browser history without a transition.
    await page.goBack();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
  });

  test("F-05: Back during the closing curtains cancels the pending navigation", async ({ page }) => {
    await page.goto("/en");
    await page.goto("/en/contact");
    await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" }).click();
    await expect(page.getByTestId("page-transition")).toBeVisible();
    await page.waitForTimeout(300);
    await page.goBack();
    await expect(page).toHaveURL(/[/]en$/);
    await page.waitForTimeout(1800); // past the 1.15s swap point
    await expect(page).toHaveURL(/[/]en$/);
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
  });

  test("N-01: a slow navigation keeps the curtains closed until the new page arrives", async ({ page }) => {
    // Delay every RSC (client navigation / prefetch) response for the About page by 4s.
    await page.route("**/en/about**", async (route) => {
      if (route.request().headers()["rsc"]) await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });
    await page.goto("/en");
    const overlay = page.getByTestId("page-transition");
    await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" }).click();
    await page.waitForTimeout(3000); // far past the 1.15s swap point and the old 1.5s timeout
    await expect(overlay).toHaveAttribute("data-phase", "hold");
    await expect(page).toHaveURL(/[/]en$/);
    // Once the page arrives it is revealed by the opening curtains, then the overlay goes.
    await expect(page).toHaveURL(/[/]en[/]about$/, { timeout: 6000 });
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByTestId("page-title")).toBeVisible();
  });

  test("Arabic transition shows the Arabic label", async ({ page }) => {
    await page.goto("/ar");
    await page.getByRole("navigation", { name: "التنقل الرئيسي" }).getByRole("link").nth(1).click();
    const overlay = page.getByTestId("page-transition");
    await expect(overlay).toBeVisible();
    await expect(overlay.locator(".tr-k")).toHaveText("جارٍ فتح");
    await expect(page).toHaveURL(/\/ar\/about$/, { timeout: 3000 });
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
  });

  test("modified clicks open normally without a transition", async ({ page, context }) => {
    await page.goto("/en");
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" }).click({ modifiers: ["Control"] }),
    ]);
    await expect(popup).toHaveURL(/\/en\/about$/);
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
  });

  test("custom cursor is active for a mouse and reacts to links", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveClass(/has-cur/);
    const cursor = page.getByTestId("custom-cursor");
    await page.mouse.move(200, 300);
    await expect(cursor).toHaveAttribute("data-on", "1");
    const link = page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" });
    const box = (await link.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(cursor).toHaveAttribute("data-m", "go");
  });
});

test.describe("touch device (coarse pointer)", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });

  test("no custom cursor", async ({ page }) => {
    await page.goto("/en");
    expect(await page.evaluate(() => matchMedia("(pointer: fine)").matches)).toBe(false);
    await expect(page.locator("html")).not.toHaveClass(/has-cur/);
  });
});

test.describe("AC-004 reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });

  test("no page transition and no custom cursor", async ({ page }) => {
    await page.goto("/en");
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    await expect(page.locator("html")).not.toHaveClass(/has-cur/);
    await expect(page.getByTestId("custom-cursor")).toBeHidden();

    await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "About Us" }).click();
    // Navigates right away: far sooner than the 1.15s curtain close.
    await expect(page).toHaveURL(/\/en\/about$/, { timeout: 1000 });
    // The overlay is never rendered.
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
    await page.waitForTimeout(300);
    await expect(page.getByTestId("page-transition")).toHaveCount(0);
  });
});
