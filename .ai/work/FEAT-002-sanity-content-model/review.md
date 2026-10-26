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
