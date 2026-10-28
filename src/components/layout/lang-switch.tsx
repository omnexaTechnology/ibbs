"use client";

import { useLocale, useTranslations } from "next-intl";
import { PlainLink, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches between EN and AR while staying on the same page.
 *
 * The server HTML contains a plain link to the same path in the other locale
 * (works without JS, visible to crawlers, no layout shift on hydration). On click
 * the client keeps the query string too (it is not known at static render time).
 */
export function LangSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname(); // locale-less, e.g. /projects/exec-hq
  const router = useRouter();
  const t = useTranslations("nav");
  const target = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <PlainLink
      href={pathname}
      locale={target}
      scroll={false}
      className={cn("whitespace-nowrap", className)}
      aria-label={`${t("switchLang")}: EN العربية`}
      hrefLang={target}
      data-testid="lang-switch"
      onClick={(e) => {
        const search = window.location.search;
        if (!search || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        router.push(`${pathname}${search}`, { locale: target, scroll: false });
      }}
    >
      <span className={locale === "en" ? "font-semibold text-link" : "text-muted"} lang="en">
        EN
      </span>
      <span className="opacity-55" aria-hidden="true">
        |
      </span>
      <span className={locale === "ar" ? "font-semibold text-link" : "text-muted"} lang="ar">
        العربية
      </span>
    </PlainLink>
  );
}
