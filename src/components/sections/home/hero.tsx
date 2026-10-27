import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Carousel } from "@/components/ui/carousel";
import { HotspotImage } from "@/components/ui/hotspot";
import { SanityPicture } from "@/components/ui/sanity-image";
import { Stripes } from "@/components/ui/section-heading";
import { heroCopy } from "@/content/hero-copy";
import { localize } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";
import type { HeroSlideContent } from "@/sanity/view-models";

/**
 * Home hero (REQ-001): 4 cross-fading slides. Images come from Sanity (design default when a slot is empty, BR-006),
 * texts and hotspots from `heroCopy`. The image and its pins are mirrored together in Arabic, like the design.
 * The image box keeps the picture's own aspect ratio and is scaled to cover the hero, so pins stay on the same detail.
 */
export async function Hero({ locale, slides }: { locale: Locale; slides: HeroSlideContent[] }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";

  const items = heroCopy.map((c, i) => {
    const img = slides[i]?.image ?? null;
    const w = img?.width || c.fallback.width;
    const h = img?.height || c.fallback.height;
    const fallbackAlt = localize(c.fallback.alt, locale);
    const alt = img ? localize(img.alt, locale) || fallbackAlt : fallbackAlt;
    return (
      <div key={i} className="absolute inset-0 overflow-hidden bg-night text-cream">
        <div className="absolute inset-0 [container-type:size]">
          <div className="hx-kb absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" style={{ width: `max(100cqw, calc(100cqh * ${w / h}))` }}>
            <HotspotImage
              aspect={w / h}
              mirror={rtl}
              dir={dir}
              hotspots={c.hotspots.map((p) => ({ x: p.x, y: p.y, tag: localize(p.tag, locale), title: localize(p.title, locale), desc: localize(p.desc, locale) }))}
            >
              {img ? (
                <SanityPicture image={img} alt={alt} sizes="100vw" priority={i === 0} />
              ) : (
                <Image src={c.fallback.src} alt={alt} fill sizes="100vw" priority={i === 0} className="object-cover" />
              )}
            </HotspotImage>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(var(--night-rgb),.86),rgba(var(--night-rgb),.5)_50%,rgba(var(--night-rgb),.22)),linear-gradient(0deg,rgba(var(--night-rgb),.7),transparent_42%)] rtl:bg-[linear-gradient(-90deg,rgba(var(--night-rgb),.86),rgba(var(--night-rgb),.5)_50%,rgba(var(--night-rgb),.22)),linear-gradient(0deg,rgba(var(--night-rgb),.7),transparent_42%)]"
          aria-hidden="true"
        />
        <div className="pointer-events-none relative z-[5] mx-auto flex h-full max-w-[1360px] items-center px-8 pb-20 max-sm:px-5">
          <div className="hx-txt pointer-events-auto max-w-[min(720px,100%)]">
            <div className="flex items-center gap-3.5 text-[clamp(17px,2.6vh,24px)] font-light">
              <Stripes />
              {localize(c.kick, locale)}
            </div>
            <h1 data-testid={i === 0 ? "page-title" : undefined} className="mt-4 text-[clamp(34px,min(4.6vw,8vh),76px)] leading-[.98] font-bold tracking-[-0.025em] text-cream uppercase max-sm:text-[clamp(30px,9vw,42px)] rtl:text-[clamp(30px,min(4.4vw,8vh),68px)] rtl:leading-[1.25] rtl:tracking-normal rtl:normal-case">
              <span className="block">{localize(c.l1, locale)}</span>
              {" "}
              <span className="block">{localize(c.l2, locale)}</span>
            </h1>
            <p className="mt-4 max-w-[560px] text-[clamp(15px,2.2vh,18px)] text-cream/90">{c.sub ? localize(c.sub, locale) : t("heroSub")}</p>
            <div className="mt-[clamp(20px,3.6vh,36px)] flex flex-wrap gap-3.5">
              <ButtonLink href="/projects">{t("ctaExplore")}</ButtonLink>
              <ButtonLink href="/contact" variant="ghost" className="border-cream/40 text-cream hover:border-cyan hover:text-cyan">
                {t("ctaWa")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <section className="relative h-[calc(100svh-134px)] max-h-[960px] min-h-[620px] overflow-hidden bg-night text-cream" data-testid="home-hero">
      <Carousel items={items} label={t("heroEyebrow")} dir={dir} showCount showArrows={false} className="h-full" />
    </section>
  );
}
