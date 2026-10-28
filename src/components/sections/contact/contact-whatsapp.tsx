import { Whatsapp } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { whatsappHref } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

/** Big "Discuss your project" WhatsApp block. Absent when no WhatsApp number is set. */
export function ContactWhatsApp({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("contact");
  const locale = useLocale();
  const href = whatsappHref(settings, locale);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="contact-whatsapp"
      className="mb-14 flex items-center gap-5 rounded-3xl bg-green px-8 py-7 text-navy no-underline transition-transform duration-300 hover:-translate-y-0.5 hover:text-navy dark:hover:text-navy"
    >
      <span className="grid size-16 flex-none place-items-center rounded-full bg-navy text-green" aria-hidden="true">
        <Whatsapp className="size-8" />
      </span>
      <span className="flex flex-col">
        <b className="text-2xl font-bold">{t("waBig")}</b>
        <span className="text-[15px] opacity-80">{t("waBigSub")}</span>
      </span>
    </a>
  );
}
