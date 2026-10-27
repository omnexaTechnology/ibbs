"use client";

import { useCallback, useEffect, useState } from "react";

type Options = {
  /** Fraction of the element that must be visible (0..1). Design count-up uses 0.35. */
  threshold?: number;
  rootMargin?: string;
  /** Stop observing after the first time the element is in view (default true). */
  once?: boolean;
};

/**
 * Tells whether an element is in the viewport. Returns a callback ref and the flag.
 * Without IntersectionObserver (very old browsers) it reports `true` so content is never stuck hidden.
 */
export function useInView<T extends Element = HTMLElement>({ threshold = 0, rootMargin = "0px", once = true }: Options = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[entries.length - 1];
        if (!hit) return;
        if (hit.isIntersecting) {
          setInView(true);
          if (once) {
            io.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, threshold, rootMargin, once]);

  return [ref, inView] as const;
}
