"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches between EN and AR while staying on the same page
 * (path, dynamic params such as a project slug, and query string are preserved).
 * Must be rendered inside a <Suspense> boundary (it reads the query string).
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
      className={cn("whitespace-nowrap", className)}
      aria-label={t("switchLang")}
      hrefLang={target}
      data-testid="lang-switch"
    >
      <span className={locale === "en" ? "font-semibold text-link" : "opacity-55"} lang="en">
        EN
      </span>
      <span className="opacity-55" aria-hidden="true">
        |
      </span>
      <span className={locale === "ar" ? "font-semibold text-link" : "opacity-55"} lang="ar">
        العربية
      </span>
    </Link>
  );
}
