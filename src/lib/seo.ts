import type { Metadata, MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { safeHttpUrl, socialLinks, usableEntries } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

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

/** Absolute URL on the site origin, for places metadataBase does not reach (sitemap, robots, JSON-LD). */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

/** Static pages listed in the sitemap (locale-less). Project pages are added from Sanity. */
export const SITEMAP_PATHS = ["", "/projects", "/about", "/contact", "/privacy", "/terms"] as const;

/** One sitemap entry per page per locale, each carrying its hreflang alternates. */
export function sitemapEntries(projectSlugs: string[]): MetadataRoute.Sitemap {
  const paths = [...SITEMAP_PATHS, ...projectSlugs.map((slug) => `/projects/${encodeURIComponent(slug)}`)];
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(alternatesFor(routing.defaultLocale, path).languages ?? {}).map(([l, href]) => [l, absoluteUrl(String(href))]),
    );
    return routing.locales.map((locale) => ({ url: absoluteUrl(`/${locale}${path}`), alternates: { languages } }));
  });
}

/** JSON-LD for a <script type="application/ld+json">; `<` escaped so editor text cannot close the tag. */
export function jsonLdHtml(data: object): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}

/** schema.org Organization for the home page, from Site settings; unset contacts and socials are left out. */
export function organizationJsonLd(settings: SiteSettings, locale: string, name: string, description: string) {
  const phones = usableEntries(settings.phones);
  const emails = usableEntries(settings.emails);
  const sameAs = socialLinks(settings).map((s) => safeHttpUrl(s.url)).filter(Boolean);
  return {
    "@type": "Organization",
    name,
    url: absoluteUrl(`/${locale}`),
    logo: absoluteUrl("/brand/logo-main.png"),
    description,
    ...(sameAs.length && { sameAs }),
    ...((phones.length || emails.length) && {
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        ...(phones[0] && { telephone: phones[0].value }),
        ...(emails[0] && { email: emails[0].value }),
      },
    }),
  };
}

/** schema.org BreadcrumbList; `path` is locale-less ("/projects"). */
export function breadcrumbJsonLd(locale: string, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(`/${locale}${item.path}`),
    })),
  };
}
