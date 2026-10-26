import { expect, test } from "@playwright/test";

test("app serves a page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("IBSS Innovations Furniture")).toBeVisible();
});
