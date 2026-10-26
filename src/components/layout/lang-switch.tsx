"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Switches between EN and AR while staying on the same page
 * (path, dynamic params such as a project slug, and query string are preserved).
 */
export function LangSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname(); // locale-less, e.g. /projects/exec-hq
  const search = useSearchParams().toString();
  const t = useTranslations("nav");
  const target = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;
  const href = search ? `${pathname}?${search}` : pathname;

  return (
    <Link
      href={href}
      locale={target}
      scroll={false}
      className={className}
      aria-label={t("switchLang")}
      hrefLang={target}
      lang={target}
      data-testid="lang-switch"
    >
      <span aria-hidden={locale === "ar"}>EN</span>
      <span aria-hidden="true"> | </span>
      <span>العربية</span>
    </Link>
  );
}
