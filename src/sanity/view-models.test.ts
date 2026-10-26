import { describe, expect, it } from "vitest";
import type { SiteSettings } from "@/types/site-settings";
import { toHeroSlides, toProject, toProjects, toSiteSettings, type RawProject } from "./view-models";

const img = (id = "image-abc123-1600x900-jpg") => ({
  asset: { _ref: id },
  lqip: "data:image/jpeg;base64,xx",
  dimensions: { width: 1600, height: 900 },
});

const raw = (over: Partial<RawProject> = {}): RawProject => ({
  _id: "p1",
  title: { en: "Executive HQ", ar: "المقر" },
  slug: "exec-hq",
  category: "exec",
  areaM2: 1850,
  durationDays: 45,
  year: 2025,
  city: { en: "Riyadh", ar: "الرياض" },
  client: null,
  challenge: { en: "c", ar: "ت" },
  solution: { en: "s", ar: "ح" },
  scope: ["exec", "chairs", "nonsense"],
  featured: true,
  order: 1,
  cover: { ...img(), hotspot: { x: 0.25, y: 0.75 } },
  gallery: [
    { _key: "g1", alt: { en: "Desk", ar: "مكتب" }, ...img("image-def456-800x800-png") },
    { _key: "g2", alt: null, ...img() },
  ],
  hotspots: [
    {
      _key: "h1",
      x: 52,
      y: 7,
      tag: { en: "Lighting", ar: "الإضاءة" },
      title: { en: "t", ar: "ع" },
      description: { en: "d", ar: "و" },
    },
    { _key: "h2", x: null, y: 3 },
  ],
  ...over,
});

describe("toProject", () => {
  it("maps a full project to the view model", () => {
    const p = toProject(raw())!;
    expect(p.slug).toBe("exec-hq");
    expect(p.category).toBe("exec");
    expect(p.title).toEqual({ en: "Executive HQ", ar: "المقر" });
    expect(p.areaM2).toBe(1850);
    expect(p.cover.src).toContain("cdn.sanity.io/images/");
    expect(p.cover.src).toContain("abc123-1600x900.jpg");
    expect(p.cover.objectPosition).toBe("25% 75%");
    expect(p.cover.width).toBe(1600);
    expect(p.cover.height).toBe(900);
    expect(p.gallery).toHaveLength(2);
    expect(p.gallery[0].alt).toEqual({ en: "Desk", ar: "مكتب" });
  });

  it("gallery images without alt fall back to the project title", () => {
    expect(toProject(raw())!.gallery[1].alt).toEqual({ en: "Executive HQ", ar: "المقر" });
  });

  it("BR-003: empty client name becomes null (no client line)", () => {
    expect(toProject(raw({ client: null }))!.client).toBeNull();
    expect(toProject(raw({ client: { en: " ", ar: "" } }))!.client).toBeNull();
    expect(toProject(raw({ client: { en: "ACME", ar: "" } }))!.client).toEqual({ en: "ACME", ar: "" });
  });

  it("drops unknown scope keys and hotspots without a position", () => {
    const p = toProject(raw())!;
    expect(p.scope).toEqual(["exec", "chairs"]);
    expect(p.hotspots).toHaveLength(1);
    expect(p.hotspots[0]).toMatchObject({ key: "h1", x: 52, y: 7 });
  });

  it("BR-004: unusable projects are skipped", () => {
    expect(toProject(raw({ slug: null }))).toBeNull();
    expect(toProject(raw({ category: "bogus" }))).toBeNull();
    expect(toProject(raw({ cover: null }))).toBeNull();
    expect(toProject(raw({ gallery: [] }))).toBeNull();
    expect(toProject(null)).toBeNull();
    expect(toProjects([raw(), raw({ slug: null }), null])).toHaveLength(1);
    expect(toProjects(null)).toEqual([]);
  });

  it("applies the editor crop to the reported size", () => {
    const p = toProject(raw({ cover: { ...img(), crop: { left: 0.25, right: 0.25, top: 0, bottom: 0.5 } } }))!;
    expect(p.cover.width).toBe(800);
    expect(p.cover.height).toBe(450);
    expect(p.cover.src).toContain("rect=");
  });
});

describe("toHeroSlides", () => {
  it("always returns 4 slots; empty ones have image null (BR-006)", () => {
    expect(toHeroSlides(null).map((s) => s.image)).toEqual([null, null, null, null]);
    const slides = toHeroSlides({ slides: [{ alt: { en: "a", ar: "أ" }, image: img() }, null, { image: null }] });
    expect(slides).toHaveLength(4);
    expect(slides[0].image?.alt).toEqual({ en: "a", ar: "أ" });
    expect(slides[1].image).toBeNull();
    expect(slides[2].image).toBeNull();
    expect(slides[3].image).toBeNull();
    expect(slides.map((s) => s.index)).toEqual([0, 1, 2, 3]);
  });
});

const DEFAULTS: SiteSettings = {
  phones: [],
  emails: [],
  website: "",
  whatsapp: { number: "", message: { en: "Hello", ar: "مرحبا" } },
  workingHours: [],
  address: { en: "", ar: "" },
  mapUrl: "",
  social: { linkedin: "", instagram: "", x: "", snapchat: "", tiktok: "" },
  leadNotificationEmails: [],
};

describe("toSiteSettings", () => {
  it("returns the defaults for a missing document", () => {
    expect(toSiteSettings(null, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("maps filled fields to the SiteSettings contract", () => {
    const s = toSiteSettings(
      {
        phones: [{ label: { en: "Sales", ar: "المبيعات" }, number: " +966 50 123 4567 " }, { label: null, number: "" }],
        emails: [{ label: { en: "Info", ar: "عام" }, address: "info@example.com" }],
        website: "https://ibss.example",
        whatsappNumber: "966501234567",
        whatsappMessage: { en: "Hi", ar: "" },
        workingHours: [
          { days: { en: "Sun-Thu", ar: "الأحد-الخميس" }, time: { en: "9-17", ar: "9-5" } },
          { days: null, time: null },
        ],
        address: { en: "Riyadh", ar: "الرياض" },
        mapUrl: "https://maps.example/x",
        social: { instagram: "https://instagram.com/ibss", tiktok: "  " },
        leadNotificationEmails: ["a@example.com", " ", "b@example.com"],
      },
      DEFAULTS,
    );
    expect(s.phones).toEqual([{ label: { en: "Sales", ar: "المبيعات" }, value: "+966 50 123 4567" }]);
    expect(s.emails).toHaveLength(1);
    expect(s.whatsapp.number).toBe("966501234567");
    expect(s.whatsapp.message).toEqual({ en: "Hi", ar: "مرحبا" });
    expect(s.workingHours).toHaveLength(1);
    expect(s.social.instagram).toBe("https://instagram.com/ibss");
    expect(s.social.tiktok).toBe("");
    expect(s.leadNotificationEmails).toEqual(["a@example.com", "b@example.com"]);
  });

  it("BR-009: empty Sanity fields stay empty (nothing falls back to placeholders)", () => {
    const s = toSiteSettings({}, DEFAULTS);
    expect(s.phones).toEqual([]);
    expect(s.website).toBe("");
    expect(s.whatsapp.number).toBe("");
    expect(Object.values(s.social).every((v) => v === "")).toBe(true);
    expect(s.whatsapp.message).toEqual(DEFAULTS.whatsapp.message);
  });
});
