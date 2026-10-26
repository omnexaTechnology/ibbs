import type { SiteSettings } from "@/types/site-settings";

/**
 * Defaults used until the client fills the settings (FEAT-002: Sanity "Site settings").
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
  leadNotificationEmails: [],
};

/**
 * Returns the site's contact & social settings.
 *
 * Async on purpose: FEAT-002 replaces the body with a Sanity query while
 * callers stay unchanged. Callers must not assume where the data comes from.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  return structuredClone(DEFAULT_SITE_SETTINGS);
}
