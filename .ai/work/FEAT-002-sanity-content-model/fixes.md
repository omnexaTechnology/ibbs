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

## Re-review follow-ups (2026-10-27)

| Finding | Status | Commit | Evidence |
|---|---|---|---|
| R-01 "first four" variables | Fixed | see `git log` (R-01, R-02) | `docs/SANITY-SETUP.md` section 1 names the four: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET` (Production and Preview), matching `.ai/USER-ACTIONS.md`. |
| R-02 stale specs | Fixed | same | FEAT-004 `spec.md`, `impact.md`, `questions.md`, `tasks/T-001.md` use `getLeadRecipients()` (private `leadRouting`, fallback `LEAD_FALLBACK_EMAIL`). FEAT-003 `spec.md`, `impact.md`, `plan.md`, `tasks/T-003/T-005/T-007.md` use `getHomeContent().projects` (max 6), `getProjectBySlug()` -> `{ project, related }`, `getProjectSlugs()`. FEAT-004 `plan.md` and `tasks/T-002/T-003` had no references. The `../ibss-web-feat003` worktree was not touched. |
| R-03 seed `--force` | Fixed | R-03 commit | `--force` skips `siteSettings` and `private.leadRouting` (`FORCE_PROTECTED_IDS`, tested). Chosen option: `--force` on the `production` dataset refuses to run without `--yes` (verified live: it refuses and writes nothing). Plain `npm run seed` stays create-only, so it needs no flag (it can never overwrite). Documented in the `scripts/seed.ts` header and `docs/SANITY-SETUP.md` section 7. |
| R-04 error page | Fixed | R-04/R-07 commit | `src/app/[locale]/error.tsx` (client, Next 16 `retry` prop per the installed docs, EN/AR strings under `errorPage` in `messages/`, unit-tested in both languages). Layout errors are NOT caught by a segment `error.tsx` (it does not wrap the layout of its own segment), and `getSiteSettings` runs in the layout, so I also added `src/app/global-error.tsx` (own `<html>`, both languages shown, retry). `getSiteSettings` falls back to empty defaults with a console warning only when `NODE_ENV === "development"`; builds and production throw (unit-tested). Comment in `site-settings.ts` now states the real guarantee: stale page kept for background revalidation only, error page + retry right after a webhook. Not done: a short `expire` instead of 0 (kept `expire: 0`). The visual look of the error pages was not checked in a browser. |
| R-07 doc inaccuracies | Fixed | same | `docs/SECURITY.md` build-output paragraph corrected; new `npm run scan:build` (`scripts/scan-build.ts`: no secret values, no `leadNotificationEmails`, no `leadRouting` in page output; `leadRouting` in Studio chunks is allowed); the decision record calls it a manual step; `content.ts` returns empty results without calling Sanity when not configured (tested), so FEAT-003 pages build with no env; `SINGLETON_TYPES` comment fixed. |
| R-05, R-06, R-08 | Skipped as requested | - | - |

Validation after the follow-ups: `npm run lint` clean, `npm run typecheck` clean, `npm test` 19 files / 165+ tests passed (see the final report for counts), `npm run schema:validate` 0 errors, builds with and without `.env.local` succeed (16/16), `npm run scan:build` PASS (752 files), e2e on port 3100: 75 passed, `npm run verify:content` all passed. `.next` removed.
