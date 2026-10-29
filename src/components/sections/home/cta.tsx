"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import type { ToneMapping } from "three";
import { SceneRoot } from "@/three/scene-root";

/** THREE.LinearToneMapping (= 1). The numeric value, so this file does not import Three into the page bundle. */
const LINEAR_TONE_MAPPING = 1 as ToneMapping;

/** Home closing band (design `.cta1`): pitch and buttons on the start side, a turning 3D desk on the end side (REQ-006). */
export function Cta() {
  const t = useTranslations("home");
  const ts = useTranslations("scenes");
  return (
    <section className="pt-10 pb-[clamp(72px,8vw,120px)]" data-testid="home-cta" aria-labelledby="cta-h">
      <div className="mx-auto max-w-[1280px] px-8 max-sm:px-5">
        <div className="ui-cta">
          <div className="ui-cta-pat" aria-hidden="true" />
          <div className="ui-cta-c">
            <Reveal>
              <h2 id="cta-h" className="text-[clamp(36px,4.2vw,64px)] leading-[1.02] font-bold tracking-[-0.035em] rtl:leading-[1.3] rtl:tracking-normal">
                {t("ctaTitle")}
              </h2>
              <p className="mt-[22px] max-w-[580px] text-lg text-muted">{t("ctaSub")}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ButtonLink href="/contact">{t("ctaBook")}</ButtonLink>
                <ButtonLink href="/projects" variant="ghost">
                  {t("ctaSee")}
                </ButtonLink>
              </div>
            </Reveal>
          </div>
          <div className="ui-cta-3d" aria-hidden="true">
            <SceneRoot load={() => import("@/three/scenes/cta")} label={ts("cta3L")} alpha toneMapping={LINEAR_TONE_MAPPING} camera={{ fov: 28, far: 80 }} releaseWhenFar className="size-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
