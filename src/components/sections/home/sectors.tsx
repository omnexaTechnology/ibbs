import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/section-heading";
import { projectCategories } from "@/content/taxonomy";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/contact";

/** "Spaces we furnish" (REQ-002): the six sectors, each linking to the project list filtered by that sector. */
export async function Sectors({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <section aria-labelledby="sectors-h" className="mx-auto max-w-[1280px] px-8 pb-24 max-sm:px-5" data-testid="home-sectors">
      <SectionHeading eyebrow={t("cl2Eye")} title={<span id="sectors-h">{t("mqLabel")}</span>} />
      <ul className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {projectCategories.map((c) => (
          <li key={c.key}>
            <Link
              href={`/projects?category=${c.key}`}
              data-testid="sector-link"
              className="flex min-h-[88px] items-center justify-between gap-4 rounded-[20px] border border-line bg-surface px-6 py-5 text-lg font-semibold text-fg no-underline transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-cyan"
            >
              {localize(c.label, locale)}
              <span className="h-6 w-1 -skew-x-[28deg] bg-cyan" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
