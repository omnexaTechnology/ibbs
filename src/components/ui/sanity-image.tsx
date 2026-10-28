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

type Props = {
  image: SiteImage;
  /** Already localized alt text. Pass "" for a purely decorative image. */
  alt: string;
  /** `sizes` attribute: what width the image takes at each viewport (required: no full-size downloads by accident). */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * A Sanity image that fills its (positioned, sized) parent: editor focus point as `object-position`, blurred
 * placeholder when known. Size the parent with an aspect ratio (e.g. `HotspotImage`) so pins stay on the same detail.
 */
export function SanityPicture({ image, alt, sizes, priority, className }: Props) {
  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder={image.lqip ? "blur" : "empty"}
      blurDataURL={image.lqip ?? undefined}
      className={className ?? "object-cover"}
      style={{ objectPosition: image.objectPosition }}
    />
  );
}
