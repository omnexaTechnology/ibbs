import type { SiteSettings } from "@/types/site-settings";

/**
 * Placeholder values taken from the design mockup (all contact data there is
 * a placeholder pending client confirmation).
 */
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phones: ["+966 50 000 0000", "+966 50 000 0001"],
  emails: ["info@example.com", "sales@example.com"],
  website: "https://www.example.com",
  whatsapp: {
    number: "966500000000",
    message: {
      en: "Hello IBSS Innovations, I would like to discuss a furnishing project.",
      ar: "مرحباً آي بي إس إس إنوفيشنز، أرغب في الاستفسار عن مشروع فرش.",
    },
  },
  workingHours: [
    {
      days: { en: "Sun – Thu", ar: "الأحد – الخميس" },
      time: { en: "9:00 AM – 6:00 PM", ar: "9:00 ص – 6:00 م" },
    },
    {
      days: { en: "Fri – Sat", ar: "الجمعة – السبت" },
      time: { en: "Closed", ar: "مغلق" },
    },
  ],
  address: { en: "[Office address]", ar: "[عنوان المكتب]" },
  mapUrl: "",
  // The design ships these empty; empty items are hidden in the UI.
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
