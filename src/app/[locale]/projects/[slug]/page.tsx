import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectCta } from "@/components/sections/project/project-cta";
import { ProjectFacts } from "@/components/sections/project/project-facts";
import { ProjectFormSlot } from "@/components/sections/project/project-form-slot";
import { ProjectGallery } from "@/components/sections/project/project-gallery";
import { ProjectOverview, ProjectScope } from "@/components/sections/project/project-overview";
import { ProjectRelated } from "@/components/sections/project/project-related";
import { ButtonLink } from "@/components/ui/button-link";
import { sizedImageUrl } from "@/components/ui/sanity-image";
import { Reveal } from "@/components/ui/reveal";
import { projectCategories } from "@/content/taxonomy";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/contact";
import { getProjectBySlug, getProjectSlugs } from "@/sanity/content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const page = await getProjectBySlug(slug);
  if (!page) return {};
  const { project } = page;
  const title = localize(project.title, locale);
  const description = localize(project.challenge, locale).slice(0, 160) || undefined;
  const brand = (await getTranslations({ locale, namespace: "common" }))("brand");
  return {
    title: `${title} | ${brand}`,
    description,
    openGraph: { title, description, images: [{ url: sizedImageUrl(project.cover.src, 1200) }] },
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/projects/${slug}`])) },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const page = await getProjectBySlug(slug);
  if (!page) notFound();
  const { project, related } = page;

  const [nav, t, tc] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "projectDetail" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const title = localize(project.title, locale);
  const sector = projectCategories.find((c) => c.key === project.category);
  const summary = [
    project.areaM2 !== null ? `${project.areaM2} m²` : null,
    project.durationDays !== null ? `${project.durationDays} ${tc("days")}` : null,
    project.year !== null ? String(project.year) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHero
        crumbs={[{ label: nav("navHome"), href: "/" }, { label: nav("navProjects"), href: "/projects" }, { label: title }]}
        eyebrow={sector ? localize(sector.label, locale) : undefined}
        title={title}
        lead={summary || undefined}
        actions={
          <ButtonLink href="/projects" variant="ghost">
            {t("backProjects")}
          </ButtonLink>
        }
      />

      <section className="mx-auto max-w-[1280px] px-8 pb-24 pt-10">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-14">
            <Reveal>
              <ProjectGallery
                title={title}
                images={project.gallery.map((image, i) => ({ image, alt: localize(image.alt, locale) || `${title} ${i + 1}` }))}
              />
            </Reveal>
            <ProjectOverview project={project} locale={locale} />
            <ProjectScope project={project} locale={locale} />
          </div>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-28" aria-label={t("factsLabel")}>
            <ProjectFacts project={project} />
            <ProjectFormSlot locale={locale} projectSlug={project.slug} />
          </aside>
        </div>
      </section>

      <ProjectRelated related={related} locale={locale} />
      <ProjectCta locale={locale} />
    </>
  );
}
