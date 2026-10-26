import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Envelope, GeoAlt, Globe, Telephone } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { projectCategories } from "@/content/taxonomy";
import { Link } from "@/i18n/navigation";
import { localize, toTelHref, usableEntries } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";
import { NAV_ITEMS } from "./nav-items";
import { SocialLinks } from "./social-links";

const linkClass =
  "flex items-center gap-2.5 py-[7px] text-start text-[14.5px] text-cream/70 transition-colors hover:text-cream";
const headingClass = "mb-[22px] inline-block pb-3 text-[17px] font-semibold text-cream";

/** Site footer. Contact rows and social icons render only when set in the settings. */
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

  return (
    <div className="bg-bg px-4 pb-4">
      <footer
        data-testid="site-footer"
        className="relative overflow-hidden rounded-[28px] bg-navy pb-7 pt-20 text-cream/70 dark:border dark:border-cream/10 dark:bg-night-2"
      >
        <div className="mx-auto max-w-[1280px] px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_1.3fr]">
            <div>
              <Image src="/brand/logo-dark.png" alt={tcommon("brand")} width={143} height={50} className="h-[50px] w-[143px]" />
              <div className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-cyan rtl:tracking-normal">
                {tcommon("fTag")}
              </div>
              <p className="mt-[18px] max-w-[330px] text-[14.5px] leading-[1.8]">{t("footAbout")}</p>
            </div>

            <nav aria-label={t("ftMain")}>
              <h4 className={headingClass}>{t("ftMain")}</h4>
              {NAV_ITEMS.map(({ href, key }) => (
                <Link key={href} href={href} className={linkClass}>
                  <ChevronRight className="size-3.5 shrink-0 text-cyan rtl:rotate-180" aria-hidden="true" />
                  {tn(key)}
                </Link>
              ))}
            </nav>

            <nav aria-label={t("ftProjects")}>
              <h4 className={headingClass}>{t("ftProjects")}</h4>
              {projectCategories.map((c) => (
                <Link
                  key={c.key}
                  href={{ pathname: "/projects", query: { category: c.key } }}
                  className={linkClass}
                >
                  <ChevronRight className="size-3.5 shrink-0 text-cyan rtl:rotate-180" aria-hidden="true" />
                  {localize(c.label, locale)}
                </Link>
              ))}
            </nav>

            {hasContact && (
              <div data-testid="footer-contact">
                <h4 className={headingClass}>{tn("navContact")}</h4>
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
                      <span className="mt-[3px] block text-[15px] font-semibold text-cream">{address}</span>
                    )}
                  </ContactRow>
                )}
              </div>
            )}
          </div>

          <div className="mt-14 grid items-center gap-4 border-t border-cream/10 pt-7 md:grid-cols-[1fr_auto_1fr]">
            <p className="text-[14px]">
              © {new Date().getFullYear()} <b className="font-semibold text-cyan">{tcommon("brand")}</b> · {t("rights")}
            </p>
            <SocialLinks
              settings={settings}
              className="gap-2.5"
              linkClassName="grid size-11 place-items-center rounded-[10px] border border-cream/15 bg-cream/5 text-cream transition-all hover:-translate-y-[3px] hover:border-blue hover:bg-blue hover:text-white"
            />
            <nav aria-label={t("legalL")} className="flex items-center gap-3 md:justify-end">
              <Link href="/terms" className="text-cream/55 transition-colors hover:text-cream">
                {t("terms")}
              </Link>
              <span className="h-3.5 w-px bg-cream/25" aria-hidden="true" />
              <Link href="/privacy" className="text-cream/55 transition-colors hover:text-cream">
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
  "mt-[3px] block text-start text-[15px] font-semibold text-cream transition-colors [unicode-bidi:plaintext] hover:text-cyan";

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
      {label && <span className="block text-[12px] text-cream/55">{label}</span>}
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex items-start gap-3.5">
      <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-cream/5 text-cyan">{icon}</span>
      <div>
        <span className="block text-[12.5px] text-cream/55">{label}</span>
        {children}
      </div>
    </div>
  );
}
