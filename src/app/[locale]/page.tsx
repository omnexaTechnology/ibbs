import { setRequestLocale } from "next-intl/server";
import { AboutIntro } from "@/components/sections/home/about-intro";
import { Hero } from "@/components/sections/home/hero";
import { Kinetic } from "@/components/sections/home/kinetic";
import { Partners } from "@/components/sections/home/partners";
import { Sectors } from "@/components/sections/home/sectors";
import type { Locale } from "@/i18n/routing";
import { getHomeContent } from "@/sanity/content";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { hero } = await getHomeContent();
  return (
    <>
      <Hero locale={locale} slides={hero} />
      <Partners locale={locale} />
      <Kinetic />
      <AboutIntro locale={locale} />
      <Sectors locale={locale} />
    </>
  );
}
