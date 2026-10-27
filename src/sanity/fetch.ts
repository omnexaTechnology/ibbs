import "server-only";
import type { QueryParams } from "next-sanity";
import { createReadClient } from "./client";
import type { SanityTag } from "./queries";

/** Safety net: even if a webhook is missed, content is re-read at least hourly. */
export const SAFETY_REVALIDATE_SECONDS = 3600;

/**
 * The one way pages read Sanity. Every query carries cache tags (the document types it depends
 * on); `POST /api/revalidate` invalidates them when an editor publishes (REQ-008).
 * Throws when Sanity is not configured or unreachable: getSiteSettings rethrows too once Sanity is configured (F-02): no silent empty pages.
 */
export async function sanityFetch<const Query extends string>({
  query,
  params = {},
  tags,
  signal,
}: {
  query: Query;
  params?: QueryParams;
  tags: SanityTag[];
  /** Abort a hanging read (the client's own default timeout is 300 s). */
  signal?: AbortSignal;
}) {
  return createReadClient().fetch(query, params, {
    next: { revalidate: SAFETY_REVALIDATE_SECONDS, tags },
    ...(signal && { signal }),
  });
}
