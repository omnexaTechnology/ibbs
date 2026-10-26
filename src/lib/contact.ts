import type { LabeledValue, LocalizedString, SiteSettings, SocialPlatform } from "@/types/site-settings";

/** Pick the value for a locale, falling back to the other one. */
export function localize(value: LocalizedString, locale: string): string {
  return (locale === "ar" ? value.ar : value.en) || value.en || value.ar || "";
}

/** "+966 50 000 0000" -> "tel:+966500000000" */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Entries that have a value (blank values are dropped and trimmed). */
export function usableEntries(entries: LabeledValue[]): LabeledValue[] {
  return entries
    .map((e) => ({ ...e, value: e.value.trim() }))
    .filter((e) => e.value);
}

/** wa.me link with the locale's prefilled message, or null when no number is set. */
export function whatsappHref(settings: SiteSettings, locale: string): string | null {
  const digits = settings.whatsapp.number.replace(/\D/g, "");
  if (!digits) return null;
  const text = localize(settings.whatsapp.message, locale).trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const SOCIAL_ORDER: SocialPlatform[] = ["linkedin", "instagram", "x", "snapchat", "tiktok"];

/** Only the social profiles that have a URL, in display order. */
export function socialLinks(settings: SiteSettings): { platform: SocialPlatform; url: string }[] {
  return SOCIAL_ORDER.flatMap((platform) => {
    const url = settings.social[platform]?.trim();
    return url ? [{ platform, url }] : [];
  });
}
