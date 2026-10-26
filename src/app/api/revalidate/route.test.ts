// @vitest-environment node
import { encodeSignatureHeader } from "@sanity/webhook";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const SECRET = "test-secret-value";

async function post(body: unknown, opts: { secret?: string | null; raw?: string } = {}) {
  const { POST } = await import("./route");
  const text = opts.raw ?? JSON.stringify(body);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret !== null) {
    headers["sanity-webhook-signature"] = await encodeSignatureHeader(text, Date.now(), opts.secret ?? SECRET);
  }
  return POST(new NextRequest("http://localhost/api/revalidate", { method: "POST", body: text, headers }));
}

beforeEach(() => {
  vi.resetModules();
  revalidateTag.mockReset();
  vi.stubEnv("SANITY_REVALIDATE_SECRET", SECRET);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/revalidate (REQ-008)", () => {
  it("wrong secret -> 401 and nothing is revalidated", async () => {
    const res = await post({ _type: "project" }, { secret: "wrong-secret" });
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("missing signature -> 401", async () => {
    const res = await post({ _type: "project" }, { secret: null });
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("server without a configured secret rejects everything", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "");
    const res = await post({ _type: "project" });
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("valid signature + project -> revalidates the project tag", async () => {
    const res = await post({ _type: "project", slug: "exec-hq" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, type: "project" });
    expect(revalidateTag).toHaveBeenCalledWith("project", { expire: 0 });
  });

  it.each(["heroSlides", "siteSettings"])("valid signature + %s -> revalidates its tag", async (type) => {
    const res = await post({ _type: type });
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(type, { expire: 0 });
  });

  it("valid signature + a type the site does not show (lead) -> 200, nothing revalidated", async () => {
    const res = await post({ _type: "lead" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: false, type: "lead" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("signed but malformed JSON -> 400", async () => {
    const res = await post(null, { raw: "{not json" });
    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
