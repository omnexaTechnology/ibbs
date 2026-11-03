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
    <div className="mx-auto max-w-[1280px] px-8 pb-24 max-sm:px-5" data-testid="home-stats">
      <dl className="grid gap-x-14 gap-y-10 max-[900px]:!grid-cols-2 max-sm:gap-x-6" style={{ gridTemplateColumns: `repeat(${Math.min(shown.length, 4)}, minmax(0, 1fr))` }}>
        {shown.map((s) => (
          <div key={s.key} className="flex flex-col-reverse gap-5 border-t border-line pt-10">
            <dt className="max-w-[220px] text-base text-muted">{t(s.label)}</dt>
            {/* the suffix (Counter's <small>) sits raised at the top of the number, as in the design */}
            <dd className="text-[clamp(56px,6.6vw,104px)] leading-none font-normal whitespace-nowrap tracking-[-0.04em] [&_small]:align-top [&_small]:font-normal">
              <Counter to={s.value} suffix={s.suffix === "unit" ? t("kSqm") : "+"} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
