"use client";

import Image from "next/image";
import { Envelope, GeoAlt, Telephone } from "react-bootstrap-icons";
import { List, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { toTelHref, usableEntries } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";
import { LangSwitch } from "./lang-switch";
import { MobileMenu } from "./mobile-menu";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import { SocialLinks } from "./social-links";
import { ThemeToggle } from "./theme-toggle";

/** Header turns "scrolled" (smaller, with a border) after this many pixels. */
export const SCROLLED_AFTER_PX = 24;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const getScrolled = () => window.scrollY > SCROLLED_AFTER_PX;
const getServerScrolled = () => false;

export function Header({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);

  // The menu is tied to the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn !== null && openOn === pathname;
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const email = usableEntries(settings.emails)[0]?.value;
  const phone = usableEntries(settings.phones)[0]?.value;
  const hasSocial = Object.values(settings.social).some((u) => u.trim());

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-cream"
      >
        {t("skip")}
      </a>

      {(email || phone || hasSocial) && (
        <div className="relative z-[51] hidden bg-navy text-[13px] text-cream/70 min-[561px]:block" data-testid="topbar">
          <div className="mx-auto flex h-[42px] max-w-[1360px] items-center gap-[18px] px-8">
            <span className="inline-flex items-center gap-1.5">
              <GeoAlt className="size-[15px] text-cyan" aria-hidden="true" />
              <TopbarLocation />
            </span>
            {email && (
              <a
                className="inline-flex min-h-8 items-center gap-1.5 text-cream transition-colors hover:text-cyan"
                href={`mailto:${email}`}
              >
                <Envelope className="size-[15px] text-cyan" aria-hidden="true" />
                <span>{email}</span>
              </a>
            )}
            <span className="grow" />
            {phone && (
              <a
                className="inline-flex min-h-8 items-center gap-1.5 text-cream transition-colors hover:text-cyan"
                href={toTelHref(phone)}
                dir="ltr"
              >
                <Telephone className="size-[15px] text-cyan" aria-hidden="true" />
                <span>{phone}</span>
              </a>
            )}
            <SocialLinks
              settings={settings}
              className="gap-0.5"
              linkClassName="grid size-[34px] place-items-center rounded-full text-cream/70 transition-colors hover:bg-cyan hover:text-navy"
              iconClassName="size-4"
            />
          </div>
        </div>
      )}

      <header
        data-testid="site-header"
        data-scrolled={scrolled}
        className={cn(
          "sticky top-0 z-50 border-b border-transparent bg-[var(--glass)] backdrop-blur-[18px] backdrop-saturate-150",
          scrolled && "border-line shadow-[0_10px_30px_-22px_rgba(var(--navy-rgb),0.45)]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1360px] items-center gap-7 px-8 transition-[height] duration-[450ms]",
            scrolled ? "h-[70px]" : "h-[92px]",
          )}
        >
          <Link href="/" className="flex min-h-11 items-center" aria-label={t("logoAlt")}>
            <Image
              src="/brand/logo-light.png"
              alt={t("logoAlt")}
              width={128}
              height={42}
              priority
              className={cn("w-auto transition-[height] duration-[450ms] dark:hidden", scrolled ? "h-[34px]" : "h-[42px]")}
            />
            <Image
              src="/brand/logo-dark.png"
              alt={t("logoAlt")}
              width={120}
              height={42}
              priority
              className={cn("hidden w-auto transition-[height] duration-[450ms] dark:block", scrolled ? "h-[34px]" : "h-[42px]")}
            />
          </Link>

          <nav aria-label={t("mainLabel")} className="ms-auto hidden gap-1.5 nav:flex">
            {NAV_ITEMS.map(({ href, key }) => (
              <NavLink key={href} href={href} active={isNavActive(pathname, href)}>
                {t(key)}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2.5 nav:ms-0">
            <LangSwitch className={controlClass} />
            <ThemeToggle className={cn(controlClass, "w-11 justify-center px-0")} />
            <button
              ref={menuButton}
              type="button"
              className={cn(controlClass, "w-11 justify-center px-0 nav:hidden")}
              aria-label={menuOpen ? t("closeMenu") : t("menu")}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setOpenOn(menuOpen ? null : pathname)}
              data-testid="menu-button"
            >
              {menuOpen ? <X className="size-5" aria-hidden="true" /> : <List className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen && <MobileMenu id={menuId} settings={settings} pathname={pathname} />}
      </header>
    </>
  );
}

const controlClass =
  "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-transparent px-3.5 text-[13px] font-medium text-fg transition-colors hover:border-link";

function TopbarLocation() {
  const t = useTranslations("contact");
  return <span>{t("locTxt")}</span>;
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative min-h-11 px-3.5 py-3 text-[15px] font-medium text-fg transition-colors",
        "after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-blue after:via-cyan after:to-blue after:transition-transform after:duration-500 rtl:after:origin-right",
        "hover:after:scale-x-100",
        active && "text-link after:scale-x-100",
      )}
    >
      {children}
    </Link>
  );
}
