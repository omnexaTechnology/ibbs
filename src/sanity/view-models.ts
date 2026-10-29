import type { ClientSector } from "@/content/clients";
import {
  HERO_SLIDE_COUNT,
  PROJECT_CATEGORY_KEYS,
  projectCategories,
  SCOPE_KEYS,
  type ProjectCategoryKey,
  type ScopeKey,
} from "@/content/taxonomy";
import type { LocalizedString, SiteSettings } from "@/types/site-settings";
import { toSiteImage, type RawImage, type SiteImage } from "./image";

/** Loose shapes of what the GROQ queries return (every Sanity field may be null). */
type Loc = { en?: string | null; ar?: string | null } | null | undefined;

export type RawProject = {
  _id: string;
  title?: Loc;
  slug?: string | null;
  category?: string | null;
  areaM2?: number | null;
  durationDays?: number | null;
  year?: number | null;
  city?: Loc;
  client?: Loc;
  challenge?: Loc;
  solution?: Loc;
  scope?: string[] | null;
  order?: number | null;
  cover?: RawImage | null;
  gallery?: (RawImage & { _key?: string; alt?: Loc })[] | null;
  hotspots?: {
    _key?: string;
    x?: number | null;
    y?: number | null;
    tag?: Loc;
    title?: Loc;
    description?: Loc;
  }[] | null;
};

export type RawClient = { _id: string; name?: Loc; sector?: string | null; logo?: RawImage | null };

export type RawHero = { slides?: ({ alt?: Loc; image?: RawImage | null } | null)[] | null } | null | undefined;

export type RawSiteSettings =
  | {
      phones?: { label?: Loc; number?: string | null }[] | null;
      emails?: { label?: Loc; address?: string | null }[] | null;
      website?: string | null;
      whatsappNumber?: string | null;
      whatsappMessage?: Loc;
      workingHours?: { days?: Loc; time?: Loc }[] | null;
      address?: Loc;
      mapUrl?: string | null;
      social?: { [K in keyof SiteSettings["social"]]?: string | null } | null;
    }
  | null
  | undefined;

/** A hotspot on the cover photo, positions in percent from the left/top edge. */
export type ProjectHotspot = {
  key: string;
  x: number;
  y: number;
  tag: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
};

export type Project = {
  id: string;
  slug: string;
  title: LocalizedString;
  category: ProjectCategoryKey;
  cover: SiteImage;
  gallery: SiteImage[];
  areaM2: number | null;
  durationDays: number | null;
  year: number | null;
  city: LocalizedString;
  /** null when the editor left the client name empty: show no client line (BR-003). */
  client: LocalizedString | null;
  challenge: LocalizedString;
  solution: LocalizedString;
  hotspots: ProjectHotspot[];
  /** Keys into `scopeItems` (taxonomy); unknown keys are dropped. */
  scope: ScopeKey[];
  order: number | null;
};

/** One hero slot. `image: null` means the editor left it empty: use the design default image. */
export type HeroSlideContent = { index: number; image: SiteImage | null };

const loc = (v: Loc): LocalizedString => ({ en: v?.en?.trim() ?? "", ar: v?.ar?.trim() ?? "" });
const isEmptyLoc = (v: LocalizedString) => !v.en && !v.ar;
const num = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) ? n : null);
const isCategory = (v: unknown): v is ProjectCategoryKey => (PROJECT_CATEGORY_KEYS as readonly unknown[]).includes(v);
const isScope = (v: unknown): v is ScopeKey => (SCOPE_KEYS as readonly unknown[]).includes(v);

/**
 * Maps a raw project to the view model, or null when it cannot be shown
 * (BR-004: needs slug, valid category, cover and at least one gallery image).
 */
