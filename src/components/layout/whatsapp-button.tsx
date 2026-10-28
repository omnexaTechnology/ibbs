import { Whatsapp } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { whatsappHref } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

/** Floating WhatsApp button. Hidden when no WhatsApp number is configured. */
export function WhatsAppButton({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("whatsapp");
  const locale = useLocale();
  const href = whatsappHref(settings, locale);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("waTip")}
      data-testid="whatsapp-button"
      className="group fixed bottom-7 end-7 z-[60] grid size-[62px] place-items-center rounded-full bg-green text-navy shadow-[0_18px_40px_-12px_rgba(var(--green-rgb),0.7)] transition-transform duration-[400ms] hover:rotate-[-6deg] hover:scale-110 hover:text-navy"
    >
      <span
        className="pointer-events-none absolute end-[74px] translate-x-2 whitespace-nowrap rounded-md bg-navy px-3.5 py-2 text-[13px] text-cream opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 rtl:-translate-x-2 rtl:group-hover:translate-x-0 rtl:group-focus-visible:translate-x-0"
      >
        {t("waTip")}
      </span>
      <Whatsapp className="size-7" aria-hidden="true" />
    </a>
  );
}
