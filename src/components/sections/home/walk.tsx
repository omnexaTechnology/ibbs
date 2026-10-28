"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowClockwise, ArrowDown, ArrowsMove, X } from "react-bootstrap-icons";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { INFO, ZONES, ZONE_NAMES } from "@/three/info";
import { emit, listen, WK_CLOSE, WK_ENTER, WK_EXIT, WK_GOTO, WK_INSIDE, WK_RESET, WK_SELECT, WK_ZONE } from "@/three/scene-events";
import { SceneRoot } from "@/three/scene-root";
import type { SceneStatus } from "@/three/scene-types";
import { walkLayout } from "@/three/walk-layout";

type Selected = { type: keyof typeof INFO; zone: string } | null;

const coarseQuery = "(pointer: coarse)";
const subscribeCoarse = (cb: () => void) => {
  const mq = window.matchMedia(coarseQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useCoarsePointer = () =>
  useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(coarseQuery).matches,
    () => false,
  );

/** Text alternative of the 3D office, from the same floor plan as the scene (pieces per zone, counted). */
function useFurnitureList(locale: "en" | "ar") {
  return useMemo(() => {
    const by: Record<string, Map<string, number>> = {};
    for (const it of walkLayout()) {
      const type = it.t;
      if (type === "glass" || !(type in INFO)) continue;
      const z = (by[it.zone] ??= new Map());
      z.set(type, (z.get(type) ?? 0) + 1);
    }
    const i = locale === "ar" ? 1 : 0;
    return ["reception", "work", "storage", "meeting", "exec", "lounge"]
      .filter((z) => by[z])
      .map((z) => ({
        zone: ZONE_NAMES[z][i],
        items: [...by[z]].map(([type, n]) => {
          const info = INFO[type as keyof typeof INFO];
          return { type, name: info.name[locale] + (n > 1 ? ` × ${n}` : ""), detail: info.detail[locale] };
        }),
      }));
  }, [locale]);
}

const btn =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-navy/10 bg-cream/90 px-4 text-[13px] font-semibold whitespace-nowrap text-navy backdrop-blur-md transition-colors duration-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue max-sm:min-h-9 max-sm:px-3 max-sm:text-xs";

/**
 * Office walk-through (REQ-004, design `.wk`): a pinned, full-bleed 3D office. Scrolling walks the camera through reception,
 * workstations, the lounge, the meeting room and the executive office; blue markers sit on real furniture. "Explore freely"
 * goes full screen (drag to look, WASD / arrows, click the floor), "Skip" leaves the pinned section. Reduced motion or no WebGL:
 * not pinned (BR-001, REQ-013). The text list of the furniture is always available to screen readers.
 */
export function Walk({ locale }: { locale: "en" | "ar" }) {
  const t = useTranslations("walkthrough");
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const section = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState(false);
  const [inside, setInside] = useState(false);
  const [zone, setZone] = useState("entrance");
  const [goto, setGoto] = useState(0);
  const [sel, setSel] = useState<Selected>(null);
  const groups = useFurnitureList(locale);
  const wasInside = useRef(false);
  const li = locale === "ar" ? 1 : 0;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const offs = [listen<string>(el, WK_ZONE, setZone), listen<boolean>(el, WK_INSIDE, (v) => {
        setInside(v);
        if (!v) setGoto(0);
      }), listen<Selected>(el, WK_SELECT, setSel)];
    return () => offs.forEach((off) => off());
  }, []);
  // Leaving free mode puts the focus back on its button (the overlay it was in is gone).
  useEffect(() => {
    if (wasInside.current && !inside) section.current?.querySelector<HTMLElement>("[data-wk-free]")?.focus({ preventScroll: true });
    wasInside.current = inside;
  }, [inside]);

  const onStatus = useCallback((s: SceneStatus) => setFailed(s === "unsupported" || s === "error" || s === "lost"), []);
  const send = (name: string, detail?: unknown) => section.current && emit(section.current, name, detail);
  const scrollToQ = (q: number) => {
    const el = section.current;
    if (!el) return;
    send(WK_CLOSE);
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: q > 1 ? top + el.offsetHeight + 1 : top + span * q, behavior: reduced ? "auto" : "smooth" });
  };
  const selInfo = sel ? INFO[sel.type] : null;
  const pinned = !reduced && !failed;

  return (
    <section ref={section} data-wk data-testid="home-walk" data-pinned={pinned} aria-labelledby="wk-title" className="ui-wk">
      <h2 id="wk-title" className="sr-only">
        {t("wkTitle")}
      </h2>
      <div className="ui-wk-pin">
        <div className={cn("ui-wk-stage wk-stage", inside && "on")} data-inside={inside}>
          <div className="absolute inset-0">
            <SceneRoot
              load={() => import("@/three/scenes/walk")}
              label={t("wkCanvasL")}
              camera={{ fov: 40, near: 0.05, far: 120 }}
              exposure={0.95}
              releaseWhenFar
              onStatusChange={onStatus}
              className="size-full"
              fallback={<Image src="/images/home/walk.jpg" alt={t("wkTitle")} fill sizes="100vw" className="object-cover" />}
            />
          </div>
          <div className="wk-marks ui-wk-marks" />
          <div className="ui-wk-tip wk-tip" aria-hidden="true" />

          {!inside && !failed ? (
            <>
              <div className="ui-wk-acts">
                <button type="button" data-wk-free data-testid="wk-free" className={cn(btn, "bg-navy text-cream hover:bg-navy hover:text-cream")} onClick={() => send(WK_ENTER)}>
                  <ArrowsMove className="size-[15px]" aria-hidden="true" />
                  {t("wkFree")}
                </button>
                <button type="button" className={btn} onClick={() => scrollToQ(0)}>
                  <ArrowClockwise className="size-[15px]" aria-hidden="true" />
                  {t("wkReset")}
                </button>
                <button type="button" data-testid="wk-skip" className={btn} onClick={() => scrollToQ(1.02)}>
                  <ArrowDown className="size-[15px]" aria-hidden="true" />
                  {t("wkSkip")}
                </button>
              </div>
              <div className="ui-wk-now" aria-live="polite">
                <span>{t("wkNowL")}</span>
                <b data-testid="wk-now">{(ZONE_NAMES[zone] ?? ZONE_NAMES.entrance)[li]}</b>
                <i className="ui-wk-bar">
                  <span />
                </i>
              </div>
              <p className="ui-wk-guide">{coarse ? t("wkGuideT") : t("wkGuideF")}</p>
            </>
          ) : null}

          {inside ? (
            <>
              <div className="ui-wk-top">
                <div role="group" aria-label={t("wkZonesL")} className="flex flex-wrap gap-2 max-sm:flex-nowrap max-sm:overflow-x-auto">
                  {ZONES.map((z, i) => (
                    <button
                      key={z.id}
                      type="button"
                      data-testid="wk-zone"
                      aria-pressed={goto === i}
                      className={cn(btn, "max-sm:flex-none", goto === i && "bg-navy text-cream hover:bg-navy")}
                      onClick={() => {
                        setGoto(i);
                        send(WK_GOTO, i);
                      }}
                    >
                      {z[locale]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-none gap-2 max-sm:justify-end">
                  <button
                    type="button"
                    className={btn}
                    onClick={() => {
                      setGoto(0);
                      send(WK_RESET);
                    }}
                  >
                    {t("wkReset")}
                  </button>
                  <button type="button" data-testid="wk-exit" className={cn(btn, "border-navy bg-navy text-cream hover:bg-navy")} onClick={() => send(WK_EXIT)}>
                    {t("wkExit")}
                    <X className="size-[15px]" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="ui-wk-help">{coarse ? t("wkHelpT") : t("wkHelpF")}</p>
            </>
          ) : null}

          {selInfo && sel ? (
            <aside className="ui-wk-info" aria-live="polite" data-testid="wk-info">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-blue uppercase rtl:text-[12.5px] rtl:tracking-normal">{ZONE_NAMES[sel.zone]?.[li]}</span>
              <h3 className="mt-1.5 text-xl text-navy">{selInfo.name[locale]}</h3>
              <p className="mt-2 text-sm leading-[1.6] text-navy/75">{selInfo.detail[locale]}</p>
              <button type="button" className={cn(btn, "mt-3.5")} onClick={() => send(WK_CLOSE)}>
                {t("wkClose")}
              </button>
            </aside>
          ) : null}
        </div>
      </div>
      <details className="sr-only">
        <summary>{t("wkListL")}</summary>
        <div>
          {groups.map((g) => (
            <div key={g.zone}>
              <h3>{g.zone}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it.type}>
                    <b>{it.name}</b> <span>{it.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
