import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { Carousel } from "@/components/ui/carousel";
import { HotspotImage } from "@/components/ui/hotspot";
import { SanityPicture } from "@/components/ui/sanity-image";
import { Stripes } from "@/components/ui/section-heading";
import { heroCopy, SHOW_HERO_PINS } from "@/content/hero-copy";
import { localize } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";
import type { HeroSlideContent } from "@/sanity/view-models";

const headingCls =
  "mt-4 text-[clamp(34px,min(4.6vw,8vh),76px)] leading-[.98] font-bold tracking-[-0.025em] text-cream uppercase max-sm:text-[clamp(30px,9vw,42px)] rtl:text-[clamp(30px,min(4.4vw,8vh),68px)] rtl:leading-[1.25] rtl:tracking-normal rtl:normal-case";

/**
 * Home hero (REQ-001): 4 cross-fading slides. Images come from Sanity (design default when a slot is empty, BR-006),
 * texts and hotspots from `heroCopy`. The image and its pins are mirrored together in Arabic, like the design.
 * The image box keeps the picture's own aspect ratio and is scaled to cover the hero, so pins stay on the same detail.
 * The hero sits under the sticky header (like the design) and shows the other slides as a fan of thumbnail cards.
 * Only slide 1 has the page `<h1>`; the others use a `<p>` with the same look.
 */
export async function Hero({ locale, slides }: { locale: Locale; slides: HeroSlideContent[] }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";

  const thumbs = heroCopy.map((c, i) => {
    const img = slides[i]?.image ?? null;
    const alt = "";
    return {
      label: localize(c.kick, locale),
      node: (
        <span className={`absolute inset-0 block ${rtl ? "-scale-x-100" : ""}`}>
          {img ? <SanityPicture image={img} alt={alt} sizes="210px" /> : <Image src={c.fallback.src} alt={alt} fill sizes="210px" className="object-cover" />}
        </span>
      ),
    };
  });

  const items = heroCopy.map((c, i) => {
    const img = slides[i]?.image ?? null;
    const w = img?.width || c.fallback.width;
    const h = img?.height || c.fallback.height;
    const fallbackAlt = localize(c.fallback.alt, locale);
    const alt = img ? localize(img.alt, locale) || fallbackAlt : fallbackAlt;
    // R3-06: the pins are placed for the design photo; a replaced photo with other proportions gets none.
    const pins = SHOW_HERO_PINS && (!img || Math.abs(w / h - c.fallback.width / c.fallback.height) < 0.01);
    const Heading = i === 0 ? "h1" : "p";
    return (
      <div key={i} className="absolute inset-0 overflow-hidden bg-night text-cream">
        <div className="absolute inset-0 [container-type:size]">
          <div className="hx-kb absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" style={{ width: `max(100cqw, calc(100cqh * ${w / h}))` }}>
            <HotspotImage
              aspect={w / h}
              mirror={rtl}
              dir={dir}
              layerClassName="max-[900px]:hidden"
              hotspots={pins ? c.hotspots.map((p) => ({ x: p.x, y: p.y, tag: localize(p.tag, locale), title: localize(p.title, locale), desc: localize(p.desc, locale) })) : []}
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
        <div className="pointer-events-none relative z-[5] mx-auto flex h-full max-w-[1280px] items-center px-8 pt-[92px] pb-[72px] max-[900px]:items-start max-[900px]:pt-[140px] max-[900px]:pb-[210px] max-sm:px-5">
          <div className="hx-txt pointer-events-auto max-w-[min(720px,46vw)] max-[900px]:max-w-none">
            <div className="flex items-center gap-3.5 text-[clamp(17px,2.6vh,24px)] font-light max-sm:text-[19px]">
              <Stripes />
              {localize(c.kick, locale)}
            </div>
            <Heading data-testid={i === 0 ? "page-title" : undefined} className={headingCls}>
              <span className="block">{localize(c.l1, locale)}</span>
              {" "}
              <span className="block">{localize(c.l2, locale)}</span>
            </Heading>
            <p className="mt-4 max-w-[560px] text-[clamp(15px,2.2vh,18px)] text-cream/90 max-sm:text-base">{c.sub ? localize(c.sub, locale) : t("heroSub")}</p>
            <div className="mt-[clamp(20px,3.6vh,36px)] flex flex-wrap gap-3.5">
              <ButtonLink href="/projects">{t("ctaExplore")}</ButtonLink>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // The height is the viewport minus the top bar when it is rendered (it has contact details, >= 561 px); the header is overlaid.
  return (
    <section
      className="relative -mt-[92px] h-svh max-h-[1000px] min-h-[620px] overflow-hidden bg-night text-cream min-[561px]:[body:has([data-testid=topbar])_&]:h-[calc(100svh-42px)]"
      data-testid="home-hero"
    >
      <Carousel items={items} label={t("heroEyebrow")} dir={dir} showCount showArrows={false} pill showProgress thumbs={thumbs} className="h-full" />
    </section>
  );
}
