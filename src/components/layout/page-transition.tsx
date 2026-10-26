"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getPathname, useRouter } from "@/i18n/navigation-base";

export type Href = Parameters<typeof getPathname>[0]["href"];
type Phase = "close" | "hold" | "open" | null;

/** Design timeline: curtains close (swap at 1.15s), the new page is revealed, all done at ~2.4s. */
export const TRANSITION_TIMING = {
  /** Curtains closed: navigate now. */
  swapAfter: 1150,
  /** Pause after the new page has committed before the curtains open (1260 - 1150 in the design). */
  openAfterCommit: 110,
  /** Opening animation length (2400 - 1260 in the design). */
  openDuration: 1140,
  /** Safety net: open anyway if the navigation never commits. */
  commitTimeout: 5000,
  commitPoll: 40,
} as const;

type NavigateOptions = {
  /** Text shown on the curtains. Defaults to the name of the target page. */
  label?: string;
};

type PageTransitionApi = {
  /**
   * Navigate with the page transition. Returns false when nothing was started
   * (the target is the current URL) so the caller can fall back to default behaviour.
   */
  navigate: (href: Href, options?: NavigateOptions) => boolean;
  /** True while a transition is running. */
  active: boolean;
};

const PageTransitionContext = createContext<PageTransitionApi | null>(null);

export function usePageTransition(): PageTransitionApi | null {
  return useContext(PageTransitionContext);
}

function currentUrl() {
  return window.location.pathname + window.location.search;
}

function normalise(url: string) {
  const u = new URL(url, window.location.origin);
  return u.pathname + u.search;
}

/** Wraps the app: provides `navigate()` and renders the curtain overlay. */
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tCommon = useTranslations("common");

  const [state, setState] = useState<{ phase: Phase; label: string }>({ phase: null, label: "" });
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const poll = useRef<number | null>(null);

  const clearAll = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (poll.current !== null) window.clearInterval(poll.current);
    poll.current = null;
  }, []);

  useEffect(() => clearAll, [clearAll]);

  const labelFor = useCallback(
    (url: string) => {
      const path = new URL(url, window.location.origin).pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
      if (path === "/") return tNav("navHome");
      if (path.startsWith("/about")) return tNav("navAbout");
      if (path.startsWith("/projects")) return tNav("navProjects");
      if (path.startsWith("/contact")) return tNav("navContact");
      if (path.startsWith("/privacy")) return tFooter("privacy");
      if (path.startsWith("/terms")) return tFooter("terms");
      return tCommon("brand");
    },
    [tNav, tFooter, tCommon],
  );

  const navigate = useCallback<PageTransitionApi["navigate"]>(
    (href, options) => {
      const target = normalise(getPathname({ href, locale }));
      if (target === currentUrl()) return false;

      // Reduced motion: no transition at all (REQ-010, BR-002).
      if (reduced) {
        router.push(href);
        return true;
      }
      // One transition at a time; the overlay also blocks pointer input.
      if (busy.current) return true;

      busy.current = true;
      setState({ phase: "close", label: options?.label ?? labelFor(target) });

      const after = (ms: number, fn: () => void) => {
        timers.current.push(window.setTimeout(fn, ms));
      };
      const finish = () => {
        setState({ phase: null, label: "" });
        busy.current = false;
      };

      after(TRANSITION_TIMING.swapAfter, () => {
        setState((s) => ({ ...s, phase: "hold" }));
        router.push(href);

        const startedAt = Date.now();
        poll.current = window.setInterval(() => {
          const committed = currentUrl() === target;
          const timedOut = Date.now() - startedAt > TRANSITION_TIMING.commitTimeout;
          if (!committed && !timedOut) return;
          if (poll.current !== null) window.clearInterval(poll.current);
          poll.current = null;

          // New page is in place behind the curtains: start at the top, then open.
          window.scrollTo({ top: 0, behavior: "instant" });
          after(TRANSITION_TIMING.openAfterCommit, () => {
            setState((s) => ({ ...s, phase: "open" }));
            after(TRANSITION_TIMING.openDuration, finish);
          });
        }, TRANSITION_TIMING.commitPoll);
      });

      return true;
    },
    [labelFor, locale, reduced, router],
  );

  const api = useMemo<PageTransitionApi>(
    () => ({ navigate, active: state.phase !== null }),
    [navigate, state.phase],
  );

  return (
    <PageTransitionContext.Provider value={api}>
      {children}
      {state.phase && (
        <div className={`tr ${state.phase}`} aria-hidden="true" data-testid="page-transition" data-phase={state.phase}>
          <div className="tr-p l" />
          <div className="tr-p r" />
          <div className="tr-line" />
          <div className="tr-c" dir={locale === "ar" ? "rtl" : "ltr"}>
            <span className="tr-k">{tCommon("trOpening")}</span>
            <span className="tr-t">{state.label}</span>
            <span className="tr-st">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      )}
      <div role="status" className="sr-only">
        {state.phase ? `${tCommon("trOpening")} ${state.label}` : ""}
      </div>
    </PageTransitionContext.Provider>
  );
}
