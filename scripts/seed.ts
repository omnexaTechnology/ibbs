/**
 * Seeds the Sanity dataset with the design content (FEAT-002 REQ-009):
 * 6 projects, the 4 hero images and an EMPTY site settings document (only the WhatsApp message).
 *
 *   npm run seed                  create what is missing (safe to re-run; never overwrites edits)
 *   npm run seed -- --dry-run     list what would happen, needs no token and touches nothing
 *   npm run seed -- --force       overwrite the seeded documents with the design content
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN
 * (role Editor) in .env.local. Token values are never printed.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";
import { DEFAULT_SEED_DATA, buildDocuments, imageFileNames } from "./seed/build-documents";
import { runSeed, type SeedStore } from "./seed/run-seed";

const ASSETS_DIR = path.resolve(process.cwd(), "design-reference/assets");
const sha1 = (bytes: Buffer) => createHash("sha1").update(bytes).digest("hex");
const readAsset = (fileName: string) => readFile(path.join(ASSETS_DIR, fileName));

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const force = args.has("--force");

  if (dryRun) {
    const docs = buildDocuments((f) => `image-dryrun-${f}`);
    console.log(`Dry run: ${imageFileNames().length} images, ${docs.length} documents`);
    for (const d of docs) console.log(`  ${d._type.padEnd(13)} ${d._id}`);
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) {
    console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN (set them in .env.local).");
    process.exit(1);
  }

  const client = createClient({ projectId, dataset, token, apiVersion: "2026-10-26", useCdn: false });
  console.log(`Seeding project ${projectId}, dataset "${dataset}"${force ? " (--force)" : ""}`);

  const store: SeedStore = {
    async findImageAssetBySha1(hash) {
      const id = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && sha1hash == $hash][0]._id`, { hash });
      return id ?? null;
    },
    async uploadImage(fileName, bytes) {
      const asset = await client.assets.upload("image", bytes, { filename: fileName });
      return asset._id;
    },
    async createIfNotExists(doc) {
      const before = await client.getDocument(doc._id);
      if (before) return "exists";
      await client.createIfNotExists(doc);
      return "created";
    },
    async createOrReplace(doc) {
      await client.createOrReplace(doc);
    },
  };

  const report = await runSeed(store, { force, readFile: readAsset, sha1, log: (m) => console.log("  " + m), data: DEFAULT_SEED_DATA });
  console.log("Done:", JSON.stringify(report));

  const counts = await client.fetch<Record<string, number>>(
    `{ "project": count(*[_type == "project"]), "heroSlides": count(*[_type == "heroSlides"]), "siteSettings": count(*[_type == "siteSettings"]), "imageAssets": count(*[_type == "sanity.imageAsset"]) }`,
  );
  console.log("Dataset now contains:", JSON.stringify(counts));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
