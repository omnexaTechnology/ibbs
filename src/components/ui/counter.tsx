"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

/** Design: count-up runs 2 s with ease-out cubic, starts when 35% of the band is visible, once. */
export const COUNTER = { duration: 2000, threshold: 0.35 } as const;

export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

/** Value shown at progress `p` (0..1) on the way from `from` to `to`. */
export function countAt(p: number, to: number, from = 0, decimals = 0): number {
  const v = from + (to - from) * easeOutCubic(Math.min(1, Math.max(0, p)));
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

const noopSubscribe = () => () => {};

const defaultFormat = (n: number, decimals: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

type Props = {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  /** Rendered after the number in a <small> (design: "+", "%", ...). */
  suffix?: string;
  format?: (n: number, decimals: number) => string;
  className?: string;
};

/**
 * Number that counts up once when scrolled into view. The final value is in the server HTML and always
 * available to screen readers; with reduced motion (BR-001) or without JS it is simply shown.
 */
export function Counter({ to, from = 0, decimals = 0, duration = COUNTER.duration, prefix, suffix, format = defaultFormat, className }: Props) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: COUNTER.threshold, once: true });
  const [value, setValue] = useState<number | null>(null);
  // Server HTML (and the first client render) shows the final value; only after mount is it armed at `from`.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const armed = mounted && !reduced && !inView && value === null;
  const raf = useRef(0);

  useEffect(() => {
    if (reduced || !inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(countAt(p, to, from, decimals));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced, inView, to, from, decimals, duration]);

  // Before the band is seen the number sits at `from`; with reduced motion / no JS it is the final value.
  const shown = reduced ? to : value ?? (armed ? from : to);

  return (
    <span ref={ref} className={cn("tabular-nums", className)} data-testid="counter">
      <span aria-hidden="true" data-testid="counter-value">
        {prefix}
        {format(shown, decimals)}
        {suffix ? <small className="ms-1 text-[0.45em] font-medium text-link">{suffix}</small> : null}
      </span>
      <span className="sr-only" data-testid="counter-final">
        {prefix}
        {format(to, decimals)}
        {suffix}
      </span>
    </span>
  );
}
