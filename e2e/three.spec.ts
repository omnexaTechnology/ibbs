import { expect, test } from "@playwright/test";

test.describe("3D scene root", () => {
  test("mounts a canvas near the viewport and draws something", async ({ page }) => {
    await page.goto("/en/e2e-fixtures");
    const root = page.getByTestId("scene-root");
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute("data-scene-status", "ready", { timeout: 20_000 });
    const canvas = root.locator("canvas");
    await expect(canvas).toHaveCount(1);
    // Something was drawn: a flat colour compresses to a tiny PNG, a lit furnished scene does not.
    // (Reading the WebGL canvas back would be blank: the drawing buffer is not preserved.)
    const shot = await root.screenshot({ path: process.env.SCENE_SHOT });
    expect(shot.length).toBeGreaterThan(15_000);
  });

  test("does not create a canvas while far from the viewport", async ({ page }) => {
    await page.goto("/en/e2e-fixtures");
    await expect(page.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "idle");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("REQ-013: without WebGL the still image stays and a note is shown", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/.test(type)) return null;
        return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof orig;
    });
    await page.goto("/en/e2e-fixtures");
    const root = page.getByTestId("scene-root");
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute("data-scene-status", "unsupported");
    await expect(page.getByTestId("still")).toBeVisible();
    await expect(page.getByTestId("scene-caption")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("primitives: counter ends at its value and hotspot mirrors in Arabic", async ({ page }) => {
    await page.goto("/en/e2e-fixtures");
    await expect(page.getByTestId("counter-final")).toHaveText("120+");
    await expect(page.getByTestId("hotspot")).toHaveCSS("left", /\d/);
    const ltr = await page.getByTestId("hotspot").getAttribute("data-x");
    await page.goto("/ar/e2e-fixtures");
    const rtl = await page.getByTestId("hotspot").getAttribute("data-x");
    expect(Number(ltr)).toBe(20);
    expect(Number(rtl)).toBe(80);
  });
});
