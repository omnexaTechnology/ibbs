import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutBuild } from "@/components/sections/about/about-build";
import { AboutCta } from "@/components/sections/about/about-cta";
import { AboutTabs } from "@/components/sections/about/about-tabs";
import { AboutWho } from "@/components/sections/about/about-who";
import { Stats } from "@/components/sections/home/stats";
import { Sectors } from "@/components/sections/home/sectors";
import { PageHero } from "@/components/sections/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, tc] = await Promise.all([getTranslations({ locale, namespace: "about" }), getTranslations({ locale, namespace: "common" })]);
  return { title: `${t("aboutH1a")} ${t("aboutH1b")} | ${tc("brand")}`, description: t("aboutLead") };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, nav, home] = await Promise.all([
    getTranslations({ locale, namespace: "about" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "home" }),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: nav("navHome"), href: "/" }, { label: nav("navAbout") }]}
        eyebrow={home("ab1Badge")}
        title={`${t("aboutH1a")} ${t("aboutH1b")}`}
        lead={t("aboutLead")}
        actions={<ButtonLink href="/projects">{home("ctaExplore")}</ButtonLink>}
      />
      <AboutWho locale={locale} />
      <section className="mx-auto grid max-w-[1280px] items-center gap-14 px-8 py-24 max-sm:px-5 min-[900px]:grid-cols-[1.1fr_1fr]" data-testid="about-vmg">
        <AboutBuild />
        <AboutTabs />
      </section>
      <Stats locale={locale} />
      <div className="pt-4">
        <Sectors locale={locale} />
      </div>
      <AboutCta locale={locale} />
    </>
  );
}
