import { expect, test } from "@playwright/test";

// FEAT-004/T-003: each wired form renders (method=post) and shows the success state on a mocked /api/leads.
// Project page uses the seeded Sanity project "exec-hq" (like project.spec.ts); /api/leads is always intercepted.
const pages = [
  { path: "contact", formId: "contact-form" },
  { path: "projects/exec-hq", formId: "project-form" },
] as const;

for (const locale of ["en", "ar"] as const) {
  for (const { path, formId } of pages) {
    test(`${locale} /${path}: ${formId} renders and a submit shows success`, async ({ page }) => {
      const posts: unknown[] = [];
      await page.route("**/api/leads", async (route) => {
        posts.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      });
      await page.goto(`/${locale}/${path}`);
      const form = page.getByTestId(formId);
      await expect(form).toHaveAttribute("method", "post");
      const submit = form.locator('button[type="submit"]');
      await expect(submit).toBeEnabled(); // hydrated
      await form.locator('input[name="name"]').fill("Test User");
      await form.locator('input[name="phone"]').fill("0501234567");
      await form.locator('input[name="email"]').fill("test@example.com");
      await submit.click();
      await expect(page.getByTestId("form-success")).toBeVisible();
      expect(posts).toHaveLength(1);
      expect(posts[0]).toMatchObject({ formType: formId.replace("-form", ""), locale, pageUrl: `/${locale}/${path}` });
    });
  }
}
