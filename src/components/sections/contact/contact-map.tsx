import { Globe } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { localize, safeHttpUrl } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

/**
 * "Find us" block: the design's stylised map with the address, website and a Google Maps button.
 * Rows are hidden when empty; the whole block is absent when there is no address, map link or website.
 */
export function ContactMap({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const locale = useLocale();
  const address = localize(settings.address, locale).trim();
  const mapUrl = safeHttpUrl(settings.mapUrl);
  const website = safeHttpUrl(settings.website);
  if (!address && !mapUrl && !website) return null;

  return (
    <section aria-labelledby="ctm-h" className="mx-auto max-w-[1280px] px-8 pb-28" data-testid="contact-map">
      <div className="relative h-[440px] overflow-hidden rounded-[28px] border border-line max-sm:h-[420px]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1200 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="1200" height="440" className="fill-surface-2" />
          <path
            className="fill-fg/5"
            d="M40 40h190v120H40zM260 40h220v90H260zM40 190h150v110H40zM220 170h160v140H220zM520 30h170v130H520zM720 40h200v100H720zM960 30h200v150H960zM420 190h200v100H420zM650 180h150v120H650zM840 200h160v90H840zM1030 210h140v120H1030zM60 330h220v90H60zM320 340h180v80H320zM560 330h230v100H560zM830 320h170v100H830z"
          />
          <path className="fill-none stroke-white dark:stroke-cream/10" strokeWidth="14" d="M0 175H1200M0 318H1200M205 0V440M500 0V440M705 0V440M1015 0V440" />
          <path className="fill-none stroke-blue/30" strokeWidth="22" strokeLinecap="round" d="M0 250C220 230 360 300 600 262S980 190 1200 230" />
          <path className="fill-cyan/20" d="M1040 340h120v80h-120z" />
        </svg>
        <div className="absolute start-[58%] top-1/2 z-[2] size-14 -translate-x-1/2 -translate-y-full max-sm:start-1/2 max-sm:top-[38%]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-full fill-blue stroke-white drop-shadow-lg" strokeWidth="1.2">
            <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.6" className="fill-white stroke-none" />
          </svg>
        </div>
        <div className="absolute bottom-8 start-8 z-[3] flex max-w-[340px] flex-col gap-2 rounded-[20px] bg-surface px-[26px] py-6 shadow-site max-sm:inset-x-4 max-sm:bottom-4 max-sm:max-w-none">
          <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-link rtl:text-sm rtl:tracking-normal">
            {t("mapTitle")}
          </span>
          <h2 id="ctm-h" className="text-[22px] font-semibold">
            {tc("brand")}
          </h2>
          {address ? <p className="text-[15px] text-muted">{address}</p> : null}
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-link no-underline hover:underline">
              <Globe className="size-3.5" aria-hidden="true" />
              <bdi dir="ltr">{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</bdi>
            </a>
          ) : null}
          {mapUrl ? (
            <ButtonLink href={mapUrl} external className="mt-2 self-start">
              {t("mapOpen")}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
