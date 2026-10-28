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
    // B1-01 guard: the Three chunks (WebGLRenderer) must not be downloaded while the scene is idle.
    const scripts: string[] = [];
    page.on("response", (r) => {
      if (r.request().resourceType() === "script") scripts.push(r.url());
    });
    await page.goto("/en/e2e-fixtures", { waitUntil: "networkidle" });
    await expect(page.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "idle");
    await expect(page.locator("canvas")).toHaveCount(0);
    const bodies = await Promise.all(scripts.map((u) => page.request.get(u).then((r) => r.text())));
    expect(bodies.filter((t) => t.includes("WebGLRenderer"))).toHaveLength(0);
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

  test.describe("touch", () => {
    test.use({ hasTouch: true, viewport: { width: 390, height: 800 } });

    test("B1-02: swiping the carousel changes the slide (touch-action allows the gesture)", async ({ page }) => {
      await page.goto("/en/e2e-fixtures");
      const car = page.getByTestId("carousel");
      await car.scrollIntoViewIfNeeded();
      await expect(car).toHaveCSS("touch-action", "pan-y");
      const box = (await car.boundingBox())!;
      const y = box.y + box.height / 2;
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
      await touch("touchStart", box.x + 300);
      for (const x of [260, 220, 180, 140, 100]) await touch("touchMove", box.x + x);
      await touch("touchEnd", box.x + 100);
      const active = page.locator('[data-testid="carousel-slide"][data-active="true"]');
      await expect(active).toHaveCount(1);
      await expect(page.locator('[data-testid="carousel-slide"]').nth(1)).toHaveAttribute("data-active", "true");
    });
  });
});
