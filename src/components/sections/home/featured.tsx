"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { SanityPicture } from "@/components/ui/sanity-image";
import { projectCategories } from "@/content/taxonomy";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Project } from "@/sanity/view-models";

/** Design `accClips`: each panel's top edge is cut at a slightly different angle (desktop only, see ui.css). */
const CLIPS = ["polygon(0 9%,100% 0,100% 100%,0 100%)", "polygon(0 0,100% 12%,100% 100%,0 100%)", "polygon(0 10%,100% 2%,100% 100%,0 100%)", "polygon(0 3%,100% 0,100% 100%,0 100%)", "polygon(0 0,100% 9%,100% 100%,0 100%)", "polygon(0 11%,100% 4%,100% 100%,0 100%)"];
const AUTO_MS = 5000;
const isRow = () => window.matchMedia("(max-width: 1024px)").matches;

/**
 * Home "Our projects" (design `.acc`, REQ-006): on desktop an accordion where the hovered / focused / pressed panel opens;
 * up to 1024px a swipeable row (the next card peeks in) with arrows and dots, advancing by itself unless reduced motion is on
 * or the visitor touches it. Closed panels' links are hidden on desktop (visibility), so Tab goes panel button -> open link.
 */
export function Featured({ projects, locale }: { projects: Project[]; locale: "en" | "ar" }) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tu = useTranslations("ui");
  const tp = useTranslations("projects");
  const reduced = useReducedMotion();
  const [on, setOn] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const list = projects.slice(0, 6);
  const n = list.length;

  const goTo = useCallback(
    (i: number) => {
      setOn(i);
      const el = row.current?.children[i] as HTMLElement | undefined;
      if (el && isRow()) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "start", block: "nearest" });
    },
    [reduced],
  );

  // keep the indicator in step with a swipe
  const onScroll = () => {
    const box = row.current;
    if (!box || !isRow()) return;
    const rtl = getComputedStyle(box).direction === "rtl";
    const r = box.getBoundingClientRect();
    let best = 0;
    let bd = Infinity;
    Array.from(box.children).forEach((c, i) => {
      const cr = c.getBoundingClientRect();
      const d = Math.abs(rtl ? cr.right - r.right : cr.left - r.left);
      if (d < bd) [best, bd] = [i, d];
    });
    setOn(best);
  };

  useEffect(() => {
    if (reduced || n < 2) return;
    const id = window.setInterval(() => {
      if (!paused.current && isRow()) goTo((on + 1) % n);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduced, n, on, goTo]);

  if (n === 0) return null;

  return (
    <section className="py-[clamp(72px,8vw,120px)]" data-testid="home-featured" aria-labelledby="feat-h">
      <div className="mx-auto max-w-[1280px] px-8 max-sm:px-5">
        <div className="mb-11 grid items-start gap-12 min-[1025px]:grid-cols-[1.3fr_1fr] max-[1024px]:gap-6">
          <Reveal>
            <h2 id="feat-h" className="text-[clamp(40px,5.4vw,84px)] leading-[1.02] font-bold tracking-[-0.045em] rtl:leading-[1.3] rtl:tracking-normal">
              {t("featT1")} <span className="text-link">{t("featHl")}</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="text-[17px] leading-[1.75] text-muted">{tp("projLead")}</p>
            <ButtonLink href="/projects" variant="ghost" className="mt-6">
              {t("allProjects")}
            </ButtonLink>
          </Reveal>
        </div>
        <div
          ref={row}
          className="ui-acc"
          data-testid="featured-acc"
          onScroll={onScroll}
          onPointerDown={() => (paused.current = true)}
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
          onFocus={() => (paused.current = true)}
          onBlur={() => (paused.current = false)}
        >
          {list.map((p, i) => {
            const title = localize(p.title, locale);
            const sector = projectCategories.find((c) => c.key === p.category);
            return (
              <div key={p.id} className={cn("ui-acc-p", i === on && "on")} data-testid="featured-panel" data-active={i === on} style={{ "--clip": CLIPS[i % 6] } as CSSProperties}>
                <div className="ui-acc-clip">
                  <SanityPicture image={p.cover} alt="" sizes="(min-width: 1025px) 60vw, 84vw" className="object-cover" />
                  <div className="ui-acc-shade" />
                </div>
                {/* desktop only (hidden in the row): focusing, hovering or pressing a closed panel opens it */}
                <button type="button" className="ui-acc-hit" aria-label={title} aria-pressed={i === on} onFocus={() => setOn(i)} onClick={() => setOn(i)} onMouseEnter={() => setOn(i)} />
                <span className="ui-acc-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ui-acc-v" aria-hidden="true">
                  {title}
                </span>
                <div className="ui-acc-body">
                  <div className="mb-3.5 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
                    {sector ? <span className="rounded-full bg-cream/15 px-2.5 py-1 backdrop-blur">{localize(sector.label, locale)}</span> : null}
                    {p.areaM2 !== null ? <span className="rounded-full bg-blue px-2.5 py-1 text-white">{p.areaM2.toLocaleString("en-US")} m²</span> : null}
                  </div>
                  <h3>{title}</h3>
                  <p>{[localize(p.city, locale), p.year, p.durationDays !== null ? `${p.durationDays} ${tc("days")}` : null].filter(Boolean).join(" · ")}</p>
                  <Link href={`/projects/${p.slug}`} data-testid="featured-link" className="inline-flex min-h-11 items-center rounded-full bg-cream px-6 text-sm font-semibold text-navy no-underline transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
                    {t("viewDetails")}
                    <span className="sr-only"> · {title}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {n > 1 ? (
          <div className="ui-acc-ind" role="group" aria-label={tu("slideOf", { current: on + 1, total: n })}>
            <button type="button" className="ui-acc-arw" aria-label={tu("prev")} disabled={on === 0} onClick={() => goTo(on - 1)}>
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <span className="flex items-center gap-3">
              {list.map((p, i) => (
                <button key={p.id} type="button" className={cn("ui-acc-dot", i === on && "on")} aria-label={`${i + 1} / ${n}`} aria-current={i === on ? "true" : undefined} onClick={() => goTo(i)} />
              ))}
            </span>
            <button type="button" className="ui-acc-arw" aria-label={tu("next")} disabled={on === n - 1} onClick={() => goTo(on + 1)}>
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
