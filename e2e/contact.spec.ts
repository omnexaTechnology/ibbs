import { expect, test } from "@playwright/test";

for (const locale of ["en", "ar"] as const) {
  test.describe(`REQ-010 contact page (${locale})`, () => {
    test("shows the intro, the FEAT-004 form slot and the contact data that the settings hold", async ({ page }) => {
      await page.goto(`/${locale}/contact`);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByTestId("page-title")).toBeVisible();
      await expect(page.getByTestId("contact-form-slot")).toHaveAttribute("data-slot", "contact-form");
      await expect(page.getByTestId("contact-form")).toHaveAttribute("method", "post");

      // Site settings feed the footer and the contact page alike: whatever the footer shows (production settings are
      // empty until the client fills them in Studio), the contact page shows the same phones, and hides blocks that are empty.
      const footerTel = await page.getByTestId("site-footer").locator('a[href^="tel:"]').evaluateAll((a) => a.map((x) => x.getAttribute("href")));
      const pageTel = await page.getByTestId("contact-phones").locator('a[href^="tel:"]').evaluateAll((a) => a.map((x) => x.getAttribute("href")));
      expect(pageTel).toEqual(footerTel);
      if (footerTel.length === 0) await expect(page.getByTestId("contact-phones")).toHaveCount(0);

      const wa = await page.getByTestId("whatsapp-button").count();
      await expect(page.getByTestId("contact-whatsapp")).toHaveCount(wa);
    });

    test("no horizontal scroll at 390px", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/contact`);
      await expect(page.getByTestId("page-title")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  });
}

test.describe("REQ-011 legal pages", () => {
  for (const [locale, kind, title] of [
    ["en", "privacy", "Privacy policy"],
    ["en", "terms", "Terms of use"],
    ["ar", "privacy", "سياسة الخصوصية"],
    ["ar", "terms", "شروط الاستخدام"],
  ] as const) {
    test(`/${locale}/${kind}: title, numbered sections and table of contents`, async ({ page }) => {
      const res = await page.goto(`/${locale}/${kind}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByTestId("page-title")).toHaveText(title);
      const toc = page.getByTestId("legal-toc").getByRole("link");
      expect(await toc.count()).toBeGreaterThanOrEqual(5);
      await expect(page.locator("main article h2")).toHaveCount(await toc.count());
      // The draft notice lives in code only: nothing on the page says "draft".
      await expect(page.locator("main")).not.toContainText(/draft|مسودة/i);
    });
  }
});
