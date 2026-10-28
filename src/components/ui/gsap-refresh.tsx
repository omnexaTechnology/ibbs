"use client";

import { useGsapRefresh } from "@/hooks/use-gsap-refresh";

/** Renders nothing; keeps GSAP ScrollTrigger in sync with route changes and page height. */
export function GsapRefresh() {
  useGsapRefresh();
  return null;
}
