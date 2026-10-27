import type { LocalizedString } from "../../src/types/site-settings";
import { LEAD_ROUTING_ID } from "../../src/sanity/lead-id";
import seedData from "./seed-data.json";

/** Content extracted once from design-reference/Main.dc.html (PR projects and SL hero slides). */
export type SeedProject = {
  id: string;
  category: string;
  cover: string;
  gallery: string[];
  areaM2: number;
  durationDays: number;
  year: number;
  city: LocalizedString;
  scope: string[];
  title: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  hotspots: { x: number; y: number; tag: LocalizedString; title: LocalizedString; desc: LocalizedString }[];
  featured: boolean;
  order: number;
};
export type SeedHero = { image: string; alt: LocalizedString };
export type SeedData = { projects: SeedProject[]; hero: SeedHero[] };

export const DEFAULT_SEED_DATA = seedData as SeedData;

/** The WhatsApp prefilled message is real copy from the design; everything else in settings stays empty (BR-009). */
export const WHATSAPP_MESSAGE: LocalizedString = {
  en: "Hello IBSS Innovations, I would like to discuss a furnishing project.",
  ar: "مرحباً آي بي إس إس إنوفيشنز، أرغب في الاستفسار عن مشروع فرش.",
};

/** Maps an asset file name (as in seed-data.json) to the Sanity asset document ID. */
export type AssetIdFor = (fileName: string) => string;

type SeedDocument = { _id: string; _type: string; [key: string]: unknown };

const imageRef = (assetId: string) => ({ _type: "image", asset: { _type: "reference", _ref: assetId } });

/** Stable IDs: re-running the seed addresses the same documents (no duplicates). Root-path IDs: public content. */
export const projectDocumentId = (slug: string) => `project-${slug}`;

/** Unique image file names the seed needs to upload. */
export function imageFileNames(data: SeedData = DEFAULT_SEED_DATA): string[] {
  return [...new Set([...data.projects.flatMap((p) => [p.cover, ...p.gallery]), ...data.hero.map((h) => h.image)])];
}

/**
 * Builds all seed documents: the projects, the hero (4 slots) and an EMPTY site settings
 * document (only the WhatsApp message). Pure: no network, no files.
 */
export function buildDocuments(assetIdFor: AssetIdFor, data: SeedData = DEFAULT_SEED_DATA): SeedDocument[] {
  const projects: SeedDocument[] = data.projects.map((p) => ({
    _id: projectDocumentId(p.id),
    _type: "project",
    title: { _type: "localeString", ...p.title },
    slug: { _type: "slug", current: p.id },
    category: p.category,
    cover: imageRef(assetIdFor(p.cover)),
    gallery: p.gallery.map((file, i) => ({
      _key: `g${i + 1}`,
      ...imageRef(assetIdFor(file)),
      alt: {
        _type: "localeString",
        en: `${p.title.en} - photo ${i + 1}`,
        ar: `${p.title.ar} - صورة ${i + 1}`,
      },
    })),
    areaM2: p.areaM2,
    durationDays: p.durationDays,
    year: p.year,
    city: { _type: "localeString", ...p.city },
    // No client: the design's "[Client name]" was a placeholder (BR-003).
    challenge: { _type: "localeText", ...p.challenge },
    solution: { _type: "localeText", ...p.solution },
    hotspots: p.hotspots.map((h, i) => ({
      _type: "imageHotspot",
      _key: `h${i + 1}`,
      x: h.x,
      y: h.y,
      tag: { _type: "localeString", ...h.tag },
      title: { _type: "localeString", ...h.title },
      description: { _type: "localeText", ...h.desc },
    })),
    scope: p.scope,
    featured: p.featured,
    order: p.order,
  }));

  const hero: SeedDocument = {
    _id: "heroSlides",
    _type: "heroSlides",
    ...Object.fromEntries(
      data.hero.map((slot, i) => [
        `slide${i + 1}`,
        { _type: "heroSlideImage", image: imageRef(assetIdFor(slot.image)), alt: { _type: "localeString", ...slot.alt } },
      ]),
    ),
  };

  const settings: SeedDocument = {
    _id: "siteSettings",
    _type: "siteSettings",
    whatsappMessage: { _type: "localeText", ...WHATSAPP_MESSAGE },
  };

  // Empty private routing document (dotted ID: not readable anonymously). The client fills it in the Studio.
  const routing: SeedDocument = { _id: LEAD_ROUTING_ID, _type: "leadRouting" };

  return [...projects, hero, settings, routing];
}
