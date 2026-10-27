# FEAT-002 — Sanity content model, embedded Studio, seed — Review

Date: 2026-10-26
Branch: `feat/FEAT-002-sanity` (HEAD `198b3ad`), base `feat/FEAT-001-app-foundation`. Scope: `git diff feat/FEAT-001-app-foundation..feat/FEAT-002-sanity`.
Inputs read: `review` skill, FEAT-002 `spec/impact/plan/questions`, tasks T-001..T-006, `docs/SANITY-SETUP.md`, `docs/SECURITY.md`, `.ai/decisions/*`, `.ai/USER-ACTIONS.md`, FEAT-003/FEAT-004 specs, installed docs `node_modules/next/dist/docs/.../revalidateTag.md`, the sources of `next-sanity/webhook` and `@sanity/webhook` 4.0.4, and the design's `PR`/`SL` data.
Live dataset access was **read-only**: `npm run verify:content` and one anonymous GROQ query. No documents were written, changed or deleted, and `verify:privacy` was not re-run. No token or secret value was printed.

## 1. Validation

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm run typecheck` | Clean |
| `npm test` | 16 files / 131 tests passed |
| `npm run schema:validate` | 0 errors, 0 warnings |
| `npm run build` (full `.env.local`) | Success. `/studio/[[...tool]]` static, `/api/revalidate` dynamic. All SSG locale pages have `initialRevalidateSeconds: 3600` and carry the `siteSettings` cache tag (`.next/server/app/en.meta`). |
| E2E against `next start` (production build, `E2E_REUSE=1`) | **72 passed** |
| `npm run verify:content` (read token, live dataset) | 11/11 PASS |
| Build-output secret scan (values read from `.env.local` in-process, never printed) | `.next/static` 651 files: 0 token/secret values, 0 variable names. `.next/server` 1176 files: 0 values. |
| Git history scan of the branch for token-like strings | Only a `package-lock.json` integrity hash. `.env.local` is ignored (`.gitignore:18`). |
| Seed fidelity: script comparing design `PR` (6 projects) and `SL` (4 slides) with `scripts/seed/seed-data.json` | **No differences** in id, category, cover, gallery files and order, area, days, year, city en/ar, scope, title en/ar, challenge/solution en/ar, and all hotspots (x, y, tag/title/desc en/ar). Hero images and alt texts en/ar are identical. |
| Anonymous query on the public dataset | Types present: `heroSlides`, `project`, `sanity.imageAsset`, `siteSettings`; 0 leads, 0 drafts. The `siteSettings` document (root ID) **is anonymously readable**. |
| Webhook probe (local prod server, signature computed with the real secret, no Sanity call) | fresh signed → 200; **same request replayed → 200; signed with a 2023 timestamp → 200**; tampered body → 401; garbage → 400 |
| `/studio` probe | 200, `<meta name="robots" content="noindex"/>`, no locale redirect. The Studio JS boots; only a CORS error for `localhost:3100` (expected, origin not registered). |

`.next` was removed afterwards. The working tree has an uncommitted change to `.ai/USER-ACTIONS.md` that was **not** made by this review (it appeared during the review); it was left untouched and is not part of the review commit.

## 2. Spec compliance

| ID | Verdict | Evidence / comment |
|---|---|---|
| REQ-001 | Met (code); login unverified | Second root layout `src/app/studio/layout.tsx`, `NextStudio`, noindex, outside the proxy (e2e + probe). Login needs CORS (user action). |
| REQ-002 | Met | `src/sanity/structure.ts`: Projects · Hero images · Site settings · Leads (newest first). |
| REQ-003 | Met | `localeString`/`localeText` objects with `columns: 2`. |
| REQ-004 | Met | All fields present. Hotspot click-picker (`HotspotPositionInput.tsx`) is untested in a live Studio. Gallery alt is not enforced (F-10). |
| REQ-005 | Met | `heroSlides` has exactly 4 `heroSlideImage` slots, plus the BR-008 warning. |
| REQ-005b | Met in schema, **leaks in delivery** | All fields present. `leadNotificationEmails` reaches the browser (F-01). |
| REQ-006 | Met | All fields present, read-only except `handled`; no create template; duplicate removed; delete allowed. The Studio list with `lead.<uuid>` IDs is untested (F-12). |
| REQ-007 | Met, with gaps for FEAT-003 | Typed queries, `defineQuery` + typegen, `SiteImage` with crop/hotspot/lqip. Featured limit (F-03) and missing related/slug-list queries (F-11). |
| REQ-008 | Code met; dashboard pending | Signed webhook → `revalidateTag(type, { expire: 0 })`; matches the installed Next 16 docs for webhooks (`revalidateTag.md:142-146`). Replay and consistency caveats: F-05, F-06. |
| REQ-009 | Met | Idempotent (stable IDs `project-<slug>`, `heroSlides`, `siteSettings`; `createIfNotExists`; assets matched by SHA-1). The implementer ran it twice against `production` (logged in T-005); this review confirmed the resulting content read-only. Empty settings except the WhatsApp message. |
| BR-001 | Met | Kebab validator, slug type uniqueness, description warns about changing it. |
| BR-002 | Met | `perspective: "published"`, `useCdn: false`. |
| BR-003 | Met | `client: null` when empty; seed sets no client. |
| BR-004 | Met | title en+ar, slug, category, cover, gallery ≥ 1 are required; the view model also drops invalid projects. |
| BR-005 | Met | Options come from `src/content/taxonomy.ts`. |
| BR-006 | Met | Document validation requires ≥ 1 image; `toHeroSlides` returns `image: null` → design default. |
| BR-007 | **Partly** | Dotted IDs keep leads out of anonymous reads (documented and measured by the implementer). The Viewer read token can read leads; this deviation is documented. Residual risk: F-08. |
| BR-008 | Met | Field descriptions. |
| BR-009 | Met in mapping, but see F-01 | Empty values stay empty (`toSiteSettings`). |
| AC-001/002/006 | Not verifiable yet | Need the deployed site + webhook + FEAT-003 pages. |
| AC-003 | Met by construction | Published perspective, no drafts in the dataset. |
| AC-004 | Data verified | The seed is identical to the design. The page comparison waits for FEAT-003; home featured count differs (F-03). |
| AC-005 | Partly | Anonymous lead access blocked (implementer's measurement); "cannot be fetched with the site's read token" is **not** met (documented deviation, F-08). Studio login unverified. |

## 3. Findings

### F-01 — BLOCKER — Lead notification emails are published to every visitor
- **Evidence:**
  - `src/sanity/queries.ts:79` selects `leadNotificationEmails` in `SITE_SETTINGS_QUERY`.
  - `src/sanity/view-models.ts:191` maps it into `SiteSettings`.
  - `src/app/[locale]/layout.tsx:48` passes the whole `settings` object to `<Header>`, which is a client component (`src/components/layout/header.tsx:1` `"use client"`). Every prop of a client component is serialised into the RSC payload.
  - Built page `.next/server/app/en.html` contains `leadNotificationEmails\":[]` (empty today only because the field is empty).
  - In addition, the `siteSettings` document has a root ID, so on the current PUBLIC dataset it is readable anonymously through the API (verified).
  - `docs/SANITY-SETUP.md` section 6 tells the client to fill "the 'who receives new enquiries' emails" next.
