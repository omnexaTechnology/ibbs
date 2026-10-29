import type { CSSProperties } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Envelope, GeoAlt, Globe, Telephone } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { projectCategories } from "@/content/taxonomy";
import { Link } from "@/i18n/navigation";
import { localize, toTelHref, usableEntries } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";
import { CurrentYear } from "./current-year";
import { NAV_ITEMS } from "./nav-items";
import { SocialLinks } from "./social-links";

const linkClass = "flex items-center gap-2.5 py-[7px] text-start text-[14.5px] text-muted transition-colors hover:text-navy";
const chevronClass = "size-3.5 shrink-0 text-blue rtl:rotate-180";

/** Brand wordmark under the columns; the leading letters float one by one (design v58). */
const WORDMARK = {
  en: [["I", "B", "S", "S"], "INNOVATIONS"],
  ar: [["آي بي إس إس"], "إنوفيشنز"],
} as const;

/**
 * Site footer (design footer-2, v59/v60): a light card in both themes, so the navy logo and wordmark always read.
 * Contact rows and social icons render only when set in the settings.
 */
export function Footer({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("contact");
  const tp = useTranslations("projects");
  const tcommon = useTranslations("common");
  const locale = useLocale();

  const phones = usableEntries(settings.phones);
  const emails = usableEntries(settings.emails);
  const website = settings.website.trim();
  const address = localize(settings.address, locale).trim();
  const mapUrl = settings.mapUrl.trim();
  const hasContact = phones.length > 0 || emails.length > 0 || Boolean(website) || Boolean(address);
  const [letters, rest] = WORDMARK[locale === "ar" ? "ar" : "en"];

  return (
    <div className="bg-bg px-4 pb-4 max-[720px]:px-2 max-[720px]:pb-2">
      <footer
        data-testid="site-footer"
        className="ui-ft relative overflow-hidden rounded-[28px] border border-line bg-white pb-9 pt-20 text-muted dark:bg-cream max-[720px]:rounded-[20px] max-[720px]:pt-14"
      >
        <div className="ui-ft-dots" aria-hidden="true" />
        <div className="ui-ft-sl" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1280px] px-8 max-sm:px-5">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_1.3fr]">
            <div>
              <Image src="/brand/logo-light.png" alt={tcommon("brand")} width={152} height={50} className="h-[50px] w-[152px]" />
              <div className="mt-[18px] text-xs font-semibold tracking-[0.3em] text-blue rtl:tracking-normal">
                {tcommon("fTag")}
              </div>
              <p className="mt-[18px] max-w-[330px] text-[14.5px] leading-[1.8]">{t("footAbout")}</p>
            </div>

            <nav aria-label={t("ftMain")} className="ui-ft-col">
              <h4 className="ui-ft-h">{t("ftMain")}</h4>
              {NAV_ITEMS.map(({ href, key }) => (
                <Link key={href} href={href} className={linkClass}>
                  <ChevronRight className={chevronClass} aria-hidden="true" />
                  {tn(key)}
                </Link>
              ))}
            </nav>

            <nav aria-label={t("ftProjects")} className="ui-ft-col">
              <h4 className="ui-ft-h">{t("ftProjects")}</h4>
              {projectCategories.map((c) => (
                <Link
                  key={c.key}
                  href={{ pathname: "/projects", query: { category: c.key } }}
                  className={linkClass}
                >
                  <ChevronRight className={chevronClass} aria-hidden="true" />
                  {localize(c.label, locale)}
                </Link>
              ))}
            </nav>

            {hasContact && (
              <div data-testid="footer-contact" className="ui-ft-col">
                <h4 className="ui-ft-h">{tn("navContact")}</h4>
                {phones.length > 0 && (
                  <ContactRow icon={<Telephone className="size-4" aria-hidden="true" />} label={tc("phone")}>
                    {phones.map((p) => (
                      <EntryLink key={p.value} href={toTelHref(p.value)} label={localize(p.label, locale)} dir="ltr">
                        {p.value}
                      </EntryLink>
                    ))}
                  </ContactRow>
                )}
                {emails.length > 0 && (
                  <ContactRow icon={<Envelope className="size-4" aria-hidden="true" />} label={tc("email")}>
                    {emails.map((e) => (
                      <EntryLink key={e.value} href={`mailto:${e.value}`} label={localize(e.label, locale)}>
                        {e.value}
                      </EntryLink>
                    ))}
                  </ContactRow>
                )}
                {website && (
                  <ContactRow icon={<Globe className="size-4" aria-hidden="true" />} label={tc("website")}>
                    <a href={website} target="_blank" rel="noopener noreferrer" dir="ltr" className={contactLinkClass}>
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  </ContactRow>
                )}
                {address && (
                  <ContactRow icon={<GeoAlt className="size-4" aria-hidden="true" />} label={tp("pjCityL")}>
                    {mapUrl ? (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                        {address}
                      </a>
                    ) : (
                      <span className="mt-[3px] block text-[15px] font-semibold text-navy">{address}</span>
                    )}
                  </ContactRow>
                )}
              </div>
            )}
          </div>

          <div className="ui-ft-name" dir={locale === "ar" ? "rtl" : "ltr"} aria-hidden="true">
            {letters.map((l, i) => (
              <span key={i} style={{ "--i": i } as CSSProperties}>
                {l}
              </span>
            ))}{" "}
            <span style={{ animationDelay: "-2.2s" }}>{rest}</span>
          </div>

          <div className="mt-[22px] grid items-center gap-x-7 gap-y-[18px] border-t border-line pt-[22px] text-[13.5px] min-[861px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[860px]:justify-items-center max-[860px]:pb-[76px] max-[860px]:text-center">
            <p>
              © <CurrentYear /> <b className="font-semibold text-navy">{tcommon("brand")}</b> · {t("rights")}
            </p>
            <SocialLinks
              settings={settings}
              className="gap-2.5 max-[860px]:order-first max-[860px]:flex-wrap max-[860px]:justify-center"
              linkClassName="grid size-10 place-items-center rounded-[10px] border border-line bg-white text-navy transition-all hover:-translate-y-0.5 hover:border-blue hover:bg-blue hover:text-white"
            />
            <nav aria-label={t("legalL")} className="flex items-center gap-4 min-[861px]:col-start-3 min-[861px]:justify-self-end">
              <Link href="/terms" className="inline-flex min-h-8 items-center whitespace-nowrap text-muted transition-colors hover:text-blue">
                {t("terms")}
              </Link>
              <span className="h-3.5 w-px bg-line" aria-hidden="true" />
              <Link href="/privacy" className="inline-flex min-h-8 items-center whitespace-nowrap text-muted transition-colors hover:text-blue">
                {t("privacy")}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

const contactLinkClass =
  "mt-[3px] block text-start text-[15px] font-semibold text-navy transition-colors [unicode-bidi:plaintext] hover:text-blue";

function EntryLink({
  href,
  label,
  dir,
  children,
}: {
  href: string;
  label: string;
  dir?: "ltr";
  children: React.ReactNode;
}) {
  return (
    <>
      <a href={href} dir={dir} className={contactLinkClass}>
        {children}
      </a>
      {label && <span className="block text-[12px] text-muted">{label}</span>}
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex items-start gap-3.5">
      <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-navy/6 text-blue">{icon}</span>
      <div>
        <span className="block text-[12.5px] text-muted">{label}</span>
        {children}
      </div>
    </div>
  );
}
