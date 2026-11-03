import { Image } from "next-sanity/image";
import type { SiteImage } from "@/sanity/image";

/** Sanity CDN URL of `src` resized to `width` px wide, in the best format the browser takes (for the lightbox and og:image). */
export function sizedImageUrl(src: string, width: number): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", "80");
  return url.toString();
}

/**
 * `sizes` for an `object-cover` image in a box of aspect `box` (width / height). An image wider than its box is drawn
 * wider than the box to fill its height, so each length is scaled up by that ratio; media conditions are left alone.
 */
export function coverSizes(sizes: string, image: Pick<SiteImage, "width" | "height">, box: number): string {
  const k = image.width && image.height ? Math.max(1, image.width / image.height / box) : 1;
  if (k === 1) return sizes;
  return sizes
    .split(",")
    .map((entry) => entry.replace(/(\d+(?:\.\d+)?)(px|vw)\s*$/, (_, n: string, unit: string) => `${Math.round(Number(n) * k)}${unit}`))
    .join(",");
}

type Props = {
  image: SiteImage;
  /** Already localized alt text. Pass "" for a purely decorative image. */
  alt: string;
  /** `sizes` attribute: what width the image takes at each viewport (required: no full-size downloads by accident). */
  sizes: string;
  /** Aspect (width / height) of the cover box; when set, `sizes` is scaled so a wider image is not upscaled (blurry). */
  box?: number;
  priority?: boolean;
  className?: string;
};

/**
 * A Sanity image that fills its (positioned, sized) parent: editor focus point as `object-position`, blurred
 * placeholder when known. Size the parent with an aspect ratio (e.g. `HotspotImage`) so pins stay on the same detail.
 */
export function SanityPicture({ image, alt, sizes, box, priority, className }: Props) {
  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      sizes={box ? coverSizes(sizes, image, box) : sizes}
      priority={priority}
      placeholder={image.lqip ? "blur" : "empty"}
      blurDataURL={image.lqip ?? undefined}
      className={className ?? "object-cover"}
      style={{ objectPosition: image.objectPosition }}
    />
  );
}
