import { getTranslations } from "next-intl/server";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { Stripes } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { faqs } from "@/content/faqs";
import { localize } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";

/** Home FAQ (design `.faq-grid`): intro on one side, single-open accordion (WAI-ARIA) on the other. */
export async function Faq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const items = faqs.map((f, i) => ({ id: `faq-${i}`, question: localize(f.q, locale), answer: <p>{localize(f.a, locale)}</p> }));
  return (
    <section className="py-[clamp(72px,8vw,120px)]" data-testid="home-faq" aria-labelledby="faq-h">
      <div className="mx-auto grid max-w-[1280px] gap-16 px-8 min-[1025px]:grid-cols-[1fr_1.5fr] max-[1024px]:gap-9 max-sm:px-5">
        <Reveal>
          <div className="inline-flex items-center gap-3 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
            <Stripes />
            {t("faqEyebrow")}
          </div>
          <h2 id="faq-h" className="mt-5 text-[clamp(32px,3.6vw,54px)] leading-[1.12] font-bold tracking-[-0.03em] rtl:leading-[1.35] rtl:tracking-normal">
            {t("faqTitle")}
          </h2>
          <p className="mt-5 text-[17px] leading-[1.75] text-muted">{t("faqSub")}</p>
          <ButtonLink href="/contact" variant="ghost" className="mt-7">
            {t("askWa")}
          </ButtonLink>
        </Reveal>
        <Accordion items={items} defaultOpen={0} headingLevel={3} />
      </div>
    </section>
  );
}
