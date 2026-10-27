import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SanityPicture } from "@/components/ui/sanity-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { projectCategories } from "@/content/taxonomy";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/contact";
import type { Project } from "@/sanity/view-models";

/** Up to 3 projects of the same sector. Renders nothing when there are none. */
export async function ProjectRelated({ related, locale }: { related: Project[]; locale: Locale }) {
  if (related.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  const th = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });

  return (
    <section aria-labelledby="related-h" className="mx-auto max-w-[1280px] px-8 pb-20" data-testid="project-related">
      <SectionHeading eyebrow={t("relatedEyebrow")} title={<span id="related-h">{t("relatedTitle")}</span>} />
      <ul className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {related.map((p) => {
          const title = localize(p.title, locale);
          const sector = projectCategories.find((c) => c.key === p.category);
          const meta = [
            localize(p.city, locale),
            p.year,
            p.durationDays !== null ? `${p.durationDays} ${tc("days")}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={p.slug}>
              <Link
                href={`/projects/${p.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-surface text-fg no-underline hover:text-fg dark:hover:text-fg"
                data-testid="related-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SanityPicture
                    image={p.cover}
                    alt={localize(p.cover.alt, locale) || title}
                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  {sector ? <span className="text-xs font-semibold text-link">{localize(sector.label, locale)}</span> : null}
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  {meta ? <p className="mt-1 text-sm text-muted">{meta}</p> : null}
                  <span className="mt-3 inline-block text-sm font-semibold text-link">{th("viewDetails")}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
