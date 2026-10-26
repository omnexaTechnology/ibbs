/** A string with a value per supported locale. */
export type LocalizedString = { en: string; ar: string };

export type SocialPlatform = "linkedin" | "instagram" | "x" | "snapchat" | "tiktok";

export type WorkingHoursRow = {
  days: LocalizedString;
  time: LocalizedString;
};

/**
 * Editable contact & social settings.
 * FEAT-002 swaps the source of `getSiteSettings()` to Sanity ("Site settings");
 * this shape is the contract the UI depends on. An empty string / empty array
 * means "not set" and the UI must hide the corresponding item.
 */
export type SiteSettings = {
  /** Display form, e.g. "+966 50 000 0000". The tel: link is derived from it. */
  phones: string[];
  emails: string[];
  /** Full URL, e.g. "https://www.example.com". */
  website: string;
  whatsapp: {
    /** International number, digits only (e.g. "966500000000"). Empty hides the floating button. */
    number: string;
    /** Prefilled chat message per locale. */
    message: LocalizedString;
  };
  workingHours: WorkingHoursRow[];
  address: LocalizedString;
  /** Link opened by the address (e.g. a Google Maps URL). Empty = address shown as plain text. */
  mapUrl: string;
  social: Record<SocialPlatform, string>;
  /** Recipients of new-lead notification emails (used by FEAT-004). */
  leadNotificationEmails: string[];
};
