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

/** Default site settings with top-level overrides. */
export async function makeSettings(overrides: Partial<SiteSettings> = {}): Promise<SiteSettings> {
  return { ...(await getSiteSettings()), ...overrides };
}
