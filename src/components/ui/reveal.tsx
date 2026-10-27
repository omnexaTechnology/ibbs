"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  as?: ElementType;
  /** `up`: fade + rise (design `.rv`). `image`: clip-path curtain (design `.rv-img`). */
  variant?: "up" | "image";
  className?: string;
  children?: ReactNode;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTimeline() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
}

/**
 * Scroll reveal. Server HTML is fully visible (no JS, crawlers). After mount:
 * - reduced motion: nothing happens;
 * - scroll-driven animations supported: `data-reveal="view"` hands the animation to CSS (as in the design);
 * - otherwise: hidden (`wait`) until an IntersectionObserver sees it, then plays (`go`).
 */
export function Reveal({ as: Tag = "div", variant = "up", className, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (supportsViewTimeline()) {
      el.dataset.reveal = "view";
      return () => {
        delete el.dataset.reveal;
      };
    }
    if (typeof IntersectionObserver === "undefined") return;
    el.dataset.reveal = "wait";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.dataset.reveal = "go";
        io.disconnect();
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.reveal;
    };
  }, []);

  return (
    <Tag ref={ref} className={cn(variant === "image" ? "ui-rv-img" : "ui-rv", className)}>
      {children}
    </Tag>
  );
}
