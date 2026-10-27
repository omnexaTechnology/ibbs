import { beforeEach, describe, expect, it, vi } from "vitest";
import * as queries from "./queries";
import { LEAD_ROUTING_ID } from "./lead-id";

const sanityFetch = vi.fn();
vi.mock("./fetch", () => ({ sanityFetch }));

beforeEach(() => {
  sanityFetch.mockReset();
});

describe("getLeadRecipients (F-01, server only)", () => {
  it("reads the private routing document by its dotted ID, tagged for the webhook", async () => {
    sanityFetch.mockResolvedValue([" a@example.com ", "", "b@example.com"]);
    const { getLeadRecipients, LEAD_RECIPIENTS_QUERY } = await import("./lead-routing");
    expect(await getLeadRecipients()).toEqual(["a@example.com", "b@example.com"]);
    expect(sanityFetch).toHaveBeenCalledWith({ query: LEAD_RECIPIENTS_QUERY, tags: ["leadRouting"] });
    expect(LEAD_RECIPIENTS_QUERY).toContain(`"${LEAD_ROUTING_ID}"`);
    expect(LEAD_ROUTING_ID).toContain(".");
  });

  it("returns an empty list when nobody has filled it in yet", async () => {
    sanityFetch.mockResolvedValue(null);
    const { getLeadRecipients } = await import("./lead-routing");
    expect(await getLeadRecipients()).toEqual([]);
  });

  it("propagates Sanity errors (the caller decides the fallback)", async () => {
    sanityFetch.mockImplementation(() => Promise.reject(new Error("down")));
    const { getLeadRecipients } = await import("./lead-routing");
    await expect(getLeadRecipients()).rejects.toThrow("down");
  });
});

describe("F-01/F-08: no page query touches lead data", () => {
  const groq = Object.entries(queries).filter(([, v]) => typeof v === "string" && /\*\[|\{/.test(v as string));

  it("has queries to check", () => expect(groq.length).toBeGreaterThan(5));

  it.each(groq)("%s never mentions leads, lead routing or recipients", (_name, q) => {
    expect(q as string).not.toMatch(/lead|recipient|private\./i);
  });
});
