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

test("F-07: the language switch is in the server HTML and links to the same page", async ({ request }) => {
  const html = await (await request.get("/en/projects/exec-hq")).text();
  expect(html).toContain('data-testid="lang-switch"');
  expect(html).toContain('href="/ar/projects/exec-hq"');
  const ar = await (await request.get("/ar/about")).text();
  expect(ar).toContain('href="/en/about"');
});

test.describe("F-08: 404 pages", () => {
  for (const [path, lang, dir, text] of [
    ["/en/does-not-exist", "en", "ltr", "Page not found"],
    ["/ar/does-not-exist/deeper", "ar", "rtl", "الصفحة غير موجودة"],
  ] as const) {
    test(`${path} is a localized 404 page`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.getByTestId("not-found")).toContainText(text);
    });
  }

  test("an unprefixed unknown path ends on the localized 404", async ({ page }) => {
    const res = await page.goto("/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page).toHaveURL(/[/]en[/]does-not-exist$/);
    await expect(page.getByTestId("not-found")).toBeVisible();
  });

  test("unknown /api paths answer with a JSON 404, not an HTML page", async ({ request }) => {
    const res = await request.get("/api/unknown");
    expect(res.status()).toBe(404);
    expect(res.headers()["content-type"]).toContain("application/json");
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  test.describe("N-02: without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    for (const [path, lang, dir, text] of [
      ["/en/nope", "en", "ltr", "Page not found"],
      ["/ar/nope", "ar", "rtl", "الصفحة غير موجودة"],
    ] as const) {
      test(`${path} is complete in the server HTML`, async ({ page }) => {
        const res = await page.goto(path);
        expect(res?.status()).toBe(404);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.locator("html")).toHaveAttribute("dir", dir);
        await expect(page.getByTestId("not-found")).toContainText(text);
      });
    }
  });

  test("raw HTML of an unknown path has lang, dir and the message", async ({ request }) => {
    const res = await request.get("/ar/nope");
    expect(res.status()).toBe(404);
    const html = await res.text();
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain("الصفحة غير موجودة");
  });
});

test("F-15: a favicon is declared and served (no 404 on load)", async ({ page, request }) => {
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.status() === 404 && !r.url().includes("does-not-exist")) failed.push(r.url());
  });
  await page.goto("/en");
  const href = await page.locator('link[rel~="icon"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("svg");
  expect(failed).toEqual([]);
});

test("F-12: the footer shows the current year", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("site-footer")).toContainText(String(new Date().getFullYear()));
});

test("F-11: keyboard focus shows a cyan outline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element);
    return { color: s.outlineColor, width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(outline.style).toBe("solid");
  expect(outline.width).toBe("2px");
  expect(outline.color).toBe("rgb(76, 166, 203)");
});
