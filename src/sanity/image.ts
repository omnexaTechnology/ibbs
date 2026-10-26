import imageUrlBuilder from "@sanity/image-url";
import type { LocalizedString } from "@/types/site-settings";
import { dataset, projectId } from "./env";

/** What GROQ returns for an image field (see IMAGE in queries.ts). */
export type RawImage = {
  asset?: { _ref?: string | null } | null;
  hotspot?: { x?: number | null; y?: number | null } | null;
  crop?: { top?: number | null; bottom?: number | null; left?: number | null; right?: number | null } | null;
  lqip?: string | null;
  dimensions?: { width?: number | null; height?: number | null } | null;
};

/**
 * An image ready for `Image` from `next-sanity/image` (it loads from the Sanity CDN and sets
 * width/quality itself; `src` must be a Sanity CDN URL, which `src` below is).
 */
export type SiteImage = {
  /** Sanity CDN URL of the original with the editor's crop applied. No width: the loader adds it. */
  src: string;
  /** Pixel size AFTER cropping (use as width/height for next/image so the aspect ratio is right). */
  width: number;
  height: number;
  /** Blurred placeholder (data URL) for `placeholder="blur"`, or null. */
  lqip: string | null;
  /** CSS `object-position` from the editor's focus point, e.g. "62% 30%". Use with `object-fit: cover`. */
  objectPosition: string;
  alt: LocalizedString;
};

const builder = () => imageUrlBuilder({ projectId, dataset });

const pct = (n: number) => `${Math.round(Math.min(1, Math.max(0, n)) * 1000) / 10}%`;

/**
 * Converts a raw Sanity image into a `SiteImage`, or null when no asset is set.
 * Hotspot is Sanity's focus point; crop is the editor's crop rectangle (both optional).
 */
export function toSiteImage(raw: RawImage | null | undefined, alt: LocalizedString = { en: "", ar: "" }): SiteImage | null {
  const ref = raw?.asset?._ref;
  if (!raw || !ref) return null;

  const crop = raw.crop ?? {};
  const keepW = 1 - (crop.left ?? 0) - (crop.right ?? 0);
  const keepH = 1 - (crop.top ?? 0) - (crop.bottom ?? 0);
  const fullW = raw.dimensions?.width ?? dimensionsFromRef(ref)?.width ?? 0;
  const fullH = raw.dimensions?.height ?? dimensionsFromRef(ref)?.height ?? 0;

  const src = builder()
    .image({ asset: { _ref: ref }, crop: raw.crop ?? undefined } as never)
    .url();

  return {
    src,
    width: Math.round(fullW * keepW),
    height: Math.round(fullH * keepH),
    lqip: raw.lqip ?? null,
    objectPosition: `${pct(raw.hotspot?.x ?? 0.5)} ${pct(raw.hotspot?.y ?? 0.5)}`,
    alt,
  };
}

/** Sanity asset IDs look like `image-<hash>-<width>x<height>-<ext>`. */
export function dimensionsFromRef(ref: string): { width: number; height: number } | null {
  const match = /^image-[A-Za-z0-9]+-(\d+)x(\d+)-[a-z]+$/.exec(ref);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}
