"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, GeoAlt, Search } from "react-bootstrap-icons";
import { SanityPicture } from "@/components/ui/sanity-image";
import { PROJECT_CATEGORY_KEYS, projectCategories, scopeItems, type ProjectCategoryKey } from "@/content/taxonomy";
import { Link } from "@/i18n/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { localize } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Project } from "@/sanity/view-models";

/** Design: 2 rows of 4 per page. */
export const PAGE_SIZE = 8;

export type Filters = { category: ProjectCategoryKey | "all"; type: string; city: string; q: string };

const sectorOf = (p: Project) => projectCategories.find((c) => c.key === p.category);

/** Pure filter, exported for tests. City is matched on the English name (the stable key), search on both languages. */
export function filterProjects(projects: Project[], f: Filters): Project[] {
  const q = f.q.trim().toLowerCase();
  return projects.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.type !== "all" && !(p.scope as string[]).includes(f.type)) return false;
    if (f.city !== "all" && p.city.en !== f.city) return false;
    if (!q) return true;
    const s = sectorOf(p);
    return [p.title.en, p.title.ar, s?.label.en, s?.label.ar, p.city.en, p.city.ar].join(" ").toLowerCase().includes(q);
  });
}

/** Page buttons: first, last and the neighbours of the current page; `-1` is a gap. */
export function pageSequence(total: number, current: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 1) seq.push(i);
    else if (seq[seq.length - 1] !== -1) seq.push(-1);
  }
  return seq;
}

const fieldCls = "h-12 min-w-0 rounded-full border border-transparent bg-transparent px-4 text-[15px] text-fg outline-none focus-visible:border-blue";

