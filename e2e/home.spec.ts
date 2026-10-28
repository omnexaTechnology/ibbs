import { expect, test } from "@playwright/test";

for (const locale of ["en", "ar"] as const) {
  test.describe(`REQ-001/002: home part 1 (${locale})`, () => {
    test("hero, partners, kinetic band, about intro and sectors render; placeholder stats are hidden", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      const hero = page.getByTestId("home-hero");
      await expect(hero).toBeVisible();
      await expect(hero.getByTestId("carousel-slide")).toHaveCount(4);
      await expect(hero.locator("h1")).toHaveCount(1); // R3-09: only slide 1 has the h1
      await expect(hero.locator(".ui-fan-c")).toHaveCount(4);
      // R3-07: the hero reaches the bottom of the viewport (no cream strip under it)
      const box = (await hero.boundingBox())!;
      expect(Math.abs(box.y + box.height - 900)).toBeLessThanOrEqual(2);
      await expect(hero.locator(".ui-car-dot")).toHaveCount(4);
      await expect(page.getByTestId("home-partners")).toBeVisible();
      await expect(page.getByTestId("home-kinetic")).toBeAttached();
      await expect(page.getByTestId("home-about")).toBeVisible();
      await expect(page.getByTestId("client-tab")).toHaveCount(6);
      // BR-003: all design stats are placeholders until the client confirms them.
      await expect(page.getByTestId("home-stats")).toHaveCount(0);
      // NFR-002: no Three.js on this page.
      const scripts = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name).filter((n) => /three/i.test(n)));
      expect(scripts).toEqual([]);
    });

    test("hero dots change the slide; hotspot pins are mirrored with the image in Arabic (BR-002)", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}`);
      const slides = page.getByTestId("home-hero").getByTestId("carousel-slide");
      await expect(slides.nth(0)).toHaveAttribute("data-active", "true");
      const pin = slides.nth(0).getByTestId("hotspot").first();
      await expect(pin).toHaveAttribute("data-x", locale === "ar" ? "26" : "74");
      await page.locator(".ui-car-dot").nth(1).click();
      await expect(slides.nth(1)).toHaveAttribute("data-active", "true");
    });

    test("a thumbnail card jumps to its slide; the Mode box sets the theme", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}`);
      const slides = page.getByTestId("home-hero").getByTestId("carousel-slide");
      await page.locator('.ui-fan-c[data-k="2"]').click();
      await expect(slides.nth(2)).toHaveAttribute("data-active", "true");
      const box = page.getByTestId("mode-box");
      await box.getByRole("button", { name: /dark/i }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await box.getByRole("button", { name: /light/i }).click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });

    test("a client sector tab switches the logo rows", async ({ page }) => {
      await page.goto(`/${locale}`);
      const tabs = page.getByTestId("client-tab");
      await tabs.nth(5).scrollIntoViewIfNeeded();
      await tabs.nth(5).click();
      await expect(tabs.nth(5)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("client-card")).toHaveCount(16);
    });

    test("no horizontal overflow at 390px", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}`);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  });
}

test("hero respects reduced motion: the slide does not auto-advance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const slides = page.getByTestId("home-hero").getByTestId("carousel-slide");
  await page.waitForTimeout(5800);
  await expect(slides.nth(0)).toHaveAttribute("data-active", "true");
});
