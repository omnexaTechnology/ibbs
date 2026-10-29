"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { processSteps } from "@/content/process";
import { localize } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { emit, listen, P3_RESET, P3_SET, P3_STAGE } from "@/three/scene-events";
import { SceneRoot } from "@/three/scene-root";
import type { SceneStatus } from "@/three/scene-types";

/**
 * Design Process (REQ-003, design `.p3`): a pinned section where the scroll drives four stages (Discover, Plan, Furnish,
 * Deliver) of a 3D office, going from a blueprint to a lit, furnished room. The tabs jump to a stage; drag or the arrow
 * keys turn the model. Reduced motion or no WebGL: not pinned, the tabs set the stage (BR-001, REQ-013).
 */
export function Process({ locale }: { locale: "en" | "ar" }) {
  const t = useTranslations("home");
  const ts = useTranslations("scenes");
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [failed, setFailed] = useState(false);
  const section = useRef<HTMLElement>(null);
  const pinned = !reduced && !failed;
  const cur = processSteps[stage];

  // The scene reports the stage the scroll reached.
  useEffect(() => {
    const el = section.current;
    return el ? listen<number>(el, P3_STAGE, setStage) : undefined;
  }, []);
  // A hand-picked stage (not pinned) is read by the scene from `data-stage`.
  useEffect(() => {
    if (section.current) emit(section.current, P3_SET);
  }, [stage]);

  const onStatus = useCallback((s: SceneStatus) => setFailed(s === "unsupported" || s === "error" || s === "lost"), []);

  const pick = (i: number) => {
    const el = section.current;
    if (!el || !pinned) return setStage(i);
    // jump to that point of the scroll; the scene then reports the stage
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * Math.min(0.97, (i + 0.42) / 4), behavior: "smooth" });
  };

  return (
    <section ref={section} data-p3 data-testid="home-process" data-stage={stage} data-pinned={pinned} aria-label={t("procEyebrow")} className="ui-p3 bg-[color-mix(in_srgb,var(--navy)_5%,var(--cream))] dark:bg-night-2">
      <div className="ui-p3-grid">
        <div className="ui-p3-l">
          <div className="text-[12.5px] leading-[1.4] font-semibold tracking-[0.2em] text-link uppercase rtl:text-sm rtl:tracking-normal rtl:normal-case">
            {t("procEyebrow")}
          </div>
          <div key={stage} className="ui-p3-txt">
            <h2 className="mt-[26px] text-[clamp(32px,3.6vw,54px)] leading-[1.12] font-bold tracking-[-0.03em] rtl:leading-[1.35] rtl:tracking-normal" data-testid="p3-title">
              {localize(cur.title, locale)}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.75] text-muted">{localize(cur.text, locale)}</p>
          </div>
          <div className="mt-[38px] mb-3 text-xs font-medium tracking-[0.24em] text-muted uppercase rtl:text-sm rtl:tracking-normal">{ts("p3Stage")}</div>
          <div role="group" aria-label={ts("p3Stage")} className="inline-flex flex-wrap gap-1 self-start border border-line p-1">
            {processSteps.map((s, i) => (
              <button
                key={i}
                type="button"
                data-testid="p3-tab"
                aria-pressed={i === stage}
                aria-current={i === stage ? "step" : undefined}
                onClick={() => pick(i)}
                className={cn(
                  "flex min-h-11 items-center gap-2 px-[18px] text-[14.5px] transition-colors duration-300 max-sm:px-3 max-sm:text-[13.5px] rtl:leading-[1.6]",
                  i === stage ? "bg-navy text-cream dark:bg-cream dark:text-navy" : i < stage ? "text-fg hover:bg-navy/[0.06]" : "text-muted hover:bg-navy/[0.06]",
                )}
              >
                <span className={cn("text-[11px] font-semibold", i === stage && "opacity-55", i < stage && "text-link")}>0{i + 1}</span>
                {localize(s.tab, locale)}
              </button>
            ))}
          </div>
        </div>
        <div className="ui-p3-r">
          <div className="absolute inset-0">
            <SceneRoot
              load={() => import("@/three/scenes/process")}
              label={`${localize(cur.title, locale)} · ${ts("p3Hint")}`}
              camera={{ fov: 30, far: 120 }}
              exposure={1.05}
              releaseWhenFar
              onStatusChange={onStatus}
              className="size-full"
              fallback={<Image src="/images/home/process.jpg" alt={localize(cur.title, locale)} fill sizes="(min-width: 1025px) 58vw, 100vw" className="object-cover" />}
            />
          </div>
          <div className="pointer-events-none absolute end-[22px] bottom-5 z-[2] rounded-full bg-cream/90 px-3 py-[7px] text-[11.5px] font-semibold tracking-[0.22em] text-navy uppercase backdrop-blur-md rtl:text-[12.5px] rtl:tracking-normal">
            {ts("p3Fig")} 0{stage + 1} · {localize(cur.tag, locale)}
          </div>
          {!failed ? (
            <div className="absolute start-[22px] bottom-5 z-[2] flex items-center gap-3.5 text-xs tracking-[0.04em] text-cream/85 max-sm:hidden">
              <span>{ts("p3Hint")}</span>
              <button
                type="button"
                onClick={() => section.current && emit(section.current, P3_RESET)}
                className="min-h-8 cursor-pointer rounded-full border border-cream/25 bg-night/55 px-3.5 text-xs text-cream transition-colors hover:bg-night/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
              >
                {ts("p3ResetL")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
