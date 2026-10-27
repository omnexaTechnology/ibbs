import { describe, expect, it } from "vitest";
import { isLeadDocumentId, leadDocumentId } from "./lead-id";

describe("BR-007 lead document IDs", () => {
  it("contain a dot so Sanity keeps them private even on a public dataset", () => {
    const id = leadDocumentId("11111111-2222-3333-4444-555555555555");
    expect(id).toBe("lead.11111111-2222-3333-4444-555555555555");
    expect(id).toContain(".");
    expect(isLeadDocumentId(id)).toBe(true);
  });
  it("generates a unique UUID-based ID by default and no personal data", () => {
    const a = leadDocumentId();
    const b = leadDocumentId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^lead\.[0-9a-f-]{36}$/);
  });
  it("respects Sanity's ID rules (allowed characters, max 128, no '..')", () => {
    const id = leadDocumentId();
    expect(id).toMatch(/^[a-zA-Z0-9._-]+$/);
    expect(id.length).toBeLessThanOrEqual(128);
    expect(id).not.toContain("..");
  });
});
