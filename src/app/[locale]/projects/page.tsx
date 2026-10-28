import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectsExplorer } from "@/components/sections/projects/projects-explorer";
import { ProjectsExplorerFromUrl } from "@/components/sections/projects/projects-explorer-from-url";
import { ProjectsFloor } from "@/components/sections/projects/projects-floor";
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
      <PageHero crumbs={[{ label: nav("navHome"), href: "/" }, { label: nav("navProjects") }]} eyebrow={home("featEyebrow")} title={`${t("projH1a")} ${t("projH1b")}`} lead={t("projLead")} actions={<ButtonLink href="#pj-browse" external>{home("ctaExplore")}</ButtonLink>} />
      <ProjectsFloor />
      <section className="mx-auto max-w-[1280px] px-8 pt-10 pb-28 max-sm:px-5" aria-labelledby="pj-browse">
        <div className="mb-11 grid items-start gap-12 min-[1025px]:grid-cols-[1.3fr_1fr] max-[1024px]:gap-6">
          <h2 id="pj-browse" className="text-[clamp(32px,3.6vw,54px)] leading-[1.12] font-bold tracking-[-0.03em] text-fg rtl:leading-[1.35] rtl:tracking-normal">
            {t("pjT1")} <span className="text-blue dark:text-cyan">{t("pjHl")}</span>
          </h2>
          <p className="pt-3.5 text-[17px] leading-[1.75] text-muted">{t("projLead")}</p>
        </div>
        {/* The fallback is the full "All" list, so it is in the static HTML (R3-01). */}
        <Suspense fallback={<ProjectsExplorer projects={projects} locale={locale} />}>
          <ProjectsExplorerFromUrl projects={projects} locale={locale} />
        </Suspense>
      </section>
    </>
  );
}
