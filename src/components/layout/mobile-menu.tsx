"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import { SocialLinks } from "./social-links";
import { ThemeToggle } from "./theme-toggle";

/** Dropdown panel shown below the header on narrow screens. */
export function MobileMenu({
  id,
  settings,
  pathname,
}: {
  id: string;
  settings: SiteSettings;
  pathname: string;
}) {
  const t = useTranslations("nav");

  return (
    <div id={id} className="nav:hidden" data-testid="mobile-menu">
      <div className="flex animate-in flex-col gap-1 border-t border-line px-8 pb-6 pt-3 duration-500 fade-in slide-in-from-top-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <ThemeToggle
            showLabel
            className="h-11 rounded-full border border-line px-3.5 text-[13px] font-medium text-fg transition-colors hover:border-link"
          />
        </div>
        <nav aria-label={t("mainLabel")} className="flex flex-col">
          {NAV_ITEMS.map(({ href, key }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("min-h-11 py-3 text-start text-lg font-medium text-fg", active && "text-link")}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <SocialLinks
          settings={settings}
          className="mt-3 gap-2.5"
          linkClassName="grid size-11 place-items-center rounded-[10px] border border-line text-fg transition-colors hover:border-blue hover:bg-blue hover:text-white"
        />
      </div>
    </div>
  );
}
