import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";

/**
 * Server-only read client (T-006: this module can never be bundled for the browser, thanks to
 * `server-only`; the token comes from SANITY_API_READ_TOKEN, which has no NEXT_PUBLIC_ prefix).
 *
 * - perspective "published": drafts never reach the site (BR-002).
 * - useCdn false: Next's data cache is our cache and the webhook revalidates it; the Sanity API
 *   CDN would add a second, delayed layer.
 * - token: needed once the dataset is private; harmless while it is public.
 */
export function createReadClient() {
  if (!isSanityConfigured) throw new SanityNotConfiguredError();
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    perspective: "published",
    token: process.env.SANITY_API_READ_TOKEN || undefined,
  });
}

export class SanityNotConfiguredError extends Error {
  constructor() {
    super("Sanity is not configured (NEXT_PUBLIC_SANITY_PROJECT_ID is empty).");
    this.name = "SanityNotConfiguredError";
  }
}
