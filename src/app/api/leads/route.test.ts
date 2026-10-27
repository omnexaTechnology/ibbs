// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Nothing here touches the network: Sanity (next-sanity createClient), the recipients lookup and Resend are mocked.
const create = vi.fn();
const commit = vi.fn();
const set = vi.fn();
const patch = vi.fn();
vi.mock("next-sanity", () => ({ createClient: vi.fn(() => ({ create, patch })) }));

const getLeadRecipients = vi.fn();
vi.mock("@/sanity/lead-routing", () => ({ getLeadRecipients }));

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const valid = {
  formType: "contact",
  locale: "en",
  pageUrl: "/en/contact",
  name: "Sara Test",
  email: "sara@example.test",
  phone: "0501234567",
  company: "Acme",
  spaceType: "mosque",
  area: "1200",
  message: "Need 40 desks <b>soon</b>",
  hp_extra: "",
  elapsedMs: 8000,
};

async function post(body: unknown, init: { raw?: string; headers?: Record<string, string> } = {}) {
  const { POST } = await import("./route");
  const text = init.raw ?? JSON.stringify(body);
  return POST(new Request("http://localhost/api/leads", { method: "POST", body: text, headers: { "content-type": "application/json", ...init.headers } }));
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetModules();
  for (const m of [create, commit, set, patch, getLeadRecipients, send]) m.mockReset();
  set.mockImplementation(() => ({ commit }));
  patch.mockImplementation(() => ({ set }));
  create.mockResolvedValue({ _id: "lead.abc" });
  commit.mockResolvedValue({});
  getLeadRecipients.mockResolvedValue(["sales@client.test"]);
  send.mockResolvedValue({ data: { id: "e1" }, error: null });
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "proj123");
  vi.stubEnv("SANITY_API_WRITE_TOKEN", "write-token");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("LEAD_FALLBACK_EMAIL", "fallback@owner.test");
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/leads", () => {
  it("success: saves under a lead.<id> document, emails the Studio recipients, flags emailDelivered", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const doc = create.mock.calls[0][0];
    expect(doc._id).toMatch(/^lead\.[0-9a-f-]{36}$/);
    expect(doc).toMatchObject({ _type: "lead", formType: "contact", name: "Sara Test", phone: "+966501234567", locale: "en", spaceType: "Mosque", emailDelivered: false });
    expect(doc.pageUrl).toBe("/en/contact");
    expect(doc).not.toHaveProperty("hp_extra");
    expect(doc).not.toHaveProperty("elapsedMs");

    const mail = send.mock.calls[0][0];
    expect(mail.to).toEqual(["sales@client.test"]);
    expect(mail.replyTo).toBe("sara@example.test");
    expect(mail.html).toContain("&lt;b&gt;soon&lt;/b&gt;"); // message is escaped
    expect(patch).toHaveBeenCalledWith("lead.abc");
    expect(set).toHaveBeenCalledWith({ emailDelivered: true });
  });

  it("falls back to LEAD_FALLBACK_EMAIL when the Studio list is empty", async () => {
    getLeadRecipients.mockResolvedValue([]);
    expect((await post(valid)).status).toBe(200);
    expect(send.mock.calls[0][0].to).toEqual(["fallback@owner.test"]);
  });

  it("email down: lead is saved, visitor sees success, emailDelivered stays false", async () => {
    send.mockResolvedValue({ data: null, error: { name: "api_error", message: "boom" } });
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledOnce();
    expect(patch).not.toHaveBeenCalled();
  });

  it("Sanity down: the email still goes out, visitor sees success", async () => {
    create.mockRejectedValue(new Error("sanity down"));
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    expect(patch).not.toHaveBeenCalled();
  });

  it("both down: error response, never a success (BR-003)", async () => {
    create.mockRejectedValue(new Error("sanity down"));
    send.mockRejectedValue(new Error("resend down"));
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: "delivery_failed" });
  });

  it("no write token and no Resend key counts as both down", async () => {
    vi.stubEnv("SANITY_API_WRITE_TOKEN", "");
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await post(valid)).status).toBe(502);
  });

  it("patch failure after both steps succeeded is still a success", async () => {
    commit.mockRejectedValue(new Error("patch failed"));
    expect((await post(valid)).status).toBe(200);
  });

  it("honeypot filled: fake success, nothing stored or sent (AC-003)", async () => {
    const res = await post({ ...valid, hp_extra: "http://spam.test" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("honeypot wins even when the rest of the payload is invalid", async () => {
    const res = await post({ hp_extra: "x" });
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });

  it("too-fast submission: fake success, nothing stored or sent", async () => {
    const res = await post({ ...valid, elapsedMs: 300 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("missing timing is treated as a bot", async () => {
    const noTiming: Record<string, unknown> = { ...valid };
    delete noTiming.elapsedMs;
    const res = await post(noTiming);
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });

  it("invalid payload: 400 with localizable field error keys, nothing stored", async () => {
    const res = await post({ ...valid, name: "", phone: "12", email: "nope" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fields).toEqual({ name: "nameRequired", phone: "phoneInvalid", email: "emailInvalid" });
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("requires email or message", async () => {
    const res = await post({ ...valid, email: "", message: "" });
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual({ email: "emailOrMessage" });
  });

  it("call form needs only a phone", async () => {
    const res = await post({ formType: "call", locale: "ar", phone: "+966501234567", elapsedMs: 5000 });
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledOnce();
  });

  it("malformed JSON and non-object bodies: 400", async () => {
    expect((await post(null, { raw: "{not json" })).status).toBe(400);
    expect((await post([1, 2])).status).toBe(400);
  });

  it("oversized payload: 413, by actual length and by declared length", async () => {
    const big = { ...valid, message: "x".repeat(30_000) };
    expect((await post(big)).status).toBe(413);
    expect((await post(valid, { headers: { "content-length": "999999" } })).status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("oversized chunked body (no Content-Length) is cut off while reading: 413", async () => {
    const { POST } = await import("./route");
    const big = new TextEncoder().encode(JSON.stringify({ ...valid, message: "x".repeat(30_000) }));
    const body = new ReadableStream({ start: (c) => (c.enqueue(big), c.close()) });
    const res = await POST(new Request("http://localhost/api/leads", { method: "POST", body, headers: { "content-type": "application/json" }, duplex: "half" } as RequestInit));
    expect(res.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("non-JSON content type: 415, nothing stored (F4-03)", async () => {
    const res = await post(valid, { headers: { "content-type": "text/plain" } });
    expect(res.status).toBe(415);
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("pageUrl keeps only a same-site path; full URLs and junk are dropped (F4-08)", async () => {
    await post({ ...valid, pageUrl: "https://evil.test/en/contact" });
    expect(create.mock.calls[0][0].pageUrl).toBeUndefined();
  });

  it("Resend gets an abort signal (5 s) instead of a Promise.race (R2-03)", async () => {
    await post(valid);
    const options = send.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  it("an aborted Resend call (error result) counts as an email failure, not a success", async () => {
    create.mockRejectedValue(new Error("sanity down"));
    send.mockResolvedValue({ data: null, error: { name: "application_error", message: "aborted" } });
    expect((await post(valid)).status).toBe(502);
  });

  it("recipients read failure falls back to LEAD_FALLBACK_EMAIL and logs recipients-fallback without data", async () => {
    getLeadRecipients.mockRejectedValue(new Error("sanity down for Sara Test"));
    expect((await post(valid)).status).toBe(200);
    expect(send.mock.calls[0][0].to).toEqual(["fallback@owner.test"]);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).toContain("recipients-fallback");
    expect(logged).not.toContain("Sara");
  });

  it("control and bidi characters in the name never reach the subject (F4-10)", async () => {
    await post({ ...valid, name: "A‮bank" });
    expect(send.mock.calls[0][0].subject).not.toMatch(/[‮]/);
  });

  it("message longer than the field limit (but under the body limit) is rejected", async () => {
    const res = await post({ ...valid, message: "x".repeat(6000) });
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual({ message: "tooLong" });
  });

  it("never logs request data (NFR-002)", async () => {
    create.mockRejectedValue(new Error("failed for Sara Test 0501234567"));
    send.mockRejectedValue(new Error("failed for sara@example.test"));
    await post(valid);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(errorSpy).toHaveBeenCalled();
    for (const secret of ["Sara", "0501234567", "sara@example.test", "write-token", "re_test"]) expect(logged).not.toContain(secret);
  });
});