/** Project list with category tabs (counts), type / city selects, search and pagination (REQ-008). `?category=` pre-selects a tab. */
export function ProjectsExplorer({ projects, locale, category = "all" }: { projects: Project[]; locale: string; category?: Filters["category"] }) {
  const t = useTranslations("projects");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const tu = useTranslations("ui");
  const [type, setType] = useState("all");
  const [city, setCity] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // The URL owns the category (footer links change it while this page stays mounted); a change resets the page.
  const [seenCategory, setSeenCategory] = useState(category);
  if (seenCategory !== category) {
    setSeenCategory(category);
    setPage(0);
  }

  const cities = useMemo(() => {
    const seen = new Map<string, string>();
    projects.forEach((p) => p.city.en && !seen.has(p.city.en) && seen.set(p.city.en, localize(p.city, locale)));
    return [...seen].map(([en, label]) => ({ en, label }));
  }, [projects, locale]);
  const types = useMemo(() => scopeItems.filter((s) => projects.some((p) => p.scope.includes(s.key))), [projects]);
  const counts = useMemo(() => Object.fromEntries(PROJECT_CATEGORY_KEYS.map((k) => [k, projects.filter((p) => p.category === k).length])) as Record<ProjectCategoryKey, number>, [projects]);

  const list = filterProjects(projects, { category, type, city, q });
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const shown = list.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);
  /** R3-08: a page change brings the top of the list into view (focus stays on the pressed button). */
  const goPage = (n: number) => {
    setPage(n);
    root.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  const pickCategory = (k: Filters["category"]) => {
    // Next syncs useSearchParams with replaceState, which feeds `category` back in as a prop
    const url = new URL(window.location.href);
    if (k === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", k);
    window.history.replaceState(null, "", url);
  };
  const tabs: { key: Filters["category"]; label: string; count: number }[] = [
    { key: "all", label: t("fAll"), count: projects.length },
    ...projectCategories.map((c) => ({ key: c.key, label: localize(c.label, locale), count: counts[c.key] })),
  ];

  return (
    <div ref={root} className="scroll-mt-28" data-testid="projects-explorer">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-6 flex flex-wrap items-center gap-2 rounded-[28px] border border-line bg-surface p-2">
        <label className="relative flex min-w-[170px] flex-1 items-center">
          <span className="sr-only">{t("pjTypeL")}</span>
          <select className={cn(fieldCls, "w-full")} value={type} onChange={(e) => reset(() => setType(e.target.value))} data-testid="filter-type">
            <option value="all">{t("pjAllTypes")}</option>
            {types.map((s) => (
              <option key={s.key} value={s.key}>
                {localize(s.label, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative flex min-w-[220px] flex-[2] items-center">
          <span className="sr-only">{t("pjSearch")}</span>
          <Search className="pointer-events-none absolute start-4 size-4 text-muted" aria-hidden="true" />
          <input type="search" className={cn(fieldCls, "w-full ps-11")} value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder={t("pjSearchPh")} data-testid="filter-search" />
        </label>
        <label className="relative flex min-w-[170px] flex-1 items-center">
          <span className="sr-only">{t("pjCityL")}</span>
          <GeoAlt className="pointer-events-none absolute start-4 size-4 text-muted" aria-hidden="true" />
          <select className={cn(fieldCls, "w-full ps-10")} value={city} onChange={(e) => reset(() => setCity(e.target.value))} data-testid="filter-city">
            <option value="all">{t("pjAllCities")}</option>
            {cities.map((c) => (
              <option key={c.en} value={c.en}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-12 rounded-full bg-btn px-7 text-[15px] font-semibold text-btn-text transition-colors hover:bg-blue hover:text-white">
          {t("pjSearchBtn")}
        </button>
      </form>

      <div className="mb-8 flex gap-2.5 overflow-x-auto pb-1.5 [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("pjT1")} data-testid="category-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={category === tab.key}
            data-testid={`tab-${tab.key}`}
            onClick={() => pickCategory(tab.key)}
            className={cn("inline-flex min-h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full border px-5 text-[15px] font-semibold transition-colors", category === tab.key ? "border-transparent bg-btn text-btn-text" : "border-line bg-surface text-fg hover:border-blue")}
          >
            {tab.label}
            <span className="rounded-full bg-fg/10 px-2 py-0.5 text-xs tabular-nums">{tab.count}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" role="status" data-testid="projects-status">
        {list.length === 0 ? t("pjNone") : t("pjCount", { n: list.length })}
      </p>
      {list.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted" data-testid="projects-empty">
          {t("pjNone")}
        </p>
      ) : (
        <ul className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-[600px]:grid-cols-1" data-testid="projects-grid">
          {shown.map((p, i) => {
            const title = localize(p.title, locale);
            const sector = sectorOf(p);
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.slug}`} data-testid="project-card" className="ui-pjh group relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-night text-cream no-underline shadow-[0_24px_50px_-24px_rgba(0,0,0,.7)] transition-shadow duration-500 hover:shadow-[0_0_0_2px_var(--cyan),0_24px_50px_-24px_rgba(0,0,0,.7)] max-sm:aspect-[4/3.3]">
                  <SanityPicture image={p.cover} alt="" sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.08]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent transition-colors duration-500 max-lg:via-night/10 lg:group-hover:from-night/90 lg:group-hover:via-night/25" aria-hidden="true" />
                  <span className="absolute end-3 top-3 grid h-[30px] min-w-10 place-items-center rounded-full bg-white/90 px-2.5 text-xs font-semibold text-navy tabular-nums" aria-hidden="true">
                    {String(cur * PAGE_SIZE + i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute inset-x-4 bottom-4 flex flex-col">
                    <span className="ui-pjh-more">
                      <span className="flex flex-col">
                        <span className="mb-2.5 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
                          {sector ? <span className="rounded-full bg-cream/15 px-2.5 py-1 backdrop-blur">{localize(sector.label, locale)}</span> : null}
                          {p.areaM2 !== null ? <span className="rounded-full bg-blue px-2.5 py-1 text-white">{p.areaM2.toLocaleString("en-US")} m²</span> : null}
                        </span>
                      </span>
                    </span>
                    <span className="text-[clamp(15px,1.25vw,19px)] leading-tight font-semibold">{title}</span>
                    <span className="ui-pjh-more">
                      <span className="flex flex-col">
                        <span className="mt-2 text-[12.5px] text-cream/85">{[localize(p.city, locale), p.year, p.durationDays !== null ? `${p.durationDays} ${tc("days")}` : null].filter(Boolean).join(" · ")}</span>
                        <span className="mt-2 text-sm font-semibold text-cyan">{th("viewDetails")}</span>
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(
        <nav aria-label={t("pjPages")} className="mt-12 flex items-center justify-center gap-2" data-testid="pager">
          <button type="button" className="grid size-11 place-items-center rounded-full border border-line disabled:opacity-40" aria-label={tu("prev")} disabled={cur === 0} onClick={() => goPage(cur - 1)}>
            <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          {pageSequence(pages, cur).map((n, i) =>
            n < 0 ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
                …
              </span>
            ) : (
              <button key={n} type="button" aria-current={n === cur ? "page" : undefined} aria-label={String(n + 1)} onClick={() => goPage(n)} className={cn("grid size-11 place-items-center rounded-full border text-[15px] font-semibold tabular-nums", n === cur ? "border-transparent bg-btn text-btn-text" : "border-line hover:border-blue")}>
                {n + 1}
              </button>
            ),
          )}
          <button type="button" className="grid size-11 place-items-center rounded-full border border-line disabled:opacity-40" aria-label={tu("next")} disabled={cur === pages - 1} onClick={() => goPage(cur + 1)}>
            <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
