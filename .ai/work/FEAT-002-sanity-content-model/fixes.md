# FEAT-002 — Review fixes (response to review.md, CHANGES_REQUIRED)

Date: 2026-10-27. Branch `feat/FEAT-002-sanity`, base of this pass `d481cc8`. Commits are local only (not pushed).

| Finding | Status | Commit | Evidence |
|---|---|---|---|
| F-01 BLOCKER lead recipients public | Fixed | 16a36f0 | Field removed from `SiteSettings`, `SITE_SETTINGS_QUERY`, view model and `siteSettings` schema. New type `leadRouting`, fixed ID `private.leadRouting`, desk entry "Lead routing (private)", server-only `getLeadRecipients()` (`src/sanity/lead-routing.ts`, tag `leadRouting`; route + webhook filter in `docs/SANITY-SETUP.md` include it). Seed creates the empty doc (done on production: `created private.leadRouting`, everything else `exists`); `--force` never touches it. Tests: toSiteSettings/getSiteSettings return only whitelisted display keys even if Sanity returns extra fields; no page query mentions lead/recipient/private; e2e `e2e/lead-privacy.spec.ts` checks `/en`, `/ar`, `/en/contact` HTML and RSC payload. Anonymous curl (api and apicdn): `count(*[_type=="leadRouting"])` = 0, `*[_id=="private.leadRouting"]` = [], `GET /data/doc/...` = `omitted: permission`, while projects still return 6. The read token sees the doc (`_type: leadRouting`, no recipients yet). Build scan: see below. |
| F-02 MEDIUM swallowed Sanity errors | Fixed | 0121385 | `getSiteSettings` returns defaults only when `!isSanityConfigured`; configured + fetch error throws. Other content fetches (`content.ts`) already threw; no other swallow in `src`. Unit tests: configured+error rejects; not configured never calls Sanity. `npm run build` with `.env.local` moved away succeeds (16/16 pages). |
| F-03 MEDIUM home shows 4, design 6 | Fixed | c0cd982 | `HOME_QUERY` returns `projects` = all projects in design order, capped by `HOME_PROJECT_LIMIT = 6` (`src/content/taxonomy.ts`). Why a cap: the accordion has 6 clip shapes and a fixed width, so a 7th panel would break the layout; with no cap a client adding a project would silently distort the home page. 7th+ still on `/projects`. `featured` removed from queries, view model, seed data/types/tests, `verify:content`; `getFeaturedProjects` / `FEATURED_PROJECTS_QUERY` removed; `getHomeContent()` now returns `{ hero, projects }`. **Deviation:** the schema keeps `featured` as a hidden, deprecated field, because the 6 production projects still store it and deleting the field would show an "unknown field" notice in the Studio; removing the stored values needs a production patch outside the idempotent seed. Safe to delete the field later. `verify:content` passes (home = exec-hq, ops-floor, boardroom, cowork, medical, clinic-admin). |
| F-04 MEDIUM wildcard CORS | Fixed | a1d27ad | `docs/SANITY-SETUP.md` section 2: exact origins only (localhost:3000, production domain, stable vercel.app alias) with the reason; wildcard explicitly forbidden. `.ai/USER-ACTIONS.md` was already consistent. |
| F-05 LOW replay | Fixed | 38ecbc1 | Route parses `t=` from `sanity-webhook-signature` and returns 401 if missing or more than 5 minutes from now (either direction), before body parsing. Tests: 6 min old, 2023, +6 min future all 401 (`revalidateTag` not called); 1 min old 200. Signature comparison stays inside `@sanity/webhook` (I do not verify it myself), so it is not constant-time: not changed, risk is theoretical over the network. |
| F-06 LOW consistency wait | Fixed | 38ecbc1 | `parseBody(req, secret)` with the default 3 s wait. Tests mock the wait off but assert the route passes only two arguments. Webhook now answers after about 3 s (Sanity timeout is 30 s). |
| F-07 LOW write token on Vercel | Fixed | a1d27ad | `docs/SANITY-SETUP.md` section 1: add only the first four variables; write token not on Vercel until FEAT-004, then Production only. `.ai/USER-ACTIONS.md` already said so. |
| F-08 NOTE lead privacy decision | Done | a578682 | `.ai/decisions/2026-10-27-lead-privacy.md` (dataset private = user action pending; site keeps the Viewer token; recipients in dotted-ID doc; guards). Unit test fails if any page query mentions lead / recipient / private. `docs/SECURITY.md` updated. `verify:privacy` also checks the routing doc (not re-run: it writes a temporary lead to production). |
| F-10 NOTE gallery alt | Fixed | ae9b3e5 | `alt` has `rule.custom(requireBothLocales).warning()` and a clearer description. |
| F-11 FEAT-003 query shapes | Fixed | 4977ea2 | `PROJECT_BY_SLUG_QUERY` now also returns `related` (same category, not itself, max 3, design order); new `PROJECT_SLUGS_QUERY`; both tagged `project`. Typegen regenerated (`src/sanity/types.ts`; `typegen` script now passes `--force` so `schema.json` is refreshed). View models `toProjectPage`, `toProjectSlugs`; content API `getProjectBySlug` now returns `{ project, related } | null`, new `getProjectSlugs()`. Tests in `view-models.test.ts`, `fetch.test.ts`; `verify:content` checks `boardroom` related = exec-hq, cowork and 6 slugs. |
| F-12 NOTE | Partly | ae9b3e5 | `liveEdit: true` on `lead` ("Handled" saves without Publish) and the Vision tool is hidden unless the user has the administrator role (`sanity.config.ts`). The live Studio checks (lead list with `lead.<uuid>` IDs, delete, hotspot picker) are still untested: they need CORS and a login (user action). |
| F-09, F-13 | Not done (notes) | - | F-09 is for FEAT-003. F-13: typegen drift is not automated yet. |

## Validation (2026-10-27)

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm run typecheck` | Clean |
| `npm test` | 18 files / 163 tests passed |
| `npm run schema:validate` | 0 errors, 0 warnings |
| `npm run build` with `.env.local` | Success |
| `npm run build` with Sanity env unset | Success (16/16 pages) |
| E2E against `next start` (`E2E_REUSE=1`) | 75 passed (72 before, plus 3 new privacy tests) |
| `npm run verify:content` | All checks passed |
| Build output scan (`.next/static`, `.next/server/app` html/rsc/meta; token and secret values read in-process) | 749 files: 0 token/secret values, 0 `leadNotificationEmails`, 0 hits in any page HTML/RSC. `leadRouting` / `private.leadRouting` appear only in the Studio's own chunk `.next/static/chunks/2-kpe68fie4qi.js` (schema and desk structure names, no data), loaded by `/studio` only. |

`.next` removed afterwards.

## Notes for the next features

- FEAT-003: use `getHomeContent().projects` (not `featured`), `getProjectBySlug()` returns `{ project, related }`, `getProjectSlugs()` for `generateStaticParams`. `.ai/work/FEAT-003-pages-port` still says `featuredProjects` in places; read it as "home projects".
- FEAT-004: recipients come from `getLeadRecipients()` (server only). It throws if Sanity fails and returns `[]` if nobody filled the list in, so fall back to `LEAD_FALLBACK_EMAIL`.
