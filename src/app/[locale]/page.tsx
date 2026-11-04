import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutIntro } from "@/components/sections/home/about-intro";
import { Hero } from "@/components/sections/home/hero";
import { Clients } from "@/components/sections/home/clients";
import { Process } from "@/components/sections/home/process";
import { Walk } from "@/components/sections/home/walk";
import { Featured } from "@/components/sections/home/featured";
import { Faq } from "@/components/sections/home/faq";
import { Cta } from "@/components/sections/home/cta";
import type { Locale } from "@/i18n/routing";
import { alternatesFor, jsonLdHtml, organizationJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import { getHomeContent } from "@/sanity/content";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  return { alternates: alternatesFor((await params).locale) };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ hero, projects, clients }, settings, tc, tf] = await Promise.all([
    getHomeContent(),
    getSiteSettings(),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "footer" }),
  ]);
  const orgLd = organizationJsonLd(settings, locale, tc("brand"), tf("footAbout"));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(orgLd) }} />
      <Hero locale={locale} slides={hero} />
      <AboutIntro locale={locale} />
      <Process locale={locale} />
      <Walk locale={locale} />
      <Featured projects={projects} locale={locale} />
      <Clients locale={locale} sectors={clients} />
      <Faq locale={locale} />
      <Cta />
    </>
  );
}