export function toProject(raw: RawProject | null | undefined): Project | null {
  if (!raw?.slug || !isCategory(raw.category)) return null;
  const title = loc(raw.title);
  const cover = toSiteImage(raw.cover, title);
  const gallery = (raw.gallery ?? [])
    .map((g) => toSiteImage(g, isEmptyLoc(loc(g.alt)) ? title : loc(g.alt)))
    .filter((g): g is SiteImage => g !== null);
  if (!cover || gallery.length === 0) return null;

  const client = loc(raw.client);
  return {
    id: raw._id,
    slug: raw.slug,
    title,
    category: raw.category,
    cover,
    gallery,
    areaM2: num(raw.areaM2),
    durationDays: num(raw.durationDays),
    year: num(raw.year),
    city: loc(raw.city),
    client: isEmptyLoc(client) ? null : client,
    challenge: loc(raw.challenge),
    solution: loc(raw.solution),
    hotspots: (raw.hotspots ?? [])
      .filter((h) => typeof h.x === "number" && typeof h.y === "number")
      .map((h, i) => ({
        key: h._key ?? String(i),
        x: h.x as number,
        y: h.y as number,
        tag: loc(h.tag),
        title: loc(h.title),
        description: loc(h.description),
      })),
    scope: (raw.scope ?? []).filter(isScope),
    order: num(raw.order),
  };
}

export type RawProjectPage = (RawProject & { related?: (RawProject | null)[] | null }) | null | undefined;

/** A project page: the project plus up to 3 related projects (same category, not itself). */
export type ProjectPage = { project: Project; related: Project[] };

export function toProjectPage(raw: RawProjectPage): ProjectPage | null {
  const project = toProject(raw);
  if (!raw || !project) return null;
  const related = toProjects(raw.related).filter((p) => p.slug !== project.slug && p.category === project.category);
  return { project, related: related.slice(0, 3) };
}

export const toProjectSlugs = (raw: ({ slug?: string | null } | null)[] | null | undefined): string[] =>
  (raw ?? []).map((r) => r?.slug ?? "").filter(Boolean);

export const toProjects = (raw: (RawProject | null)[] | null | undefined): Project[] =>
  (raw ?? []).map(toProject).filter((p): p is Project => p !== null);

/** Clients grouped by sector, in the project-category order; sectors with no client are left out. Nameless clients are skipped. */
export function toClientSectors(raw: (RawClient | null)[] | null | undefined): ClientSector[] {
  const clients = (raw ?? []).filter((c): c is RawClient => !!c && !isEmptyLoc(loc(c.name)));
  return projectCategories
    .map(({ key, label }) => ({
      label,
      clients: clients
        .filter((c) => c.sector === key)
        .map((c) => ({ id: c._id, name: loc(c.name), logo: toSiteImage(c.logo, loc(c.name)) })),
    }))
    .filter((s) => s.clients.length > 0);
}

/** Always returns exactly HERO_SLIDE_COUNT slots (BR-006: empty slots use the design defaults). */
export function toHeroSlides(raw: RawHero): HeroSlideContent[] {
  return Array.from({ length: HERO_SLIDE_COUNT }, (_, index) => {
    const slot = raw?.slides?.[index];
    return { index, image: slot ? toSiteImage(slot.image, loc(slot.alt)) : null };
  });
}

/**
 * Maps the Sanity settings document to the SiteSettings contract. Empty or missing Sanity fields
 * stay EMPTY so the UI hides them (BR-009); the only exception is the WhatsApp prefilled message,
 * which falls back to the default copy per language.
 */
export function toSiteSettings(raw: RawSiteSettings, defaults: SiteSettings): SiteSettings {
  if (!raw) return defaults;
  const text = (v: string | null | undefined) => v?.trim() ?? "";
  const message = loc(raw.whatsappMessage);
  return {
    phones: (raw.phones ?? [])
      .filter((p) => text(p.number))
      .map((p) => ({ label: loc(p.label), value: text(p.number) })),
    emails: (raw.emails ?? [])
      .filter((e) => text(e.address))
      .map((e) => ({ label: loc(e.label), value: text(e.address) })),
    website: text(raw.website),
    whatsapp: {
      number: text(raw.whatsappNumber),
      message: {
        en: message.en || defaults.whatsapp.message.en,
        ar: message.ar || defaults.whatsapp.message.ar,
      },
    },
    workingHours: (raw.workingHours ?? [])
      .map((r) => ({ days: loc(r.days), time: loc(r.time) }))
      .filter((r) => !isEmptyLoc(r.days) || !isEmptyLoc(r.time)),
    address: loc(raw.address),
    mapUrl: text(raw.mapUrl),
    social: {
      linkedin: text(raw.social?.linkedin),
      instagram: text(raw.social?.instagram),
      x: text(raw.social?.x),
      snapchat: text(raw.social?.snapchat),
      tiktok: text(raw.social?.tiktok),
    },
  };
}
