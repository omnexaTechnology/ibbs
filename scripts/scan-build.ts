/**
 * Build-output privacy scan (run after `npm run build`; needs .env.local for the secret values).
 * Token and secret VALUES are read in-process and never printed; only file names and counts are.
 *
 *   npm run scan:build
 *
 * Fails (exit 1) when:
 *  - a token / revalidate secret value appears in .next/static or in any prerendered page output;
 *  - `leadNotificationEmails` appears in .next/static or in a page output;
 *  - `leadRouting` / `private.leadRouting` appears in a page output (html, rsc, meta, segments).
 * `leadRouting` in .next/static chunks is expected: it is the Studio's schema and desk name (no data).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const secrets = ["SANITY_API_READ_TOKEN", "SANITY_API_WRITE_TOKEN", "SANITY_REVALIDATE_SECRET"]
  .map((name) => process.env[name] ?? "")
  .filter((value) => value.length > 8);

const PAGE_OUTPUT = /\.(html|rsc|meta|body)$/;
const everywhere = ["leadNotificationEmails"];
const pagesOnly = ["leadRouting", "private.leadRouting"];

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const failures: string[] = [];
let scanned = 0;
const scan = (dir: string, isPage: boolean) => {
  for (const file of walk(dir)) {
    if (isPage && !PAGE_OUTPUT.test(file)) continue;
    scanned++;
    const text = readFileSync(file, "utf8");
    secrets.forEach((value, i) => text.includes(value) && failures.push(`secret value #${i + 1} in ${file}`));
    for (const word of everywhere) if (text.includes(word)) failures.push(`"${word}" in ${file}`);
    if (isPage) for (const word of pagesOnly) if (text.includes(word)) failures.push(`"${word}" in ${file}`);
  }
};

scan(join(".next", "static"), false);
scan(join(".next", "server", "app"), true);

console.log(`Scanned ${scanned} files; secret values loaded: ${secrets.length}.`);
if (secrets.length < 3) console.log("Note: not all three secret values were available (is .env.local loaded?).");
if (failures.length) {
  console.log(failures.join("\n"));
  console.log(`FAIL: ${failures.length} hit(s).`);
  process.exit(1);
}
console.log("PASS: no secret values, no lead recipients in page output.");
