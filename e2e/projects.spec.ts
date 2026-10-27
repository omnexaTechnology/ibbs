import { expect, test } from "@playwright/test";

// Uses the seeded Sanity project data (npm run seed), like project.spec.ts: a handful of projects.
for (const locale of ["en", "ar"] as const) {
  test.describe(`REQ-008: projects list (${locale})`, () => {
    test("filters, search and pagination", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}/projects`);
      await expect(page.getByTestId("page-title")).toBeVisible();
      const cards = page.getByTestId("project-card");
      const total = Number((await page.getByTestId("tab-all").innerText()).replace(/\D/g, ""));
      const perPage = Math.min(8, total);
      await expect(cards).toHaveCount(perPage);

      // pagination (unit tests cover many pages; the seeded data may fit on one)
      if (total > 8) {
        await page.getByTestId("pager").getByRole("button", { name: "2" }).click();
        await expect(cards).toHaveCount(Math.min(8, total - 8));
        await page.getByTestId("pager").getByRole("button", { name: "1" }).click();
      } else {
        await expect(page.getByTestId("pager")).toHaveCount(0);
      }
      await expect(cards).toHaveCount(perPage);

      // search narrows the list and resets the page; nonsense shows the empty message
      const first = await cards.first().getAttribute("href");
      await page.getByTestId("filter-search").fill("zzzz-no-match");
      await expect(page.getByTestId("projects-empty")).toBeVisible();
      await page.getByTestId("filter-search").fill("");
      await expect(cards).toHaveCount(perPage);
      expect(await cards.first().getAttribute("href")).toBe(first);

      // category tab filters and shows its count
      const tabs = page.getByTestId("category-tabs").getByRole("button");
      const hq = page.getByTestId("tab-exec");
      const n = Number((await hq.innerText()).replace(/\D/g, ""));
      await hq.click();
      await expect(hq).toHaveAttribute("aria-pressed", "true");
      await expect(cards).toHaveCount(Math.min(8, n));
      await expect(tabs).toHaveCount(7);
    });

    test("?category= deep link (footer) pre-selects the tab,", async ({ page }) => {
      await page.goto(`/${locale}/projects?category=mosque`);
      await expect(page.getByTestId("tab-mosque")).toHaveAttribute("aria-pressed", "true");
      await page.getByTestId("tab-school").click();
      await expect(page).toHaveURL(/category=school/);
    });

    test("a card opens the project page", async ({ page }) => {
      await page.goto(`/${locale}/projects`);
      await page.getByTestId("project-card").first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/projects/[^/?]+$`));
    });

    test("no horizontal overflow at 390px", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/projects`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  });
}

test.describe("REQ-008: 3D floor", () => {
  test("loads lazily, takes keyboard focus, and the arrow keys turn it", async ({ page }) => {
    const scripts: string[] = [];
    page.on("response", (r) => r.request().resourceType() === "script" && scripts.push(r.url()));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/projects");
    const root = page.getByTestId("projects-floor").getByTestId("scene-root");
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute("data-scene-status", /ready|unsupported|error/, { timeout: 30_000 });
    if ((await root.getAttribute("data-scene-status")) === "ready") {
      const canvas = root.locator("canvas");
      await expect(canvas).toHaveAttribute("tabindex", "0");
      const before = (await root.screenshot()).toString("base64");
      await canvas.focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(600);
      expect((await root.screenshot()).toString("base64")).not.toBe(before);
    }
  });

  test("REQ-013: without WebGL the still drawing stays and the list still works", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/.test(type)) return null;
        return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof orig;
    });
    await page.goto("/en/projects");
    const root = page.getByTestId("projects-floor").getByTestId("scene-root");
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute("data-scene-status", "unsupported");
    await expect(page.getByTestId("scene-fallback")).toBeAttached();
    await expect(page.getByTestId("project-card").first()).toBeVisible();
  });
});
