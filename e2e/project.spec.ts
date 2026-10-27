import { expect, test } from "@playwright/test";

// Uses the seeded Sanity project "exec-hq" (npm run seed), like routes.spec.ts. Its client name is empty,
// it has 4 gallery images, 3 hotspots and two related projects in the same sector.
const SLUG = "exec-hq";

test.describe("REQ-009: project page", () => {
  test("EN: facts, challenge/solution, scope, gallery, form slot and related projects", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const res = await page.goto(`/en/projects/${SLUG}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("page-title")).toBeVisible();
    await expect(page).toHaveTitle(/IBSS Innovations/);

    const facts = page.getByTestId("project-facts");
    await expect(facts).toContainText("Total area");
    await expect(facts).toContainText("Year");
    // BR-003: no client name in the data, so no client row.
    await expect(page.getByTestId("fact-client")).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "What the space required" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How we delivered it" })).toBeVisible();
    await expect(page.getByTestId("project-scope").locator("li").first()).toBeVisible();
    await expect(page.getByTestId("hotspot")).toHaveCount(3);

    await expect(page.getByTestId("project-form-slot").locator('[data-slot="project-form"]')).toHaveCount(1);
    await expect(page.getByTestId("related-card").first()).toBeVisible();
    // Related projects never include the project itself.
    await expect(page.locator(`[data-testid="related-card"][href$="/projects/${SLUG}"]`)).toHaveCount(0);
  });

  test("gallery: thumbnails change the stage, the stage opens the lightbox, Esc closes it", async ({ page }) => {
    await page.goto(`/en/projects/${SLUG}`);
    const slides = page.getByTestId("gallery-slide");
    await expect(slides).toHaveCount(4);
    await expect(slides.nth(0)).toHaveAttribute("data-active", "true");
    await page.getByTestId("gallery-thumbs").getByRole("button").nth(2).click();
    await expect(slides.nth(2)).toHaveAttribute("data-active", "true");

    await page.getByTestId("gallery-open").click();
    const lb = page.getByTestId("lightbox");
    await expect(lb).toBeVisible();
    await expect(lb).toContainText("3 / 4");
    await page.keyboard.press("ArrowRight");
    await expect(lb).toContainText("4 / 4");
    await page.keyboard.press("Escape");
    await expect(lb).toHaveCount(0);
  });

  test("AR: right-to-left page, translated copy and hotspots NOT mirrored (the image is not flipped either)", async ({ page }) => {
    await page.goto(`/en/projects/${SLUG}`);
    const en = await page.getByTestId("hotspot").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-x"))));

    const res = await page.goto(`/ar/projects/${SLUG}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "تفاصيل المشروع" })).toBeVisible();
    const ar = await page.getByTestId("hotspot").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-x"))));
    expect(ar).toHaveLength(en.length);
    expect(ar).toEqual(en);
    // Nothing overflows horizontally.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("mobile (390px): no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/en/projects/${SLUG}`);
    await expect(page.getByTestId("page-title")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("an unknown slug answers a localized 404", async ({ page }) => {
    const res = await page.goto("/en/projects/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("not-found")).toBeVisible();
  });

  test("no Three.js on the project page", async ({ page }) => {
    await page.goto(`/en/projects/${SLUG}`);
    await expect(page.getByTestId("page-title")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
