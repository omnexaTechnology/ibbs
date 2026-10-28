import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Stripes } from "@/components/ui/section-heading";

/**
 * FEAT-004 MOUNT POINT: the "discuss a project like this" form of the project page.
 *
 * FEAT-004 replaces the body of `<div data-slot="project-form">` with the project request form (it receives
 * the project's slug so a lead can reference the project). Until then the region shows a link to the
 * contact page, so the sidebar is never an empty box. Keep the heading and the `data-slot` attribute.
 */
export async function ProjectFormSlot({ locale, projectSlug }: { locale: Locale; projectSlug: string }) {
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  return (
    <section
      aria-labelledby="project-form-h"
      className="rounded-[22px] border border-line bg-surface px-[26px] py-6 shadow-[0_20px_44px_-32px_rgba(var(--navy-rgb),0.5)]"
      data-testid="project-form-slot"
    >
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
        <Stripes />
        {t("pdFormEye")}
      </div>
      <h2 id="project-form-h" className="mt-2.5 text-[21px] font-bold">
        {t("pdFormTitle")}
      </h2>
      <div data-slot="project-form" data-project-slug={projectSlug} className="mt-4">
        <ButtonLink href="/contact" className="w-full justify-between">
          {t("contactNow")}
        </ButtonLink>
      </div>
    </section>
  );
}
