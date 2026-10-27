import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Counter } from "@/components/ui/counter";
import { stats, type Stat } from "@/content/stats";

/**
 * Stats band (REQ-002). Only figures marked `confirmed` in `content/stats.ts` are shown (BR-003); with none confirmed
 * the band is not rendered at all, and the "placeholders" note (`stNote`) is never shown on the live site.
 */
export async function Stats({ locale, items = stats }: { locale: Locale; items?: Stat[] }) {
  const shown = items.filter((s) => s.confirmed);
  if (shown.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div className="mx-auto mt-[72px] max-w-[1280px] px-8 max-sm:px-4" data-testid="home-stats">
      <dl className="grid overflow-hidden rounded-[28px] bg-navy p-3 text-cream max-sm:!grid-cols-2 dark:border dark:border-cream/10 dark:bg-night-2" style={{ gridTemplateColumns: `repeat(${Math.min(shown.length, 4)}, minmax(0, 1fr))` }}>
        {shown.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-3 px-4 py-11 text-center">
            <dd className="order-first text-[clamp(44px,6vw,88px)] leading-none font-bold tracking-[-0.04em]">
              <Counter to={s.value} suffix={s.suffix === "unit" ? t("kSqm") : "+"} />
            </dd>
            <dt className="max-w-[180px] text-[15px] text-cream/75">{t(s.label)}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