- **Why it matters:** As soon as the client follows the setup guide, the internal recipient addresses (staff, possibly personal mailboxes; the fallback is a personal Gmail) appear in the HTML of every page. That is a personal-data exposure and invites spam. FEAT-004 is the only consumer, and it runs on the server. Merging to `main` deploys to production.
- **Fix:**
  - Remove `leadNotificationEmails` from `SiteSettings` and from `SITE_SETTINGS_QUERY`.
  - Add a server-only `getLeadRecipients()` (own query, `import "server-only"`, tag `siteSettings`) for FEAT-004.
  - Defensively, pass only display fields to client components (e.g. a `PublicSiteSettings` type).
  - Add a test asserting that the rendered HTML/RSC of `/en` does not contain `leadNotificationEmails` or a configured recipient.
  - Consider storing the recipients in a dotted-ID document (e.g. `private.leadRouting`) so that they stay private even while the dataset is public.

### F-02 — MEDIUM — Sanity failures are swallowed into ISR: a blip wipes contact data from all pages for up to an hour
- **Evidence:** `src/lib/site-settings.ts:44-50` returns the empty defaults on *any* error when Sanity **is** configured. The layout feeds every SSG page (`initialRevalidateSeconds: 3600`, tag `siteSettings`).
- **Why it matters:** Next keeps serving the last good page when a background revalidation *throws*. Here the render succeeds with empty settings, so a transient Sanity/network error during a revalidation replaces good pages with ones that have no WhatsApp button, phones or socials, for up to 1h or until the next publish. The same happens at `next build`: a deploy during an outage ships silently without contact data, with only a `console.warn`. "Never throws" is right for *unconfigured* (no env), not for *configured but failing*.
- **Fix:** Keep returning defaults when `!isSanityConfigured`. When configured, rethrow, so that build fails loudly and ISR keeps the stale good page. Alternatively, rethrow only during revalidation/build and fall back only in dev. Add a unit test for "configured + fetch error → throws".

