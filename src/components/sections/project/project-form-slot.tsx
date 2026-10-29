import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ProjectForm } from "@/components/forms/project-form";
import { whatsappHref } from "@/lib/contact";
import type { SiteSettings } from "@/types/site-settings";

/** "Discuss a project like this" form. The lead's pageUrl (/locale/projects/slug) carries the project reference. */
export async function ProjectFormSlot({ locale, projectSlug, settings }: { locale: Locale; projectSlug: string; settings: SiteSettings }) {
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  return (
    <section
      aria-labelledby="project-form-h"
      className="rounded-[22px] border border-line bg-surface px-[26px] py-6 shadow-[0_20px_44px_-32px_rgba(var(--navy-rgb),0.5)]"
      data-testid="project-form-slot"
    >
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
        {t("pdFormEye")}
      </div>
      <h2 id="project-form-h" className="mt-2.5 text-[21px] font-bold">
        {t("pdFormTitle")}
      </h2>
      <div data-slot="project-form" data-project-slug={projectSlug} className="mt-4">
        <ProjectForm whatsappHref={whatsappHref(settings, locale)} />
      </div>
    </section>
  );
}
