import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Locale is always part of the URL: /en/..., /ar/...
  // `/` is redirected by the proxy using the browser's Accept-Language
  // (falling back to the default locale).
  localePrefix: "always",
});

/** RTL locales; everything else is LTR. */
export function getDirection(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
