// @vitest-environment node
import { encodeSignatureHeader } from "@sanity/webhook";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

// parseBody waits 3 s for Content Lake consistency by default (F-06). Tests skip the wait but
// record how the route called it: it must NOT disable the wait itself.
const parseBodyCalls: unknown[][] = [];
vi.mock("next-sanity/webhook", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-sanity/webhook")>();
  return {
    ...actual,
    parseBody: (...args: unknown[]) => {
      parseBodyCalls.push(args);
      return (actual.parseBody as (...a: unknown[]) => unknown)(args[0], args[1], false);
    },
  };
});

const SECRET = "test-secret-value";

async function post(body: unknown, opts: { secret?: string | null; raw?: string; signedAt?: number } = {}) {
  const { POST } = await import("./route");
  const text = opts.raw ?? JSON.stringify(body);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret !== null) {
    headers["sanity-webhook-signature"] = await encodeSignatureHeader(text, opts.signedAt ?? Date.now(), opts.secret ?? SECRET);
  }
  return POST(new NextRequest("http://localhost/api/revalidate", { method: "POST", body: text, headers }));
}

beforeEach(() => {
  vi.resetModules();
  revalidateTag.mockReset();
  parseBodyCalls.length = 0;
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

  it.each(["heroSlides", "siteSettings", "leadRouting"])("valid signature + %s -> revalidates its tag", async (type) => {
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

  it("F-05: a correctly signed but old request (replay) -> 401, nothing revalidated", async () => {
    const res = await post({ _type: "project" }, { signedAt: Date.now() - 6 * 60 * 1000 });
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(parseBodyCalls).toHaveLength(0);
  });

  it("F-05: signed in 2023 -> 401", async () => {
    const res = await post({ _type: "project" }, { signedAt: 1700000000000 });
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("F-05: a timestamp far in the future -> 401", async () => {
    const res = await post({ _type: "project" }, { signedAt: Date.now() + 6 * 60 * 1000 });
    expect(res.status).toBe(401);
  });

  it("F-05: a fresh signature (1 minute old) -> 200", async () => {
    const res = await post({ _type: "project" }, { signedAt: Date.now() - 60 * 1000 });
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("project", { expire: 0 });
  });

  it("F-06: keeps parseBody's default consistency wait (no third argument)", async () => {
    await post({ _type: "project" });
    expect(parseBodyCalls).toHaveLength(1);
    expect(parseBodyCalls[0]).toHaveLength(2);
  });

  it("signed but malformed JSON -> 400", async () => {
    const res = await post(null, { raw: "{not json" });
    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
