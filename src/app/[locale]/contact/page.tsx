import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactCards } from "@/components/sections/contact/contact-cards";
import { ContactFormSection } from "@/components/sections/contact/contact-form-slot";
import { ContactMap } from "@/components/sections/contact/contact-map";
import { ContactWhatsApp } from "@/components/sections/contact/contact-whatsapp";
import { PageHero } from "@/components/sections/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { routing } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, tn, tc] = await Promise.all([
    getTranslations({ locale, namespace: "contact" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  return { title: `${tn("navContact")} | ${tc("brand")}`, description: t("ctLead"), alternates: alternatesFor(locale, "/contact") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, tn, tf, tc, settings] = await Promise.all([
    getTranslations({ locale, namespace: "contact" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "forms" }),
    getTranslations({ locale, namespace: "common" }),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHero
        tall
        crumbs={[{ label: tn("navHome"), href: "/" }, { label: tn("navContact") }]}
        eyebrow={tf("formEyebrow")}
        title={`${t("ctH1a")} ${t("ctH1b")}`}
        lead={t("ctLead")}
        actions={<ButtonLink href="/projects">{tc("readMore")}</ButtonLink>}
      />
      <section className="mx-auto max-w-[1280px] px-8 pb-10 pt-12">
        <ContactCards settings={settings} />
        <ContactWhatsApp settings={settings} />
        <ContactFormSection settings={settings} />
      </section>
      <ContactMap settings={settings} />
    </>
  );
}
