import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";

/** Closing band (REQ-007): contact and projects. */
export async function AboutCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <section aria-labelledby="about-cta-h" className="mx-auto max-w-[1280px] px-8 pb-28 max-sm:px-5" data-testid="about-cta">
      <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface px-[clamp(28px,5vw,80px)] py-[72px] dark:bg-night-2">
        <span className="inline-flex rounded-full border border-line px-4 py-1.5 text-xs font-medium tracking-[0.18em] uppercase rtl:text-sm rtl:tracking-normal">{t("ctaPill")}</span>
        <h2 id="about-cta-h" className="mt-5 max-w-[560px] text-[clamp(32px,4.2vw,56px)] leading-[1.05] font-bold tracking-[-0.03em] rtl:leading-[1.3] rtl:tracking-normal">
          {t("ctaTitle")}
        </h2>
        <p className="mt-5 max-w-[580px] text-lg text-muted">{t("ctaSub")}</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">{t("ctaBook")}</ButtonLink>
          <ButtonLink href="/projects" variant="ghost">
            {t("ctaSee")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
