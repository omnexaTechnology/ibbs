import "server-only";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "./fetch";
import { SANITY_TAGS } from "./queries";

/**
 * Recipients of new-lead notification emails (FEAT-004). SERVER ONLY, on purpose a separate module
 * from queries.ts: no page query may touch lead data (F-01/F-08, guarded by a unit test).
 * The document has a dotted ID, so anonymous users cannot read it even on a public dataset.
 */
export const LEAD_RECIPIENTS_QUERY = defineQuery(`*[_id == "private.leadRouting"][0].recipients`);

/** A hanging Sanity must not eat the time the fallback email needs (R2-02). */
export const RECIPIENTS_TIMEOUT_MS = 3_000;

/** Trimmed, non-empty addresses. Throws when Sanity is not configured or unreachable (the caller decides the fallback). */
export async function getLeadRecipients(): Promise<string[]> {
  const raw = await sanityFetch({ query: LEAD_RECIPIENTS_QUERY, tags: [SANITY_TAGS.leadRouting], signal: AbortSignal.timeout(RECIPIENTS_TIMEOUT_MS) });
  return (raw ?? []).map((e) => e.trim()).filter(Boolean);
}
