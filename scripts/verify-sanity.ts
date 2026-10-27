/**
 * Live checks against the real Sanity project (needs .env.local). Token values are never printed.
 *
 *   npm run verify:content    the site's own queries (read token) return the seeded content
 *   npm run verify:privacy    FEAT-002 T-006: a test lead cannot be read anonymously (then it is deleted)
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { LEAD_ROUTING_ID, leadDocumentId } from "../src/sanity/lead-id";
import {
  HERO_SLIDES_QUERY,
  HOME_QUERY,
  PROJECT_BY_SLUG_QUERY,
  PROJECTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "../src/sanity/queries";
import { toHeroSlides, toProject, toProjects, toSiteSettings } from "../src/sanity/view-models";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const readToken = process.env.SANITY_API_READ_TOKEN;
const writeToken = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = "2026-10-26";

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set (.env.local).");
  process.exit(1);
}

let failures = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

const reader = () =>
  createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published", token: readToken });

async function verifyContent() {
  if (!readToken) throw new Error("SANITY_API_READ_TOKEN is not set.");
  const c = reader();
  const projects = toProjects(await c.fetch(PROJECTS_QUERY));
  check(projects.length === 6, "6 projects through PROJECTS_QUERY", `got ${projects.length}`);
  check(projects.every((p) => p.gallery.length === 4 && p.hotspots.length === 3), "each project: 4 gallery images, 3 hotspots");
  check(projects.every((p) => p.client === null), "no client names (BR-003)");
  check(projects[0]?.slug === "exec-hq" && projects[0].areaM2 === 1850, "first project is exec-hq, 1850 m2");

  const one = toProject(await c.fetch(PROJECT_BY_SLUG_QUERY, { slug: "boardroom" }));
  check(one?.title.en === "Boardroom & Leadership Suite", "PROJECT_BY_SLUG_QUERY(boardroom)", one?.title.en);
  check((await c.fetch(PROJECT_BY_SLUG_QUERY, { slug: "nope" })) === null, "unknown slug -> null");

  const hero = toHeroSlides(await c.fetch(HERO_SLIDES_QUERY));
  check(hero.length === 4 && hero.every((s) => s.image?.src.startsWith("https://cdn.sanity.io/images/")), "4 hero images on the Sanity CDN");
  const home = await c.fetch(HOME_QUERY);
  const homeProjects = toProjects(home.projects).map((p) => p.slug).join();
  check(
    toHeroSlides(home.hero).length === 4 && homeProjects === "exec-hq,ops-floor,boardroom,cowork,medical,clinic-admin",
    "HOME_QUERY: hero + all 6 projects in design order, one round trip",
    homeProjects,
  );

  const settings = toSiteSettings(await c.fetch(SITE_SETTINGS_QUERY), {
    phones: [], emails: [], website: "", whatsapp: { number: "", message: { en: "", ar: "" } }, workingHours: [],
    address: { en: "", ar: "" }, mapUrl: "", social: { linkedin: "", instagram: "", x: "", snapchat: "", tiktok: "" },
  });
  check(settings.phones.length === 0 && settings.whatsapp.number === "" && settings.whatsapp.message.en.includes("IBSS"), "site settings: empty except the WhatsApp message");

  if (hero[0].image) {
    const res = await fetch(`${hero[0].image.src}?w=200`, { method: "HEAD" });
    check(res.ok, "hero image 1 is served by the CDN", `HTTP ${res.status}`);
  }
}

async function anonymousQuery(groq: string, params: Record<string, string> = {}, host = "api") {
  const qs = new URLSearchParams({ query: groq, perspective: "raw" });
  for (const [k, v] of Object.entries(params)) qs.set(`$${k}`, JSON.stringify(v));
  const res = await fetch(`https://${projectId}.${host}.sanity.io/v${apiVersion}/data/query/${dataset}?${qs}`);
  const body = (await res.json().catch(() => ({}))) as { result?: unknown[] | unknown };
  return { status: res.status, result: body.result };
}

async function verifyPrivacy() {
  if (!writeToken) throw new Error("SANITY_API_WRITE_TOKEN is not set.");
  const writer = createClient({ projectId, dataset, apiVersion, useCdn: false, token: writeToken });
  const id = leadDocumentId(randomUUID());
  check(id.includes("."), "test lead ID contains a dot", id.slice(0, 9) + "...");

  // F-01: the lead routing document (recipient emails) is private too. Read-only check.
  for (const host of ["api", "apicdn"]) {
    const routing = await anonymousQuery(`*[_id == $id || _type == "leadRouting"]{_id}`, { id: LEAD_ROUTING_ID }, host);
    const n = Array.isArray(routing.result) ? routing.result.length : 0;
    check(n === 0, `anonymous query for the lead routing document via ${host}.sanity.io returns nothing`, `HTTP ${routing.status}, ${n} results`);
  }
  const routingDoc = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${LEAD_ROUTING_ID}`);
  const routingBody = (await routingDoc.json().catch(() => ({}))) as { documents?: unknown[] };
  check((routingBody.documents ?? []).length === 0, "anonymous GET of the lead routing document returns no document", `HTTP ${routingDoc.status}`);

  const published = await anonymousQuery(`count(*[_type == "project"])`);
  console.log(`INFO  anonymous access to the dataset: HTTP ${published.status}, ${published.status === 200 ? "dataset is PUBLIC (projects readable)" : "dataset is PRIVATE"}`);

  try {
    await writer.createIfNotExists({
      _id: id,
      _type: "lead",
      formType: "contact",
      name: "Privacy check (deleted automatically)",
      email: "privacy-check@invalid.example",
      message: "T-006 privacy check",
      locale: "en",
      createdAt: new Date().toISOString(),
      emailDelivered: false,
      handled: true,
    });
    const seenByWriter = await writer.getDocument(id);
    check(Boolean(seenByWriter), "the write token can see the test lead (it really exists)");

    for (const host of ["api", "apicdn"]) {
      const byType = await anonymousQuery(`*[_type == "lead"]{_id}`, {}, host);
      const count = Array.isArray(byType.result) ? byType.result.length : 0;
      check(count === 0, `anonymous query by type via ${host}.sanity.io returns no lead`, `HTTP ${byType.status}, ${count} results`);
      const byId = await anonymousQuery(`*[_id == $id]{_id}`, { id }, host);
      const n = Array.isArray(byId.result) ? byId.result.length : 0;
      check(n === 0, `anonymous query by exact ID via ${host}.sanity.io returns nothing`, `HTTP ${byId.status}, ${n} results`);
    }

    const docRes = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${id}`);
    const docBody = (await docRes.json().catch(() => ({}))) as { documents?: unknown[]; omitted?: { reason?: string }[] };
    const refused = docRes.status === 401 || docRes.status === 403 || docRes.status === 404 || (docBody.documents ?? []).length === 0;
    check(refused, "anonymous GET of the document by ID returns no document", `HTTP ${docRes.status}, documents: ${(docBody.documents ?? []).length}, omitted reason: ${docBody.omitted?.[0]?.reason ?? "n/a"}`);

    if (readToken) {
      const viaRead = await reader().fetch<unknown[]>(`*[_type == "lead"]{_id}`);
      console.log(`INFO  the site's READ token (Viewer role) sees ${viaRead.length} lead(s): a Viewer token can read the whole dataset; leads are protected by (a) the token being server-only and (b) no site query touching leads.`);
    }
  } finally {
    await writer.delete(id).catch(() => undefined);
    const gone = await writer.getDocument(id);
    check(!gone, "test lead deleted");
  }
}

async function main() {
  const mode = process.argv[2];
  if (mode === "content") await verifyContent();
  else if (mode === "privacy") await verifyPrivacy();
  else throw new Error('Usage: tsx scripts/verify-sanity.ts content|privacy');
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
