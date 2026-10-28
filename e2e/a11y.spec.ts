import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

// axe-core is already installed (transitive); injected directly, so no @axe-core/playwright dependency.
const axePath = createRequire(process.cwd() + "/package.json").resolve("axe-core");
const paths = ["", "/projects", "/projects/exec-hq", "/about", "/contact", "/privacy"];

for (const locale of ["en", "ar"]) {
  for (const path of paths) {
    test(`axe: no serious/critical violations on /${locale}${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      // Scroll-driven reveals are mid-fade at capture time and axe reads the half-transparent colour.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}${path}`);
      await page.waitForLoadState("networkidle");
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => {
        // @ts-expect-error injected global
        const r = await window.axe.run(document, { resultTypes: ["violations"] });
        return r.violations
          .filter((v: { impact: string }) => v.impact === "serious" || v.impact === "critical")
          .map((v: { id: string; impact: string; nodes: { target: unknown[] }[] }) => ({
            id: v.id,
            impact: v.impact,
            targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ")),
          }));
      });
      expect(violations).toEqual([]);
    });
  }
}
