"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SanityPicture } from "@/components/ui/sanity-image";
import { placeholderClientSectors, type ClientSector } from "@/content/clients";
import { SHOW_PLACEHOLDER_LOGOS } from "@/content/placeholders";
import { localize } from "@/lib/contact";
import { cn } from "@/lib/utils";

/** Fewest cards in one marquee half, so a sector with few clients still fills the row. */
const MIN_LOOP = 8;

/**
 * "Trusted across sectors" (design `.cl2`): sector tabs on the start side, one marquee row of clients on the end side.
 * `sectors` = the Studio's clients; while there are none, the design placeholders show (if SHOW_PLACEHOLDER_LOGOS).
 */
export function Clients({ locale, sectors = [] }: { locale: "en" | "ar"; sectors?: ClientSector[] }) {
  const t = useTranslations("home");
  const [tab, setTab] = useState(0);
  const placeholder = sectors.length === 0;
  const list = placeholder ? placeholderClientSectors : sectors;
  if (placeholder && !SHOW_PLACEHOLDER_LOGOS) return null;
  const sector = list[Math.min(tab, list.length - 1)];
  const set = sector.clients;
  // An even number of copies keeps the -50% marquee loop seamless; only the first copy is announced.
  const loop = Array.from({ length: 2 * Math.ceil(MIN_LOOP / set.length) }, () => set).flat();
  return (
    <section className="bg-[color-mix(in_srgb,var(--navy)_5%,var(--cream))] py-[clamp(72px,8vw,120px)] dark:bg-night-2" data-testid="home-clients" aria-labelledby="cl2-h">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-8 min-[1025px]:grid-cols-[1fr_1.7fr] max-[1024px]:gap-9 max-sm:px-5">
        <div>
          <div className="inline-flex items-center gap-3 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-link rtl:text-sm rtl:tracking-normal">
            {t("cl2Eye")}
          </div>
          <h2 id="cl2-h" className="mt-[18px] text-[clamp(32px,3.6vw,54px)] leading-[1.12] font-bold tracking-[-0.03em] rtl:leading-[1.35] rtl:tracking-normal">
            {t("cl2Title")}
          </h2>
          <p className="mt-[18px] text-[17px] leading-[1.75] text-muted">{t("cl2Sub")}</p>
          <div className="mt-[30px] flex flex-wrap gap-2.5" role="tablist" aria-label={t("cl2Title")}>
            {list.map((c, i) => (
              <button
                key={c.label.en}
                type="button"
                role="tab"
                aria-selected={i === tab}
                data-testid="client-tab"
                onClick={() => setTab(i)}
                className={cn("h-12 rounded-xl border px-6 text-[15px] font-semibold transition-[background-color,color,border-color,transform] duration-300 hover:-translate-y-0.5", i === tab ? "border-blue bg-blue text-white" : "border-line bg-surface text-fg hover:border-fg")}
              >
                {localize(c.label, locale)}
              </button>
            ))}
          </div>
        </div>
        <div className="ui-cl-mq" role="list" aria-label={localize(sector.label, locale)} key={tab}>
          <div className="ui-cl-trk">
            {loop.map((client, i) => {
              const dup = i >= set.length;
              return (
                <div
                  key={i}
                  role={dup ? "presentation" : "listitem"}
                  aria-hidden={dup ? true : undefined}
                  data-testid={dup ? undefined : "client-card"}
                  className="flex aspect-[1.05] w-44 flex-none flex-col items-center justify-center gap-2 rounded-[20px] border border-line bg-surface p-3 text-center transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-cyan max-sm:w-[140px]"
                >
                  {client.logo ? (
                    <span className="relative h-16 w-full">
                      <SanityPicture image={client.logo} alt="" sizes="176px" className="object-contain" />
                    </span>
                  ) : (
                    <span className="inline-flex h-3 gap-[3px] text-link" aria-hidden="true">
                      <i className="block w-[5px] -skew-x-[28deg] bg-blue" />
                      <i className="block w-[5px] -skew-x-[28deg] bg-cyan" />
                      <i className="block w-[5px] -skew-x-[28deg] bg-green" />
                    </span>
                  )}
                  {placeholder ? <b className="text-[12.5px] font-semibold text-muted">[{t("clientLogo")}]</b> : null}
                  <small className="text-[13px] leading-snug font-semibold text-fg">{localize(client.name, locale)}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
