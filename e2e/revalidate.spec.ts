import { expect, test } from "@playwright/test";

// FEAT-002 REQ-008 / T-004: the Sanity webhook endpoint is not an open door.
test("POST /api/revalidate with a wrong signature is rejected with 401", async ({ request }) => {
  const res = await request.post("/api/revalidate", {
    data: { _type: "project" },
    headers: { "sanity-webhook-signature": "t=1700000000000,v1=wrongsignature" },
  });
  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ error: "Unauthorized" });
});

test("POST /api/revalidate without a signature is rejected with 401", async ({ request }) => {
  const res = await request.post("/api/revalidate", { data: { _type: "project" } });
  expect(res.status()).toBe(401);
});

test("GET /api/revalidate is not allowed", async ({ request }) => {
  const res = await request.get("/api/revalidate");
  expect(res.status()).toBe(405);
});
