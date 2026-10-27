import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectsExplorer } from "@/components/sections/projects/projects-explorer";
import { ProjectsFloor } from "@/components/sections/projects/projects-floor";
import { SectionHeading } from "@/components/ui/section-heading";
import { routing } from "@/i18n/routing";
import { getProjects } from "@/sanity/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, tc] = await Promise.all([getTranslations({ locale, namespace: "projects" }), getTranslations({ locale, namespace: "common" })]);
  return { title: `${t("projH1a")} ${t("projH1b")} | ${tc("brand")}`, description: t("projLead") };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, nav, home, projects] = await Promise.all([
    getTranslations({ locale, namespace: "projects" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "home" }),
    getProjects(),
  ]);

  return (
    <>
      <PageHero crumbs={[{ label: nav("navHome"), href: "/" }, { label: nav("navProjects") }]} eyebrow={home("featEyebrow")} title={`${t("projH1a")} ${t("projH1b")}`} lead={t("projLead")} />
      <ProjectsFloor />
      <section className="mx-auto max-w-[1280px] px-8 pt-10 pb-28 max-sm:px-5" aria-labelledby="pj-browse">
        <SectionHeading
          title={
            <span id="pj-browse">
              {t("pjT1")} <span className="text-blue dark:text-cyan">{t("pjHl")}</span>
            </span>
          }
        />
        <Suspense>
          <ProjectsExplorer projects={projects} locale={locale} />
        </Suspense>
      </section>
    </>
  );
}
