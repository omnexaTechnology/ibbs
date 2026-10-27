"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

export const SWIPE_MIN_PX = 50;

/** Decide a swipe from the pointer travel: mostly horizontal and at least SWIPE_MIN_PX. */
export function swipeDirection(dx: number, dy: number): "left" | "right" | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return null;
  return dx < 0 ? "left" : "right";
}

/** Pointer handlers for a horizontal swipe (touch, pen or mouse drag). `left` = content dragged to the left. */
export function useSwipe(onSwipe: (dir: "left" | "right") => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
      swiped.current = false;
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const d = swipeDirection(e.clientX - s.x, e.clientY - s.y);
      if (d) {
        swiped.current = true;
        onSwipe(d);
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
    /** The click that ends a swipe is swallowed (a drag that finishes on a backdrop or a button must not trigger it). */
    onClickCapture: (e: MouseEvent) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.stopPropagation();
    },
  };
}
