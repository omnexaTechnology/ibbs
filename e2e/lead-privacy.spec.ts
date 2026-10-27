import { expect, test } from "@playwright/test";

// FEAT-002 F-01: lead recipients must never be serialised into a page (HTML or RSC payload).
const FORBIDDEN = [/leadNotificationEmails/i, /leadRouting/i, /private\.lead/i, /"recipients"/i];

for (const path of ["/en", "/ar", "/en/contact"]) {
  test(`F-01: ${path} HTML and RSC payload carry no lead recipient data`, async ({ request }) => {
    const html = await request.get(path);
    expect(html.status()).toBe(200);
    const htmlText = await html.text();
    const rsc = await request.get(path, { headers: { RSC: "1" } });
    const rscText = await rsc.text();
    for (const text of [htmlText, rscText]) {
      for (const pattern of FORBIDDEN) expect(text).not.toMatch(pattern);
    }
  });
}
