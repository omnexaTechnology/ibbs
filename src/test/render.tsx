import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { getSiteSettings } from "@/lib/site-settings";
import type { SiteSettings } from "@/types/site-settings";

export function renderWithIntl(ui: ReactElement, locale: "en" | "ar" = "en") {
  const wrap = (node: ReactElement) => (
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en}>
      {node}
    </NextIntlClientProvider>
  );
  const result = render(wrap(ui));
  return { ...result, rerender: (next: ReactElement) => result.rerender(wrap(next)) };
}

/** Fixture with every contact field filled (test data only, never shipped as a default). */
export async function makeSettings(overrides: Partial<SiteSettings> = {}): Promise<SiteSettings> {
  const base = await getSiteSettings();
  return {
    ...base,
    phones: [
      { label: { en: "Main", ar: "الرئيسي" }, value: "+966 50 000 0000" },
      { label: { en: "", ar: "" }, value: "+966 50 000 0001" },
    ],
    emails: [
      { label: { en: "General", ar: "عام" }, value: "info@example.com" },
      { label: { en: "", ar: "" }, value: "sales@example.com" },
    ],
    website: "https://www.example.com",
    whatsapp: { ...base.whatsapp, number: "966500000000" },
    workingHours: [{ days: { en: "Sun – Thu", ar: "الأحد – الخميس" }, time: { en: "9:00 AM – 6:00 PM", ar: "9:00 ص – 6:00 م" } }],
    address: { en: "[Office address]", ar: "[عنوان المكتب]" },
    ...overrides,
  };
}

/** Settings exactly as shipped (all contact data empty). */
export const emptySettings = () => getSiteSettings();
