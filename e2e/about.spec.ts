import { expect, test } from "@playwright/test";

for (const locale of ["en", "ar"] as const) {
  test.describe(`REQ-007: about (${locale})`, () => {
    test("renders the sections, hides placeholder stats and keeps the right direction", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}/about`);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByTestId("page-title")).toBeVisible();
      await expect(page.getByTestId("about-who")).toBeVisible();
      await expect(page.getByTestId("about-build")).toBeVisible();
      await expect(page.getByTestId("about-cta")).toBeVisible();
      await expect(page.getByTestId("sector-link")).toHaveCount(6);
      // BR-003: the design figures are placeholders, so the stats band is not rendered
      await expect(page.getByTestId("home-stats")).toHaveCount(0);
    });

    test("tabs switch with the keyboard (direction aware)", async ({ page }) => {
      await page.goto(`/${locale}/about`);
      const tabs = page.getByRole("tab");
      await expect(tabs).toHaveCount(3);
      await tabs.first().focus();
      const next = locale === "ar" ? "ArrowLeft" : "ArrowRight";
      await page.keyboard.press(next);
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.nth(1)).toBeFocused();
      await expect(page.getByRole("tabpanel")).toHaveCount(1);
      await tabs.nth(2).click();
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    });
  });
}

test("B1-01: no Three chunk while the 3D build is far away; it mounts a canvas near the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  const scripts: string[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "script") scripts.push(r.url());
  });
  await page.goto("/en/about", { waitUntil: "networkidle" });
  await expect(page.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "idle");
  await expect(page.locator("canvas")).toHaveCount(0);
  const bodies = await Promise.all(scripts.map((u) => page.request.get(u).then((r) => r.text())));
  expect(bodies.filter((t) => t.includes("WebGLRenderer"))).toHaveLength(0);

  await page.getByTestId("about-build").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "ready", { timeout: 20_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  // the step caption follows the build
  await expect(page.getByTestId("about-build")).toContainText("08 / 08", { timeout: 20_000 });
});
