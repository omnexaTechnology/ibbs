"use client";

import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSwipe } from "@/hooks/use-swipe";
import { cn } from "@/lib/utils";

/** Design hero: slides change every 5 s with a 1.4 s cross-fade. */
export const CAROUSEL = { interval: 5000, fadeMs: 1400 } as const;

type Direction = "ltr" | "rtl";

type Options = {
  count: number;
  interval?: number;
  autoAdvance?: boolean;
  /** Extra reasons to hold still (hover, focus). */
  paused?: boolean;
  /** Only advance while the carousel is on screen. */
  visible?: boolean;
  defaultIndex?: number;
  onIndexChange?: (i: number) => void;
};

/** Index state + auto-advance. Auto-advance is off for reduced motion (BR-001), hidden tabs, off-screen and paused states. */
export function useCarousel({ count, interval = CAROUSEL.interval, autoAdvance = true, paused = false, visible = true, defaultIndex = 0, onIndexChange }: Options) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(defaultIndex);
  const [tabHidden, setTabHidden] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % count) + count) % count;
      setIndex(next);
      onIndexChange?.(next);
    },
    [count, onIndexChange],
  );

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = autoAdvance && !reduced && !paused && visible && !tabHidden && count > 1;

  // A timeout keyed on `index` restarts the countdown after every manual change, like the design.
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => goTo(index + 1), interval);
    return () => clearTimeout(id);
  }, [running, index, interval, goTo]);

  return { index, goTo, next: () => goTo(index + 1), prev: () => goTo(index - 1), running, reduced };
}

type Props = {
  items: ReactNode[];
  /** Accessible name of the carousel. */
  label: string;
  dir?: Direction;
  interval?: number;
  autoAdvance?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  /** "01 / 04" counter at the bottom start. */
  showCount?: boolean;
  defaultIndex?: number;
  onIndexChange?: (i: number) => void;
  className?: string;
};

/**
 * Cross-fading carousel (the home hero pattern). Slides are stacked; size the root from outside.
 * Keyboard: arrows (visual direction, so reversed in RTL), Home, End. Dots and arrows are real buttons.
 * Auto-advance pauses on hover and focus, and never runs under reduced motion.
 */
export function Carousel({ items, label, dir = "ltr", interval, autoAdvance = true, showArrows = true, showDots = true, showCount = false, defaultIndex, onIndexChange, className }: Props) {
  const t = useTranslations("ui");
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [viewRef, visible] = useInView<HTMLDivElement>({ threshold: 0.1, once: false });
  const count = items.length;
  const c = useCarousel({ count, interval, autoAdvance, paused: hover || focus, visible, defaultIndex, onIndexChange });
  const rtl = dir === "rtl";
  const swipe = useSwipe((d) => (d === "left" ? (rtl ? c.prev() : c.next()) : rtl ? c.next() : c.prev()));

  const onKeyDown = (e: KeyboardEvent) => {
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) c.next();
    else if (e.key === back) c.prev();
    else if (e.key === "Home") c.goTo(0);
    else if (e.key === "End") c.goTo(count - 1);
    else return;
    e.preventDefault();
  };

  if (count === 0) return null;

  return (
    <div
      ref={viewRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      dir={dir}
      className={cn("relative", className)}
      data-testid="carousel"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
      }}
      {...swipe}
    >
      <div aria-live={c.running ? "off" : "polite"}>
        {items.map((item, i) => {
          const on = i === c.index;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideOf", { current: i + 1, total: count })}
              inert={!on}
              className={cn("ui-car-slide", on && "on")}
              data-testid="carousel-slide"
              data-active={on}
            >
              {item}
            </div>
          );
        })}
      </div>

      {showArrows && count > 1 ? (
        <>
          <button type="button" className="ui-car-arr ui-car-prev start-3" aria-label={t("prev")} onClick={c.prev}>
            <ChevronLeft className="size-9 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <button type="button" className="ui-car-arr ui-car-next end-3" aria-label={t("next")} onClick={c.next}>
            <ChevronRight className="size-9 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </>
      ) : null}

      {(showDots || showCount) && count > 1 ? (
        <div className="absolute inset-x-0 bottom-7 z-[7] flex items-center justify-center" dir="ltr">
          {showCount ? (
            <span className="absolute start-8 text-[15px] font-semibold text-cream tabular-nums" aria-hidden="true">
              {String(c.index + 1).padStart(2, "0")} <i className="not-italic text-cream/55">/ {String(count).padStart(2, "0")}</i>
            </span>
          ) : null}
          {showDots ? (
            <div className="ui-car-dots" role="group" aria-label={t("slides")}>
              {items.map((_, i) => (
                <button key={i} type="button" className={cn("ui-car-dot", i === c.index && "on")} aria-label={t("goToSlide", { n: i + 1 })} aria-current={i === c.index ? "true" : undefined} onClick={() => c.goTo(i)}>
                  <span />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