### F-03 — MEDIUM — Home "featured" contract is 4 projects, but the design's home accordion shows all 6
- **Evidence:**
  - `src/sanity/queries.ts:58,66` use `[0...4]`; `project.ts:112` says "The home page shows up to four featured projects"; the seed marks 4 projects featured.
  - The design renders `homeAcc = PR.map(...)` (all 6, `Main.dc.html:6454`) through `<sc-for list="{{homeAcc}}" hint-placeholder-count="6">` (line ~3627), with 6 clip shapes (`accClips[i % 6]`).
  - `featured = [PR[0],PR[1],PR[2],PR[4]]` (line 6270) and `featured4` (6432) are computed but **not rendered** anywhere in the markup (no `sc-for` uses them).
- **Why it matters:** FEAT-003 REQ-005 / AC-001 (visual parity) and FEAT-002 AC-004 ("projects match the design") would fail. The home page would show 4 panels where the design has 6, and the editor-facing rule ("up to four") would be wrong.
- **Fix:** Confirm with the user. The design default is "all projects, in order" (limit 6, or make the limit a code constant matching the accordion's clip shapes). Update the query, the field description, the seed `featured` flags and `verify:content`.

### F-04 — MEDIUM — Setup guide recommends a credentialed wildcard CORS origin on `vercel.app`
- **Evidence:** `docs/SANITY-SETUP.md:25,30`: "Allow credentials switched ON" and "add a wildcard origin such as `https://*-your-team.vercel.app`". `.ai/USER-ACTIONS.md:20` repeats "Vercel preview URLs … with Allow credentials on".
- **Why it matters:** A credentialed origin lets pages on that origin call the Sanity API with a logged-in editor's session. `vercel.app` subdomains are first-come for anyone: another Vercel user can create a project named e.g. `x-<team>` and get `x-<team>.vercel.app`, which matches `*-<team>.vercel.app`. If an editor visits such a page while logged in, it could read leads (personal data) or write content.
- **Fix:** Allow credentials only for exact origins you control: `http://localhost:3000`, the production domain, and at most the stable Vercel production alias. Use the Studio on those, or deploy the Studio separately (`sanity deploy` → `*.sanity.studio`) for previews. Remove the wildcard advice from both docs.

### F-05 — LOW — Webhook accepts replays indefinitely; signature compare is not constant-time
- **Evidence:** `@sanity/webhook` 4.0.4 `assertValidSignature` recomputes the HMAC with the header's own timestamp and compares with `signature !== encoded`. There is no age check and the compare is not constant-time (`node_modules/@sanity/webhook/dist/index.js:17-20`). Probe: the same signed request twice → 200 both times; a request signed with timestamp 1700000000000 (2023) → 200. The raw body is used correctly (`req.text()` in `next-sanity/webhook`), and a tampered body → 401.
- **Why it matters:** Anyone who once obtains a signed request (e.g. from the webhook "Attempts" log in the dashboard, or a proxy log) can trigger `revalidateTag(..., { expire: 0 })` at will. Each call forces blocking cache misses and Sanity API calls (quota/cost amplification). There is no data exposure. The timing side channel over the network is theoretical.
- **Fix:** In `src/app/api/revalidate/route.ts`, before trusting the result, parse `t=` from the `sanity-webhook-signature` header and reject if `|Date.now() - t| > 5 min`. Optionally verify with `crypto.timingSafeEqual` yourself. Optionally rate-limit the route.

### F-06 — LOW — `parseBody(…, false)` skips Sanity's eventual-consistency wait, while `expire: 0` caches whatever comes back for an hour
- **Evidence:** `src/app/api/revalidate/route.ts:24` passes `false`. `next-sanity/webhook` documents the 3s wait as protection against reading stale data right after a webhook. With `expire: 0` the next visitor triggers an immediate refetch, and if that read is still stale it is cached again for up to 3600s.
- **Why it matters:** An editor occasionally publishes, sees no change, and the update arrives only after the 1h safety net (AC-001 "within a minute" fails intermittently).
- **Fix:** Use the default wait (`parseBody(req, secret)`; the webhook still returns well within Sanity's timeout). Alternatively, call `revalidateTag` once more after a short delay.

### F-07 — LOW — Write token handed to Vercel (Production and Preview) before anything deployed needs it
- **Evidence:** `docs/SANITY-SETUP.md:19` and `.ai/USER-ACTIONS.md:16` say to add all five variables, including `SANITY_API_WRITE_TOKEN` (Editor, whole dataset per `docs/SECURITY.md`), to Production **and Preview** now. No route in this branch uses it (seed and verify scripts run locally).
- **Why it matters:** Every preview build of every branch gets a dataset-wide Editor token, which is unnecessary exposure until FEAT-004.
- **Fix:** Add the write token to Vercel only when FEAT-004 ships, Production only if previews don't need to send real leads. Add the read token to Preview only if previews must show content.

### F-08 — NOTE — Residual lead-privacy risk with the Viewer read token (evaluated)
- Site code never queries leads. All GROQ strings are constants in `queries.ts` (unit-tested for no `lead`); the only parameter is `$slug`, used as a value, so there is no GROQ injection. `client.ts`/`fetch.ts`/`content.ts`/`site-settings.ts` all import `server-only`, and the build scan found no token in client output. Lead IDs are random UUIDs under `lead.`. So site code cannot expose leads unless someone adds a query by `_id`/type later.
- The residual risk is token compromise: Vercel env (incl. Preview builds, F-07), logs, or a future debugging route. That would expose all leads, because a Viewer reads everything on this plan.
- **Options:**
  - Keep the dataset **public** and drop the read token from the site entirely: published content is public anyway, and leads stay private through dotted IDs, so a site token could never read them. This needs F-01's recipients moved to a dotted-ID document.
  - Keep it private and accept the documented risk, plus a lint/unit rule that forbids `lead` in any site query.
- Either way, record the decision in `.ai/decisions/`.

### F-09 — NOTE — Hotspot coordinates are relative to the cropped *full* image
- The picker shows the cover with the editor's crop (`createImageUrlBuilder(client).image(cover)`), and `toSiteImage` applies the same crop, so the two are consistent. The design positions dots with `left/top %` over the image box. FEAT-003 must render hotspots inside a box that keeps the cropped image's aspect ratio (not an `object-fit: cover` box of a different ratio), or the dots drift. RTL mirroring (`100 - x`) belongs to FEAT-003 (BR-002 there).

### F-10 — NOTE — Gallery alt text: description says "needs", validation does not enforce
- **Evidence:** `project.ts:55` says "Each needs a short description … in both languages", but the `alt` field (line 61) has no validation. `toProject` silently falls back to the project title, and the seed generates "<title> - photo n" alts (not from the design).
- **Suggested:** Either add `requireBothLocales` as a warning (`rule.custom(...).warning()`) or soften the description.

### F-11 — NOTE — FEAT-003 will need two more query shapes
- `projects/[slug]` related projects (FEAT-003 REQ-009, default "related by category") are not in `PROJECT_BY_SLUG_QUERY`, so a second query would break NFR-001. There is also no cheap slugs query for `generateStaticParams`.
- **Suggested:** Add `"related": *[_type=="project" && category == ^.category && _id != ^._id][0...3]{…}` to the slug query, plus a `PROJECT_SLUGS_QUERY`. Both are tagged `project`.

### F-12 — NOTE — Studio behaviour with `lead.<uuid>` IDs and the picker are untested live
- From the Sanity source, IDs without `drafts.`/`versions.` count as published, so the Leads list should show them. Ticking "Handled" creates `drafts.lead.<uuid>` and needs **Publish**, which is not obvious to a non-technical editor.
- **Suggested:** After CORS is set, test the following with one `lead.<uuid>` test doc (then delete it):
  - the lead appears in the list;
  - "Handled" can be ticked and published;
  - delete works;
  - the hotspot picker places dots.
- Consider making `handled` usable without a publish step (`liveEdit: true` on `lead`; it has no public draft semantics). The Vision tool is enabled for all editors (`sanity.config.ts:171`); consider restricting it to administrators.

### F-13 — NOTE — Smaller observations
- `getSiteSettings`/content fetches use `useCdn: false` with a token, so every cache miss hits `api.sanity.io` (API quota, not CDN). This is fine at this size given the 1h data cache.
- `src/sanity/types.ts` is generated and committed; regenerate it in CI or a pre-commit step so it cannot drift from `queries.ts`.
- `parseBody` throws on malformed JSON before the signature result is used, so an unauthenticated garbage request gets 400 instead of 401 (harmless).

## 4. Summary

The content model, seed and query layer are carefully built. The seed is verifiably identical to the design (all 6 projects including Arabic and hotspots, all 4 hero slots), tokens stay server-only and out of the client bundle, and revalidation uses the API exactly as the installed Next 16 docs prescribe for webhooks. One blocker: the lead-notification recipients are part of the public `SiteSettings` contract and are serialised into every page (F-01). Fix it before the client fills Site settings, and certainly before merge. F-02 (silent degradation under ISR), F-03 (featured count vs design) and F-04 (credentialed wildcard CORS advice) should be fixed in the same pass. Dashboard steps (CORS, webhook, private dataset) and live Studio checks remain user actions.

REVIEW STATUS: CHANGES_REQUIRED

---

## Re-review (2026-10-27)

Scope: `git diff d481cc8..b6b31a2` (9 commits, 39 files), checked against the findings above and `fixes.md`. Inputs re-read:
- the `review` skill and `AGENTS.md`;
- `node_modules/next/dist/docs` (`incremental-static-regeneration.md`, `revalidateTag.md`);
- the installed sources of `next-sanity/webhook` 13.4.0 (`dist/webhook/index.js`) and `@sanity/webhook` 4.0.4 (`dist/index.js`);
- the `ConfigContext` type in `sanity` 6.20.0, and `@sanity/vision` 6.20.0.

The live dataset was used **read-only**: `verify:content`, anonymous `curl` probes, and two read-token queries. Nothing was written. The seed and `verify:privacy` were not run. No token or secret value was printed.

### R.1 Validation

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm run typecheck` | Clean |
| `npm test` | 18 files / 163 tests passed |
| `npm run schema:validate` | 0 errors, 0 warnings |
| `npm run typegen` (drift check, then `git checkout`) | The regenerated `src/sanity/types.ts` is identical to the committed file (7 queries, 21 types). `--force` is a valid `sanity schemas extract` flag in `@sanity/cli` 8.24 ("Overwrite an existing schema file"). `schema.json` is git-ignored. |
| `npm run build` (`.env.local`) | Success, 16/16 pages. `/api/revalidate` is dynamic; the locale pages are SSG. |
| `npm run build` with Sanity env unset (`.env.local` moved aside, restored afterwards) | Success, 16/16 pages. No page HTML contains the project ID or a `wa.me` link, so the defaults are used. |
| E2E against `next start` (port 3100, `E2E_REUSE=1`) | **75 passed**, including the 3 new `lead-privacy` tests |
| `npm run verify:content` | 12/12 PASS (home = 6 projects in design order; boardroom related = `exec-hq,cowork`; 6 slugs) |
| Build-output scan (values read from `.env.local` in-process: read token, write token, revalidate secret) | **0 secret values** in `.next/static` (651 files) and `.next/server` (1176 files).<br>**0** `leadRouting` / `leadNotificationEmails` / `private.lead` / `recipients` in page outputs (98 html/rsc/meta/segment files).<br>`leadRouting` appears only in the Studio chunk `2-kpe68fie4qi.js` (schema and desk names) and in server chunks.<br>The `recipients` hit in `3ugp1t1u7rvqm.js` is an unrelated library word list (`message-check-recipients`). |
| Anonymous probes on **api** and **apicdn** (no token) | Nothing about the routing document is readable:<br>• `count(*[_type=="leadRouting"])` = 0<br>• `*[_id=="private.leadRouting"]` = [] and `*[_id in path("private.**")]` = []<br>• the same with `perspective=raw`, `drafts` and `previewDrafts` = []<br>• `GET /data/doc/production/private.leadRouting` → `omitted: permission` on both hosts; in a combined request with `siteSettings`, only `siteSettings` comes back<br>• `GET /data/export/production` → 26 documents, none of type `leadRouting` or `lead`<br>• `GET /data/history/.../documents/private.leadRouting?time=…` → `documents: []`; history transactions → 401<br>Control: `count(*[_type=="project"])` = 6. |
| Read token, `perspective: "published"` | `private.leadRouting` is visible (`_type: leadRouting`, `recipients: null`), so `getLeadRecipients()` will work for FEAT-004. The 6 projects still store `featured` (true/true/true/false/true/false). 0 leads, 0 drafts. |
| Webhook probe (local prod server; signatures computed with the real secret via `@sanity/webhook.encodeSignatureHeader`) | **Accepted (200):** fresh (3.0 s); **the same request replayed** (inside the window); +4 min future; signed `lead` (`revalidated:false`); signed `leadRouting` (`revalidated:true`).<br>**Rejected (401):** 6 min old; 2023; +6 min future; tampered body; no header; `garbage`; `t=now,v1=abc` (6 ms, no wait); `t=now,t=old,v1=<oldSig>`; `t=now, <old header>`; leading space + old; `t=0<old>`; two header lines (fresh+old and old+fresh).<br>**400:** signed malformed JSON. |

`.next` was removed afterwards. The working tree is clean apart from this file.

### R.2 Per-finding verdict

| ID | Verdict | Evidence |
|---|---|---|
| F-01 BLOCKER | **Resolved** | **Data path:** the field is gone from `SiteSettings`, `SITE_SETTINGS_QUERY`, the view model and the schema. `toSiteSettings` builds an explicit object, so stray fields are not copied (unit-tested). The client components `Header`, `Footer` and `WhatsAppButton` receive only `SiteSettings`. `generateMetadata` uses translations only. The app has no JSON-LD, and `/api/[...path]` returns a 404.<br>**Server-only read:** `getLeadRecipients` is in `src/sanity/lead-routing.ts` with `import "server-only"`. Nothing imports it yet (FEAT-004). It is tagged `leadRouting`, and that tag is in `SANITY_TAGS`, so the webhook revalidates it (probe: 200 `revalidated:true`). The setup-doc webhook filter includes it.<br>**Anonymous access:** the dotted ID was verified private by type, ID, path, every perspective, `/data/doc`, export and history, on both `api` and `apicdn` (R.1).<br>**Pages:** HTML and RSC are clean (e2e + scan). |
| F-02 MEDIUM | **Resolved, with a caveat (R-04)** | When Sanity is configured and the read fails, it throws. When it is not configured, it returns the defaults without calling Sanity (unit tests). The no-env build passes. The Next 16 docs (`incremental-static-regeneration.md`, "Handling uncaught exceptions") say: "If an error is thrown while attempting to revalidate data, the last successfully generated data will continue to be served". That is true for the hourly background revalidation, but **not** right after a webhook (R-04). |
| F-03 MEDIUM | **Resolved; deviation justified** | `HOME_QUERY` → `projects`, ordered, `[0...6]`, no featured filter. The seed, view model, tests and `verify:content` agree (live: 6 projects in design order). `featured` stays as a `hidden` + `deprecated` schema field. The 6 production documents still store it (read-only check), and no query or type reads it. Keeping it avoids an "unknown field" notice; removing the stored values would need a production patch. Acceptable. |
| F-04 MEDIUM | **Resolved** | `docs/SANITY-SETUP.md` §2 and `.ai/USER-ACTIONS.md` list exact origins only and forbid wildcards in plain words. |
| F-05 LOW | **Resolved** | **Order and window:** the check runs before `parseBody`. A missing or malformed `t=` → 401. The window is ±5 min.<br>**Same `t` as the library:** the route reads the same header string as `next-sanity` (`req.headers.get`). `@sanity/webhook` matches the trimmed header against `^t=(\d+)[, ]+v1=([^, ]+)$`. It then requires the **untrimmed** header to equal `t=${parseInt(t)},v1=${sig}` exactly.<br>**No bypass:** a header with a second `t=`, whitespace, leading zeros, or a combined duplicate header cannot pass the signature check. The only header that can pass starts with `t=<the signed t>`, which is exactly what the route's regex reads. A huge `t` becomes a far-future number or Infinity through `Number` → 401. All of these cases were probed (R.1).<br>**Remaining:** the signature compare is still not constant-time (it is inside the library); accepted as theoretical. Replay inside the window is still possible (R-05). |
| F-06 LOW | **Resolved** | `parseBody(req, secret)`. In the source, the 3 s wait runs only when `validSignature !== false`, so unsigned or wrongly signed requests do not hold the function (probe: 4–15 ms). |
| F-07 LOW | **Partly**: USER-ACTIONS is correct, the setup guide is wrong | See **R-01**. |
| F-08 NOTE | **Done** | `.ai/decisions/2026-10-27-lead-privacy.md` is accurate, except that the "build-output scan" listed as a guard is a manual step (R-07). |
| F-09 NOTE | Open, for FEAT-003 | Unchanged, as planned. |
| F-10 NOTE | **Resolved** | `alt` has `rule.custom(requireBothLocales).warning()`, and the description is softened. |
| F-11 NOTE | **Resolved** | `^.category` and `^._id` in a sub-query inside the `[0]{…}` projection refer to the projected project, as intended (live: boardroom/exec → `exec-hq, cowork`, itself excluded, design order). Ordering happens before `[0...3]`. `PROJECT_SLUGS_QUERY` returns the slugs in order. Both are tagged `project`, and the view model re-filters defensively. Payload size: R-08. |
| F-12 NOTE | **Partly (code done, live checks pending)** | **Leads:** `liveEdit: true` on `lead` only changes the Studio: it patches the published ID directly, and `lead.<uuid>` is a published ID (no `drafts.`/`versions.` prefix). A server-side `create()` in FEAT-004 is unaffected.<br>**Vision:** the filter is type-correct for sanity 6.20 (`tools: ComposableOption<Tool[], ConfigContext>`, `ConfigContext.currentUser.roles: Role[]`), and the vision tool's default `name` is `"vision"`. It only hides the tool in the UI (R-06).<br>**Pending:** the live Studio checks are still a user action. |
| F-13 NOTE | Types in sync (verified); automation still open | — |

### R.3 New findings

#### R-01 — MEDIUM — The setup guide's "first four" variables are the wrong four
- **Evidence:**
  - In the `docs/SANITY-SETUP.md` §1 table, the order is PROJECT_ID, DATASET, READ_TOKEN, **WRITE_TOKEN**, REVALIDATE_SECRET.
  - The text below says "add the **first four** for Production and Preview". Read literally, that puts the Editor write token on Vercel (Production and Preview) and leaves out `SANITY_REVALIDATE_SECRET`.
  - The next paragraph then says "Do not add `SANITY_API_WRITE_TOKEN` to Vercel yet".
  - The parenthesis "(the read token only to Preview if previews must show content)" is also hard to follow for a non-technical reader.
  - `.ai/USER-ACTIONS.md` names the four correctly.
- **Why it matters:** The client follows this guide. Read one way, it re-creates F-07: a dataset-wide Editor token in every preview build. Read the other way, the webhook always answers 401, and publishes take up to an hour to appear.
- **Fix:**
  - Name the four explicitly: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`.
  - Say "Production and Preview" plainly, or put the Preview detail in its own sentence.

#### R-02 — LOW — The FEAT-004 and FEAT-003 work items still describe the old contracts
- **Evidence:**
  - `.ai/work/FEAT-004-lead-forms/impact.md:6,13`: "reads `siteSettings.leadNotificationEmails`".
  - `.ai/work/FEAT-004-lead-forms/spec.md:11` (D2): "lead notification emails set in Sanity Site settings".
  - `.ai/work/FEAT-004-lead-forms/tasks/T-001.md:19`: "settings recipients".
  - `.ai/work/FEAT-003-pages-port/impact.md:15`: a `featuredProjects` query.
  - `.ai/work/FEAT-003-pages-port/tasks/T-007.md:16`: "from Sanity featured projects".
- **Why it matters:** The next implementer works from these files. Following FEAT-004 literally would put the recipients back into `siteSettings` and re-open F-01. `fixes.md` mentions FEAT-003, but nothing points FEAT-004 to `getLeadRecipients()`.
- **Fix:**
  - FEAT-004 (D2, impact, T-001): "recipients come from `getLeadRecipients()` (private `leadRouting`, server only); fallback `LEAD_FALLBACK_EMAIL`".
  - FEAT-003: `getHomeContent().projects`, `getProjectBySlug()` → `{ project, related }`, and `getProjectSlugs()`.

#### R-03 — LOW — `seed --force` still replaces `siteSettings`, which will hold the client's real contact data
- **Evidence:**
  - `scripts/seed/run-seed.ts:65` skips only `LEAD_ROUTING_ID` under `--force`.
  - `siteSettings` is replaced (`createOrReplace`) with the near-empty seed version.
  - The default dataset is `production`, and there is no confirmation step.
  - This behaviour is older than this pass (it was documented as "discards Studio edits"), but the fix protected the recipients and not the contact data.
- **Why it matters:** Once the client fills in Site settings, a single `--force` run (e.g. to reset a project's images) wipes the live phones, WhatsApp, address and social links from every page.
- **Fix:**
  - Exclude `siteSettings` from `--force` the same way as `leadRouting` (it holds no design content), or add a `--only=projects,hero` scope.
  - Optionally require `--yes-production` when the dataset is `production`.

#### R-04 — LOW — After a webhook, a failed Sanity read now shows an error page instead of stale content
- **Evidence:**
  - The route calls `revalidateTag(type, { expire: 0 })`. `revalidateTag.md` says: "`{ expire: 0 }`: Stale content is never served, so the next request is a blocking revalidate/cache miss."
  - With F-02, `getSiteSettings` (and the `content.ts` fetchers) throw when the read fails.
  - There is no `error.tsx` under `src/app/[locale]`, so that visitor gets Next's default error page.
  - The ISR "last good page" guarantee quoted in `fixes.md` covers only background (time-based) revalidation.
  - Also, with `.env.local` present, every page fails under `next dev` when offline.
- **Why it matters:**
  - The window is narrow: a Sanity failure has to happen in the seconds after a publish, and the next request retries.
  - It is still better than silently caching empty contact data for an hour.
  - But it is a visible error on a marketing site, and `fixes.md` and the code comment overstate the guarantee.
- **Fix:**
  - FEAT-003 adds `src/app/[locale]/error.tsx` (localized, with a retry button).
  - Optionally use a small `expire` (e.g. `{ expire: 60 }`), so a failed blocking refresh can fall back to stale content.
  - Make the comment in `site-settings.ts` accurate.

#### R-05 — NOTE — Replay is limited to the 5-minute window, not removed
- **Evidence:** the probe shows that an identical signed request is accepted again inside the window.
- **Impact:** each replay costs about 3 s of function time and forces a refetch. This is acceptable for the threat, because an attacker needs a captured signed request.
- **Optional:** keep a small in-memory set of recently seen `v1` values per instance and reject repeats.

#### R-06 — NOTE — The Vision restriction is a UI convenience, not a security boundary; some Studio behaviour is unverified live
- Hiding Vision does not stop an editor's session from querying the API, and editors already see Leads in the desk. That is fine, but it should not be described as protection.
- Add these to the F-12 live checklist; they can only be checked after someone logs in:
  - Opening, editing and publishing **Lead routing (private)**, which has a `private.` document ID, in the desk.
  - Whether the GROQ webhook fires when `private.leadRouting` is published. If it doesn't, recipients still refresh within the 1 h safety net, which is acceptable.
  - Vision is hidden for an Editor and visible for an Administrator.

#### R-07 — NOTE — Small doc inaccuracies
- `docs/SECURITY.md`, "Build output check", still says the revalidate secret "could not be checked". This re-review checked it: 0 hits.
- The lead-privacy decision record lists a "build-output scan" among the guards. It is a manual step, not an automated test.
- `.env.example` and `SANITY-SETUP.md` promise the site "builds and runs with none of these set". That is still true today, but `content.ts` throws `SanityNotConfiguredError`. FEAT-003 pages must guard against it, or the no-env build (and a fresh preview without env) breaks.
- The `SINGLETON_TYPES` comment ("fixed document ID = type name") is no longer true for `leadRouting`.

#### R-08 — NOTE — Related projects carry the full project payload
- `PROJECT_BY_SLUG_QUERY.related` projects the full `${PROJECT}` for up to 3 projects: gallery, hotspots, and challenge/solution in both languages. A related card needs only title, slug, category and cover. FEAT-003 can trim it to a card projection.
- `RELATED_PROJECT_LIMIT` is exported, but `toProjectPage` hard-codes `slice(0, 3)`.

### R.4 Needs the user
- The same dashboard steps as before: exact CORS origins, the webhook with `leadRouting` in its filter, and a private dataset. Also the live Studio checks in R-06/F-12.
- When adding Vercel env vars, follow `.ai/USER-ACTIONS.md` (its list is correct), not the "first four" sentence in `docs/SANITY-SETUP.md`, until R-01 is fixed.
- Don't run `npm run seed -- --force` once Site settings has been filled in (R-03).

### R.5 Summary
All earlier findings are fixed or deliberately deferred. The blocker F-01 is fixed properly:
- The recipients live in a dotted-ID document that could not be read anonymously by any route tried, on `api` or `apicdn`.
- Only a server-only function reads them.
- No page, RSC payload or build artefact contains them.

The webhook replay check cannot be bypassed: the library's exact header match forces both parsers to read the same `t`.

No blockers remain. Fix R-01 (the wrong "first four" in the setup guide) before the client follows that guide, and R-02 before FEAT-004 starts. This review does not by itself establish that a production deployment is safe.

REVIEW STATUS: READY_FOR_HUMAN_REVIEW
