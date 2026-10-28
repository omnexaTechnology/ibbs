import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/section-heading";

/** "Who we are" (REQ-007): story headline and two paragraphs. */
export async function AboutWho({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about" });
  return (
    <section aria-labelledby="about-who-h" className="mx-auto max-w-[1280px] px-8 pt-20 max-sm:px-5" data-testid="about-who">
      <div className="grid gap-12 min-[900px]:grid-cols-2">
        <SectionHeading className="!mb-0" eyebrow={t("whoEyebrow")} title={<span id="about-who-h">{t("whoTitle")}</span>} />
        <div className="space-y-5 text-lg text-muted">
          <p>{t("whoBody")}</p>
          <p>{t("whoBody2")}</p>
        </div>
      </div>
    </section>
  );
}
