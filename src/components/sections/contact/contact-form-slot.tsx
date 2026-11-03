import { useLocale, useTranslations } from "next-intl";
import { ContactForm } from "@/components/forms/contact-form";
import { SocialLinks } from "@/components/layout/social-links";
import { whatsappHref } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

/**
 * Navy intro panel with the contact form card (`data-slot="contact-form"`) overlapping its end side (design `.ctf-grid`).
 * From lg up both share grid row 1: the panel is pinned to every column (`col-[1/-1]`; a bare span would be auto-placed
 * after the card) and its end padding keeps the text clear of the card; the taller card sticks out above and below.
 * Below lg they stack, the card riding up over the panel's bottom edge.
 */
export function ContactFormSection({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("forms");
  const tc = useTranslations("contact");
  const locale = useLocale();
  return (
    <div className="mb-16 grid items-center lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" data-testid="contact-form-section">
      <section className="relative isolate flex flex-col justify-center overflow-hidden rounded-3xl bg-navy px-[clamp(28px,4vw,56px)] pt-14 pb-[84px] text-cream lg:col-[1/-1] lg:row-start-1 lg:min-h-[400px] lg:pb-[52px] lg:pe-[calc(52%+24px)]">
        <div className="ui-ctf-lines pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan rtl:text-sm rtl:tracking-normal">{t("formEyebrow")}</div>
        <h2 className="mt-3.5 text-[clamp(28px,3vw,40px)] leading-[1.15] font-bold rtl:leading-[1.3]">{t("formTitle")}</h2>
        <p className="mt-3.5 max-w-[440px] text-base leading-[1.7] text-cream/80">{tc("ctPanelP")}</p>
        <SocialLinks
          settings={settings}
          className="mt-6 flex-wrap gap-2.5"
          linkClassName="grid size-10 place-items-center rounded-full border border-cream/15 bg-cream/10 text-cream transition-colors hover:bg-cream hover:text-navy"
          iconClassName="size-[17px]"
        />
      </section>
      <div
        data-slot="contact-form"
        data-testid="contact-form-slot"
        className="relative z-10 mx-3 -mt-6 rounded-[20px] border border-line bg-surface px-[clamp(22px,3vw,40px)] py-[34px] shadow-[0_30px_70px_-36px_rgba(var(--navy-rgb),0.45)] lg:col-start-2 lg:row-start-1 lg:ms-0 lg:me-[clamp(18px,3vw,44px)] lg:mt-0 dark:border-cream/12 dark:bg-night-2"
      >
        <ContactForm whatsappHref={whatsappHref(settings, locale)} />
      </div>
    </div>
  );
}
