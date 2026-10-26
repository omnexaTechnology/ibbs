// Public Sanity config. Only NEXT_PUBLIC_* values here: this file is also bundled into the Studio (browser).
// Read each variable literally (process.env.NAME) so Next.js can inline it.

/** Sanity API version (a date). Pinned so query behaviour does not change underneath us. */
export const apiVersion = "2026-10-26";

/** Empty string when not configured: the site then runs on its defaults and the build still succeeds. */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/** True when the site can talk to Sanity (project ID set). */
export const isSanityConfigured = projectId.length > 0;
