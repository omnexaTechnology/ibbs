/** A string with a value per supported locale. */
export type LocalizedString = { en: string; ar: string };

export type SocialPlatform = "linkedin" | "instagram" | "x" | "snapchat" | "tiktok";

/** A contact entry with an editable label per locale (e.g. "Sales" / "المبيعات"). */
export type LabeledValue = {
  label: LocalizedString;
  value: string;
};

export type WorkingHoursRow = {
  days: LocalizedString;
  time: LocalizedString;
};

/**
 * Editable contact & social settings. PUBLIC by design: this object is passed to client
 * components, so it is serialised into every page. Never add private data here (lead recipients
 * live in the private `leadRouting` document, see src/sanity/lead-routing.ts).
 *
 * FEAT-002 swaps the source of `getSiteSettings()` to Sanity ("Site settings");
 * this shape is the contract the UI depends on. An empty string / empty array
 * means "not set" and the UI must hide the corresponding item.
 */
export type SiteSettings = {
  /** `value` is the display form, e.g. "+966 50 000 0000"; the tel: link is derived from it. */
  phones: LabeledValue[];
  emails: LabeledValue[];
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
};
