"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/** Design: a layout size change settles for 150 ms, then ScrollTrigger recalculates (ignored under 2 px). */
export const GSAP_REFRESH = { debounceMs: 150, minDeltaPx: 2 } as const;

/**
 * Keeps ScrollTrigger positions correct (REQ-014): refreshes after every route change and whenever
 * the page height changes (images, fonts, accordions). GSAP is imported lazily so pages that never
 * use it do not pay for it. Mount once, in the locale layout (see `<GsapRefresh />`).
 */
export function useGsapRefresh() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    import("@/lib/gsap").then(({ ScrollTrigger }) => {
      if (cancelled) return;
      // Wait one frame so the new route has committed its DOM before measuring.
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      const h = document.body.offsetHeight;
      if (Math.abs(h - last) < GSAP_REFRESH.minDeltaPx) return;
      last = h;
      clearTimeout(timer);
      timer = setTimeout(() => {
        import("@/lib/gsap").then(({ ScrollTrigger }) => ScrollTrigger.refresh());
      }, GSAP_REFRESH.debounceMs);
    });
    ro.observe(document.body);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);
}
