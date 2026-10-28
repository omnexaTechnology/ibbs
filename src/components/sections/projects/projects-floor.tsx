"use client";

import { useTranslations } from "next-intl";
import { SceneRoot } from "@/three/scene-root";

/** Projects page 3D floor (REQ-008). Three stays in a lazy chunk via SceneRoot; the still drawing is the fallback. */
export function ProjectsFloor() {
  const t = useTranslations("scenes");
  return (
    <div className="relative mx-auto mb-6 h-[clamp(300px,40vw,500px)] w-[min(1100px,94%)]" data-testid="projects-floor">
      <SceneRoot
        load={() => import("@/three/scenes/projects-floor")}
        label={t("pj3dL")}
        alpha
        camera={{ fov: 26, near: 0.1, far: 120 }}
        className="size-full"
        fallback={
          // eslint-disable-next-line @next/next/no-img-element -- decorative still drawing, already an optimised SVG
          <img src="/images/hero-iso.svg" alt="" className="size-full object-contain opacity-60" />
        }
      />
      <span className="pointer-events-none absolute bottom-2.5 end-6 text-[11px] font-semibold tracking-[0.22em] text-muted uppercase rtl:text-[12.5px] rtl:tracking-normal" aria-hidden="true">
        {t("p3Hint")}
      </span>
    </div>
  );
}
