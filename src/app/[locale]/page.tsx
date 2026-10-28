import { setRequestLocale } from "next-intl/server";
import { AboutIntro } from "@/components/sections/home/about-intro";
import { Hero } from "@/components/sections/home/hero";
import { Kinetic } from "@/components/sections/home/kinetic";
import { Partners } from "@/components/sections/home/partners";
import { Clients } from "@/components/sections/home/clients";
import { Process } from "@/components/sections/home/process";
import { Walk } from "@/components/sections/home/walk";
import { Featured } from "@/components/sections/home/featured";
import { Faq } from "@/components/sections/home/faq";
import { Cta } from "@/components/sections/home/cta";
import type { Locale } from "@/i18n/routing";
import { getHomeContent } from "@/sanity/content";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { hero, projects } = await getHomeContent();
  return (
    <>
      <Hero locale={locale} slides={hero} />
      <Partners locale={locale} />
      <Kinetic />
      <AboutIntro locale={locale} />
      <Process locale={locale} />
      <Walk locale={locale} />
      <Featured projects={projects} locale={locale} />
      <Clients locale={locale} />
      <Faq locale={locale} />
      <Cta />
    </>
  );
}
