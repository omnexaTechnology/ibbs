"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check } from "react-bootstrap-icons";
import { cn } from "@/lib/utils";

const LISTS = {
  Vision: ["tabVisionL1", "tabVisionL2", "tabVisionL3"],
  Mission: ["tabMissionL1", "tabMissionL2", "tabMissionL3"],
  Strength: ["tabStrengthL1", "tabStrengthL2", "tabStrengthL3"],
} as const;

const TABS = [
  { id: "Vision", label: "visionK", text: ["about", "visionD"] },
  { id: "Mission", label: "missionK", text: ["about", "missionD"] },
  { id: "Strength", label: "tabStrengthK", text: ["home", "aboutBody"] },
] as const;

/**
 * Vision / mission / strengths tabs (REQ-007), the ARIA tabs pattern with automatic activation: one tab stop, arrows move
 * (visual direction, so reversed in RTL), Home/End jump. All panels stay in the DOM; only the active one is shown.
 */
export function AboutTabs() {
  const t = useTranslations("about");
  const th = useTranslations("home");
  const uid = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (i: number) => {
    const n = (i + TABS.length) % TABS.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = rtl ? "ArrowLeft" : "ArrowRight";
    const prev = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === next) go(active + 1);
    else if (e.key === prev) go(active - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(TABS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div data-testid="about-tabs">
      <div role="tablist" aria-label={t("tabsL")} onKeyDown={onKey} className="flex flex-wrap gap-2 border-b border-line">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center gap-2.5 border-b-2 px-4 text-[15px] font-semibold transition-colors",
              active === i ? "border-blue text-fg dark:border-cyan" : "border-transparent text-muted hover:text-fg",
            )}
          >
            <span className="text-xs text-link tabular-nums">{`0${i + 1}`}</span>
            {t(tab.label)}
          </button>
        ))}
      </div>
      {TABS.map((tab, i) => {
        const key = tab.id;
        return (
          <div key={tab.id} role="tabpanel" id={`${uid}-panel-${i}`} aria-labelledby={`${uid}-tab-${i}`} hidden={active !== i} tabIndex={0} className="pt-8 outline-offset-4">
            <span className="text-[12.5px] font-semibold tracking-[0.2em] text-link uppercase rtl:text-sm rtl:tracking-normal">{t(`tab${key}Eye`)}</span>
            <h2 className="mt-3.5 text-[clamp(28px,3.2vw,44px)] leading-[1.1] font-bold tracking-[-0.03em] rtl:leading-[1.3] rtl:tracking-normal">{t(`tab${key}T`)}</h2>
            <p className="mt-5 max-w-[560px] text-lg text-muted">{tab.text[0] === "about" ? t(tab.text[1]) : th(tab.text[1])}</p>
            <ul className="mt-6 grid gap-3">
              {LISTS[key].map((k) => (
                <li key={k} className="flex items-center gap-3 font-medium">
                  <Check className="size-5 flex-none text-green" aria-hidden="true" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
