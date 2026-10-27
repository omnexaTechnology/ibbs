import type { SchemaTypeDefinition } from "sanity";
import { heroSlideImage, heroSlides } from "./heroSlides";
import { imageHotspot } from "./imageHotspot";
import { lead } from "./lead";
import { leadRouting } from "./leadRouting";
import { localeString } from "./localeString";
import { localeText } from "./localeText";
import { project } from "./project";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  // documents
  project,
  heroSlides,
  siteSettings,
  lead,
  leadRouting,
  // building blocks
  localeString,
  localeText,
  imageHotspot,
  heroSlideImage,
];

/** Document types that exist exactly once (fixed document ID = type name; `leadRouting` uses `private.leadRouting`, see lead-id.ts). */
export const SINGLETON_TYPES = ["heroSlides", "siteSettings", "leadRouting"] as const;

/** Document types the Studio must not offer in the "create new" menu. */
export const NO_CREATE_TYPES = ["heroSlides", "siteSettings", "leadRouting", "lead"] as const;
