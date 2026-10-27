import "server-only";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/fetch";
import { SANITY_TAGS, SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { toSiteSettings } from "@/sanity/view-models";
import type { SiteSettings } from "@/types/site-settings";

/**
 * Defaults used when Sanity is not configured or unreachable, and before the client has created
 * the "Site settings" document.
 *
 * Contact data is intentionally EMPTY: the design's phones, emails, address and
 * hours were placeholders, and an empty value hides the item in the UI (no
 * placeholder numbers, links or buttons in production). Only the WhatsApp
 * prefilled message (real copy from the design) is set.
 */
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phones: [],
  emails: [],
  website: "",
  whatsapp: {
    number: "",
    message: {
      en: "Hello IBSS Innovations, I would like to discuss a furnishing project.",
      ar: "مرحباً آي بي إس إس إنوفيشنز، أرغب في الاستفسار عن مشروع فرش.",
    },
  },
  workingHours: [],
  address: { en: "", ar: "" },
  mapUrl: "",
  social: { linkedin: "", instagram: "", x: "", snapchat: "", tiktok: "" },
};

/**
 * Returns the site's contact & social settings, from Sanity "Site settings".
 *
 * Callers do not know where the data comes from. Never throws: without Sanity configuration
 * (no env vars, e.g. a plain build) or when Sanity cannot be reached, the empty defaults are
 * returned so the site still renders, with every contact item hidden (BR-009).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const defaults = structuredClone(DEFAULT_SITE_SETTINGS);
  if (!isSanityConfigured) return defaults;
  try {
    const raw = await sanityFetch({ query: SITE_SETTINGS_QUERY, tags: [SANITY_TAGS.siteSettings] });
    return toSiteSettings(raw, defaults);
  } catch (error) {
    console.warn("[site-settings] Sanity unavailable, using empty defaults:", error instanceof Error ? error.message : error);
    return defaults;
  }
}
