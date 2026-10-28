import { useTranslations } from "next-intl";
import { SocialLinks } from "@/components/layout/social-links";
import { Stripes } from "@/components/ui/section-heading";
import type { SiteSettings } from "@/types/site-settings";

/**
 * Navy intro panel + FEAT-004 MOUNT POINT for the contact form.
 *
 * FEAT-004 renders the contact form inside `<div data-slot="contact-form">` (give it its own card styling:
 * the slot is unstyled). While the slot is empty it is hidden and the panel takes the full width.
 */
export function ContactFormSection({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("forms");
  const tc = useTranslations("contact");
  return (
    <div
      className="mb-16 grid items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:has-[[data-slot=contact-form]:empty]:grid-cols-1"
      data-testid="contact-form-section"
    >
      <section className="relative isolate overflow-hidden rounded-3xl bg-navy px-[clamp(28px,4vw,56px)] pb-[52px] pt-14 text-cream">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan rtl:text-sm rtl:tracking-normal">
          <Stripes />
          {t("formEyebrow")}
        </div>
        <h2 className="mt-4 text-[clamp(28px,3vw,40px)] leading-[1.15] font-bold rtl:leading-[1.3]">{t("formTitle")}</h2>
        <p className="mt-3.5 max-w-[440px] text-base leading-[1.7] text-cream/80">{tc("ctPanelP")}</p>
        <SocialLinks
          settings={settings}
          className="mt-6 flex-wrap gap-2.5"
          linkClassName="grid size-10 place-items-center rounded-full bg-cream/12 text-cream transition-colors hover:bg-cream hover:text-navy"
          iconClassName="size-[17px]"
        />
      </section>
      <div data-slot="contact-form" data-testid="contact-form-slot" className="empty:hidden" />
    </div>
  );
}
