import { buildDocuments, imageFileNames, type SeedData, DEFAULT_SEED_DATA } from "./build-documents";

/** The few Sanity operations the seed needs (a fake implements this in tests). */
export interface SeedStore {
  /** Returns the asset document ID if an image with this SHA-1 is already in the dataset. */
  findImageAssetBySha1(sha1: string): Promise<string | null>;
  uploadImage(fileName: string, bytes: Buffer): Promise<string>;
  /** Creates the document only if its ID does not exist yet (never overwrites editor changes). */
  createIfNotExists(doc: { _id: string; _type: string }): Promise<"created" | "exists">;
  /** Overwrites the document (used with --force only). */
  createOrReplace(doc: { _id: string; _type: string }): Promise<void>;
}

export type SeedOptions = {
  force?: boolean;
  readFile: (fileName: string) => Promise<Buffer>;
  sha1: (bytes: Buffer) => string;
  log?: (message: string) => void;
  data?: SeedData;
};

export type SeedReport = {
  uploaded: number;
  reusedAssets: number;
  created: number;
  existing: number;
  replaced: number;
  byType: Record<string, number>;
};

/**
 * Uploads each image once (matched by SHA-1 content hash) and creates the seed documents.
 * Re-running creates nothing new. With `force`, seed documents are overwritten with the design content.
 */
export async function runSeed(store: SeedStore, options: SeedOptions): Promise<SeedReport> {
  const log = options.log ?? (() => {});
  const data = options.data ?? DEFAULT_SEED_DATA;
  const report: SeedReport = { uploaded: 0, reusedAssets: 0, created: 0, existing: 0, replaced: 0, byType: {} };

  const assetIds = new Map<string, string>();
  for (const fileName of imageFileNames(data)) {
    const bytes = await options.readFile(fileName);
    const existing = await store.findImageAssetBySha1(options.sha1(bytes));
    if (existing) {
      assetIds.set(fileName, existing);
      report.reusedAssets++;
      log(`asset exists   ${fileName}`);
    } else {
      assetIds.set(fileName, await store.uploadImage(fileName, bytes));
      report.uploaded++;
      log(`asset uploaded ${fileName}`);
    }
  }

  const docs = buildDocuments((fileName) => {
    const id = assetIds.get(fileName);
    if (!id) throw new Error(`No asset for ${fileName}`);
    return id;
  }, data);

  for (const doc of docs) {
    report.byType[doc._type] = (report.byType[doc._type] ?? 0) + 1;
    if (options.force) {
      await store.createOrReplace(doc);
      report.replaced++;
      log(`replaced       ${doc._id}`);
    } else if ((await store.createIfNotExists(doc)) === "created") {
      report.created++;
      log(`created        ${doc._id}`);
    } else {
      report.existing++;
      log(`exists         ${doc._id}`);
    }
  }
  return report;
}
