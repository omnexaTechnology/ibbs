"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SceneRoot } from "@/three/scene-root";

/** Must match `AB_STEP_EVENT` in the scene (not imported: this file must not pull Three into the page chunk). */
const STEP_EVENT = "ab-step";

/** The 8-step 3D build (REQ-007). Three stays in a lazy chunk via SceneRoot; the still drawing is the fallback. */
export function AboutBuild() {
  const t = useTranslations("scenes");
  const ta = useTranslations("about");
  const host = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const on = (e: Event) => setStep((e as CustomEvent<number>).detail);
    el.addEventListener(STEP_EVENT, on);
    return () => el.removeEventListener(STEP_EVENT, on);
  }, []);

  const names = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ta(`abStep${n}` as `abStep1`));
  return (
    <div ref={host} className="relative aspect-[1.1] w-full max-sm:aspect-[1] max-sm:min-h-[320px]" data-testid="about-build">
      <SceneRoot
        load={() => import("@/three/scenes/about-build")}
        label={t("ab3dL")}
        alpha
        camera={{ fov: 28, near: 0.1, far: 120 }}
        className="size-full"
        fallback={
          // eslint-disable-next-line @next/next/no-img-element -- decorative still drawing, already an optimised SVG
          <img src="/images/hero-iso.svg" alt="" className="size-full object-contain opacity-60" />
        }
      />
      <span className="pointer-events-none absolute top-1 start-2 text-[11px] font-semibold tracking-[0.22em] text-muted uppercase rtl:text-[12.5px] rtl:tracking-normal" aria-hidden="true">
        {`0${step + 1} / 08 · ${names[step]}`}
      </span>
      <span className="pointer-events-none absolute bottom-1 end-2 text-[11px] font-semibold tracking-[0.22em] text-muted uppercase rtl:text-[12.5px] rtl:tracking-normal" aria-hidden="true">
        {t("dragK2")}
      </span>
    </div>
  );
}
