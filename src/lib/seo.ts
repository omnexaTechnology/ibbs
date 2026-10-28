import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

/** Absolute site origin: NEXT_PUBLIC_SITE_URL, else the Vercel production host, else localhost. */
export function siteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

/** canonical + hreflang (all locales + x-default) for a path like "/projects". Resolved to absolute by metadataBase. */
export function alternatesFor(locale: string, path = ""): NonNullable<Metadata["alternates"]> {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}
