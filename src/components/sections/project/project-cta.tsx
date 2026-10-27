import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";

/** Closing band: "Planning a similar project?" (no 3D here: the home page owns the 3D CTA). */
export async function ProjectCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "projectDetail" });
  const tc = await getTranslations({ locale, namespace: "common" });
  return (
    <section aria-labelledby="project-cta-h" className="mx-auto max-w-[1280px] px-8 pb-28">
      <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface px-[clamp(28px,5vw,80px)] py-[72px] dark:bg-night-2">
        <h2
          id="project-cta-h"
          className="max-w-[560px] text-[clamp(32px,4.2vw,56px)] leading-[1.05] font-bold tracking-[-0.03em] rtl:leading-[1.3] rtl:tracking-normal"
        >
          {t("similarTitle")}
        </h2>
        <p className="mt-5 max-w-[580px] text-lg text-muted">{t("similarSub")}</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">{t("contactNow")}</ButtonLink>
          <ButtonLink href="/projects" variant="ghost">
            {tc("readMore")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
