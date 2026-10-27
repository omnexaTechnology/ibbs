import type { ReactNode } from "react";
import { Clock, Envelope, GeoAlt, Globe, Telephone } from "react-bootstrap-icons";
import { useLocale, useTranslations } from "next-intl";
import { localize, safeHttpUrl, toTelHref, usableEntries } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

function Card({ icon, title, testId, children }: { icon: ReactNode; title: string; testId: string; children: ReactNode }) {
  return (
    <li
      className="flex flex-col items-center border border-gray bg-white px-[22px] pb-[34px] pt-[38px] text-center transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-[3px] hover:border-blue hover:shadow-[0_20px_44px_-30px_rgba(var(--navy-rgb),0.45)] dark:border-cream/12 dark:bg-night-2"
      data-testid={testId}
    >
      <span className="text-blue dark:text-cyan [&>svg]:size-[46px]" aria-hidden="true">
        {icon}
      </span>
      <h2 className="mt-5 text-[19px] font-semibold text-fg">{title}</h2>
      <div className="mt-2.5 flex flex-col gap-1 text-[14.5px] leading-[1.6] text-muted [&_a]:text-muted [&_a]:no-underline [&_a:hover]:text-link">{children}</div>
    </li>
  );
}

/**
 * Direct contact cards from the site settings. Each card renders only when its data is set; with nothing set the
 * whole block is absent (BR-009).
 */
export function ContactCards({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("contact");
  const tp = useTranslations("projects");
  const locale = useLocale();
  const address = localize(settings.address, locale).trim();
  const mapUrl = safeHttpUrl(settings.mapUrl);
  const phones = usableEntries(settings.phones);
  const emails = usableEntries(settings.emails);
  const website = safeHttpUrl(settings.website);
  const hours = settings.workingHours
    .map((r) => ({ days: localize(r.days, locale), time: localize(r.time, locale) }))
    .filter((r) => r.days || r.time);

  const cards: ReactNode[] = [];
  if (address)
    cards.push(
      <Card key="address" icon={<GeoAlt />} title={tp("pjCityL")} testId="contact-address">
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            {address}
          </a>
        ) : (
          <span>{address}</span>
        )}
      </Card>,
    );
  if (phones.length)
    cards.push(
      <Card key="phones" icon={<Telephone />} title={t("phone")} testId="contact-phones">
        {phones.map((p) => (
          <a key={p.value} href={toTelHref(p.value)}>
            {localize(p.label, locale) ? <span className="me-1.5 text-xs">{localize(p.label, locale)}:</span> : null}
            <bdi dir="ltr">{p.value}</bdi>
          </a>
        ))}
      </Card>,
    );
  if (emails.length)
    cards.push(
      <Card key="emails" icon={<Envelope />} title={t("email")} testId="contact-emails">
        {emails.map((e) => (
          <a key={e.value} href={`mailto:${e.value}`}>
            {localize(e.label, locale) ? <span className="me-1.5 text-xs">{localize(e.label, locale)}:</span> : null}
            <bdi dir="ltr">{e.value}</bdi>
          </a>
        ))}
      </Card>,
    );
  if (website)
    cards.push(
      <Card key="website" icon={<Globe />} title={t("website")} testId="contact-website">
        <a href={website} target="_blank" rel="noopener noreferrer">
          <bdi dir="ltr">{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</bdi>
        </a>
      </Card>,
    );
  if (hours.length)
    cards.push(
      <Card key="hours" icon={<Clock />} title={t("hoursK")} testId="contact-hours">
        {hours.map((r, i) => (
          <span key={i}>{[r.days, r.time].filter(Boolean).join(": ")}</span>
        ))}
      </Card>,
    );

  if (cards.length === 0) return null;
  return (
    <ul className="mb-14 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5" data-testid="contact-cards" aria-label={t("ctDirectLabel")}>
      {cards}
    </ul>
  );
}
