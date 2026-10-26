"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Elements that show the "go" (arrow) cursor. */
const ACTION = 'a, button, select, label, [role="tab"]';
/** Elements that show the "view" (eye) cursor. Add `data-cursor="view"` to custom media areas. */
const MEDIA = 'img, canvas, [data-cursor="view"]';

/**
 * Custom pointer (design `setupCur`): a ring that trails the mouse and grows
 * over links ("go") and media ("view"). Only for fine pointers (mouse/trackpad)
 * and never with reduced motion; otherwise nothing is rendered visibly and the
 * native cursor stays.
 */
export function CustomCursor() {
  const el = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const cursor = el.current;
    if (!cursor || reduced || !window.matchMedia("(pointer: fine)").matches) return;

    document.documentElement.classList.add("has-cur");
    let x = -100;
    let y = -100;
    let cx = -100;
    let cy = -100;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target instanceof Element ? e.target : null;
      const action = target?.closest(ACTION);
      const media = target?.closest(MEDIA) ?? action?.closest(MEDIA);
      const hit = action?.hasAttribute("data-cursor-hit");
      cursor.dataset.m = action && !hit ? "go" : media ? "view" : "";
      cursor.dataset.on = "1";
    };
    const onLeave = () => {
      cursor.dataset.on = "";
    };
    const onDown = () => {
      cursor.dataset.dn = "1";
    };
    const onUp = () => {
      cursor.dataset.dn = "";
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    loop();

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cur");
    };
  }, [reduced]);

  return (
    <div ref={el} className="cur" aria-hidden="true" data-testid="custom-cursor">
      <svg className="ci ci-g" viewBox="0 0 24 24">
        <path d="M7 7h10v10" />
        <path d="M7 17 17 7" />
      </svg>
      <svg className="ci ci-v" viewBox="0 0 24 24">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </div>
  );
}
