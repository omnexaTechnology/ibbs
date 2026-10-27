"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowsAngleExpand, ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useCarousel } from "@/components/ui/carousel";
import { Lightbox } from "@/components/ui/lightbox";
import { SanityPicture, sizedImageUrl } from "@/components/ui/sanity-image";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/sanity/image";

export type GalleryImage = { image: SiteImage; alt: string };

type Props = {
  images: GalleryImage[];
  /** Project title: names the gallery and the lightbox dialog. */
  title: string;
};

/**
 * Project gallery: a stage with arrows, a counter and thumbnails; the stage opens the lightbox.
 * Index state comes from the shared carousel hook (no auto-advance: a gallery people study should hold still).
 */
export function ProjectGallery({ images, title }: Props) {
  const t = useTranslations("ui");
  const tc = useTranslations("common");
  const c = useCarousel({ count: images.length, autoAdvance: false });
  const [lb, setLb] = useState(-1);
  const count = images.length;

  return (
    <div className="flex flex-col gap-3.5" data-testid="project-gallery" role="region" aria-roledescription="carousel" aria-label={title}>
      <div className="relative aspect-[16/8.2] overflow-hidden rounded-3xl bg-night max-sm:aspect-[4/3.2]">
        {images.map((g, i) => (
          <div
            key={g.image.src}
            className={cn("absolute inset-0 transition-opacity duration-700", i === c.index ? "opacity-100" : "opacity-0")}
            aria-hidden={i !== c.index}
            data-testid="gallery-slide"
            data-active={i === c.index}
          >
            <SanityPicture image={g.image} alt={g.alt} sizes="(min-width: 1280px) 780px, (min-width: 1024px) 60vw, 100vw" priority={i === 0} />
          </div>
        ))}
        <button type="button" className="absolute inset-0 z-[2] cursor-zoom-in" aria-label={tc("enlarge")} data-testid="gallery-open" onClick={() => setLb(c.index)} />
        {count > 1 ? (
          <>
            <button type="button" className="absolute top-1/2 start-4 z-[3] -translate-y-1/2 grid size-[52px] place-items-center rounded-full bg-cream text-navy transition-colors hover:bg-navy hover:text-cream max-sm:size-[42px]" aria-label={t("prevImage")} onClick={c.prev}>
              <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </button>
            <button type="button" className="absolute top-1/2 end-4 z-[3] -translate-y-1/2 grid size-[52px] place-items-center rounded-full bg-cream text-navy transition-colors hover:bg-navy hover:text-cream max-sm:size-[42px]" aria-label={t("nextImage")} onClick={c.next}>
              <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </>
        ) : null}
        <button type="button" className="absolute end-4 top-4 z-[3] grid size-11 place-items-center rounded-full bg-cream text-navy transition-colors hover:bg-navy hover:text-cream" aria-label={tc("enlarge")} onClick={() => setLb(c.index)}>
          <ArrowsAngleExpand className="size-5" aria-hidden="true" />
        </button>
        <span className="absolute bottom-5 start-5 z-[3] rounded-full bg-night/50 px-3.5 py-1.5 text-[13px] font-semibold text-cream tabular-nums backdrop-blur-md" dir="ltr" aria-live="polite">
          {c.index + 1} / {count}
        </span>
      </div>

      {count > 1 ? (
        <div className="grid grid-cols-4 gap-3" data-testid="gallery-thumbs">
          {images.map((g, i) => (
            <button
              key={g.image.src}
              type="button"
              aria-label={`${tc("enlarge")} ${i + 1}`}
              aria-current={i === c.index ? "true" : undefined}
              onClick={() => c.goTo(i)}
              className={cn(
                "relative aspect-[16/10] overflow-hidden rounded-[14px] border-2 p-0 transition-[opacity,border-color] duration-300",
                i === c.index ? "border-blue opacity-100" : "border-transparent opacity-55 hover:opacity-85",
              )}
            >
              <SanityPicture image={g.image} alt="" sizes="(min-width: 1024px) 200px, 25vw" />
            </button>
          ))}
        </div>
      ) : null}

      <Lightbox
        images={images.map((g) => ({ src: sizedImageUrl(g.image.src, 1800), alt: g.alt, width: g.image.width, height: g.image.height }))}
        index={lb}
        onIndexChange={(i) => {
          setLb(i);
          c.goTo(i);
        }}
        onClose={() => setLb(-1)}
        label={title}
      />
    </div>
  );
}
