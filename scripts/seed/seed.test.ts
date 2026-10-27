// @vitest-environment node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_PROJECT_LIMIT, PROJECT_CATEGORY_KEYS, SCOPE_KEYS } from "../../src/content/taxonomy";
import { isKebabSlug } from "../../src/sanity/schemaTypes/validation";
import { DEFAULT_SEED_DATA, buildDocuments, imageFileNames, projectDocumentId } from "./build-documents";
import { runSeed, type SeedStore } from "./run-seed";

type Doc = { _id: string; _type: string; [k: string]: unknown };
const docs = () => buildDocuments((f) => `image-${f}`) as Doc[];

describe("seed content (AC-004: matches the design)", () => {
  it("has the 6 design projects, in order, with valid keys", () => {
    const projects = docs().filter((d) => d._type === "project");
    expect(projects.map((p) => (p.slug as { current: string }).current)).toEqual([
      "exec-hq", "ops-floor", "boardroom", "cowork", "medical", "clinic-admin",
    ]);
    for (const p of projects) {
      expect(isKebabSlug((p.slug as { current: string }).current)).toBe(true);
      expect(PROJECT_CATEGORY_KEYS).toContain(p.category);
      for (const s of p.scope as string[]) expect(SCOPE_KEYS).toContain(s);
      expect(p.client).toBeUndefined();
      const t = p.title as { en: string; ar: string };
      expect(t.en && t.ar).toBeTruthy();
      expect((p.gallery as unknown[]).length).toBe(4);
      expect((p.hotspots as unknown[]).length).toBe(3);
      for (const h of p.hotspots as { x: number; y: number }[]) {
        expect(h.x).toBeGreaterThanOrEqual(0);
        expect(h.x).toBeLessThanOrEqual(100);
        expect(h.y).toBeGreaterThanOrEqual(0);
        expect(h.y).toBeLessThanOrEqual(100);
      }
    }
    expect(projects.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("F-03: no featured flag; the home page shows all 6 projects in order", () => {
    const projects = docs().filter((d) => d._type === "project");
    for (const p of projects) expect(p).not.toHaveProperty("featured");
    expect(projects).toHaveLength(HOME_PROJECT_LIMIT);
  });

  it("carries area, duration and year from the design", () => {
    const p = docs().find((d) => d._id === projectDocumentId("exec-hq"))!;
    expect(p).toMatchObject({ areaM2: 1850, durationDays: 45, year: 2025, category: "exec" });
  });

  it("has exactly 4 hero slots with image and alt in both languages", () => {
    const hero = docs().find((d) => d._type === "heroSlides")!;
    const keys = Object.keys(hero).filter((k) => k.startsWith("slide"));
    expect(keys).toEqual(["slide1", "slide2", "slide3", "slide4"]);
    for (const k of keys) {
      const slot = hero[k] as { image: { asset: { _ref: string } }; alt: { en: string; ar: string } };
      expect(slot.image.asset._ref).toMatch(/^image-/);
      expect(slot.alt.en && slot.alt.ar).toBeTruthy();
    }
  });

  it("BR-009: site settings are EMPTY except the WhatsApp prefilled message", () => {
    const s = docs().find((d) => d._type === "siteSettings")!;
    expect(Object.keys(s).sort()).toEqual(["_id", "_type", "whatsappMessage"]);
    expect(JSON.stringify(s)).not.toMatch(/example\.com|\+966|0000/);
  });

  it("every referenced image file exists in design-reference/assets", () => {
    for (const f of imageFileNames()) expect(existsSync(path.join("design-reference/assets", f))).toBe(true);
  });

  it("uses stable IDs, so a re-run addresses the same documents; only the private routing doc has a dot", () => {
    expect(docs().filter((d) => d._id.includes(".")).map((d) => d._id)).toEqual(["private.leadRouting"]);
    expect(new Set(docs().map((d) => d._id)).size).toBe(9);
  });

  it("F-01: the private lead routing document is created empty (no recipients, no addresses)", () => {
    const r = docs().find((d) => d._id === "private.leadRouting")!;
    expect(r).toEqual({ _id: "private.leadRouting", _type: "leadRouting" });
  });
});

/** In-memory Sanity: just enough to prove idempotency. */
function fakeStore() {
  const assets = new Map<string, string>();
  const documents = new Map<string, Doc>();
  let uploads = 0;
  const store: SeedStore = {
    async findImageAssetBySha1(sha1) {
      return assets.get(sha1) ?? null;
    },
    async uploadImage(fileName, bytes) {
      uploads++;
      const id = `image-${createHash("sha1").update(bytes).digest("hex")}-1x1-jpg`;
      assets.set(createHash("sha1").update(bytes).digest("hex"), id);
      void fileName;
      return id;
    },
    async createIfNotExists(doc) {
      if (documents.has(doc._id)) return "exists";
      documents.set(doc._id, doc as Doc);
      return "created";
    },
    async createOrReplace(doc) {
      documents.set(doc._id, doc as Doc);
    },
  };
  return { store, assets, documents, uploads: () => uploads };
}

const sha1 = (b: Buffer) => createHash("sha1").update(b).digest("hex");
// Distinct bytes per file name, like real files.
const readFile = async (name: string) => Buffer.from(`bytes-of-${name}`);

describe("runSeed idempotency (T-005)", () => {
  it("first run creates 9 documents and uploads each image once", async () => {
    const f = fakeStore();
    const report = await runSeed(f.store, { readFile, sha1 });
    expect(report.created).toBe(9);
    expect(report.existing).toBe(0);
    expect(report.byType).toEqual({ project: 6, heroSlides: 1, siteSettings: 1, leadRouting: 1 });
    expect(f.uploads()).toBe(imageFileNames().length);
    expect(f.documents.size).toBe(9);
  });

  it("second run changes nothing: no uploads, no new documents", async () => {
    const f = fakeStore();
    await runSeed(f.store, { readFile, sha1 });
    const uploadsAfterFirst = f.uploads();
    const report = await runSeed(f.store, { readFile, sha1 });
    expect(report.created).toBe(0);
    expect(report.existing).toBe(9);
    expect(report.uploaded).toBe(0);
    expect(report.reusedAssets).toBe(imageFileNames().length);
    expect(f.uploads()).toBe(uploadsAfterFirst);
    expect(f.documents.size).toBe(9);
  });

  it("a re-run does not overwrite an editor change", async () => {
    const f = fakeStore();
    await runSeed(f.store, { readFile, sha1 });
    f.documents.get("project-exec-hq")!.year = 1999;
    await runSeed(f.store, { readFile, sha1 });
    expect(f.documents.get("project-exec-hq")!.year).toBe(1999);
  });

  it("--force overwrites the seeded documents with the design content", async () => {
    const f = fakeStore();
    await runSeed(f.store, { readFile, sha1 });
    f.documents.get("project-exec-hq")!.year = 1999;
    const report = await runSeed(f.store, { readFile, sha1, force: true });
    expect(report.replaced).toBe(7);
    expect(f.documents.get("project-exec-hq")!.year).toBe(2025);
  });

  it("--force never wipes the lead recipients or the filled-in site settings (R-03)", async () => {
    const f = fakeStore();
    await runSeed(f.store, { readFile, sha1 });
    f.documents.get("private.leadRouting")!.recipients = ["someone@example.com"];
    f.documents.get("siteSettings")!.website = "https://client.example";
    const report = await runSeed(f.store, { readFile, sha1, force: true });
    expect(f.documents.get("private.leadRouting")!.recipients).toEqual(["someone@example.com"]);
    expect(f.documents.get("siteSettings")!.website).toBe("https://client.example");
    expect(report.replaced).toBe(7);
  });

  it("design data is the one the seed uses", () => {
    expect(DEFAULT_SEED_DATA.projects).toHaveLength(6);
    expect(DEFAULT_SEED_DATA.hero).toHaveLength(4);
  });
});
