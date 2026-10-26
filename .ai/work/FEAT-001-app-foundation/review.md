# FEAT-001 — App foundation — Review

Date: 2026-10-26
Branch: `feat/FEAT-001-app-foundation` (HEAD `76e503d`), base `main` `a28519f`. Scope: `git diff a28519f..HEAD`, excluding `design-reference/`.
Inputs read: `review` skill, `.ai/PROJECT.md`, `.ai/decisions/2026-10-26-accounts-and-services.md`, FEAT-001 `spec/impact/plan/questions`, tasks T-001..T-006, FEAT-002/003/004 specs (and FEAT-002 impact + tasks for the settings contract), `node_modules/next/dist/docs/` (proxy, not-found, layout).

## 1. Validation (re-run independently)

| Check | Result |
|---|---|
| `npm run lint` | Clean (exit 0) |
| `npm run typecheck` | Clean (exit 0) |
| `npm test` | 8 files / 60 tests passed (jsdom logs "Not implemented: navigation to another Document" noise only) |
| `npm run build` (clean `.next`) | Success. 14 SSG pages (`/en`, `/ar` × 6 routes + `_not-found`), dynamic `/[locale]/projects/[slug]`, Proxy present |
| `npm run test:e2e`, run 1 (fresh `.next`, dev server) | **20 passed / 20 failed.** Next dev wrote a corrupted `.next/dev/prerender-manifest.json` (two concurrent writes; JSON parse error at byte 1225) and every later request failed — see F-03 |
| `npx playwright test`, run 2 (fresh `.next`, dev server) | 40 passed (27.8s) |
| `npx playwright test` against `next build && next start -p 3100` (reused server) | 40 passed (12.0s) |
| Extra browser probes against the production build | See findings F-02, F-05, F-07, F-08 |

`.next` (also present before the review, left by the implementer) was removed afterwards; `git status` is clean. `test-results/` is git-ignored.

## 2. Spec compliance

| ID | Verdict | Evidence / comment |
|---|---|---|
| REQ-001 | Partly met | `/` → `/en` (or `/ar` by Accept-Language) works; `<html lang dir>` correct. But the proxy runs **only** on `/` (F-02): `/about`, `/contact`, `/projects/exec-hq` return 404 instead of redirecting. |
| REQ-002 | Met | 7 routes × 2 locales render in the shell (e2e + build output). Slug route accepts any slug (placeholder; FEAT-003 must `notFound()`). |
| REQ-003 / AC-002 | Met | `/en/projects/exec-hq` ↔ `/ar/projects/exec-hq`, query kept. Switch is missing from server HTML (F-07). |
| REQ-004 | Met | All `:root` brand tokens + RGB variants match the design exactly; light/dark surfaces present. Only `--gray` (#E6E6E6, used 4× in the design) not ported (F-14). |
| REQ-005 / AC-001 | Met | Montserrat (EN) / Alexandria (AR) via `next/font/google`, 400–700; only the active locale's variable applied. |
| REQ-006 / AC-003 | Met | next-themes class strategy; the e2e checks `html.dark` and the night background already at `DOMContentLoaded`; probe confirms dark survives reload and the EN→AR switch. No hydration errors seen in the console. |
| REQ-007 | Met | Nav, active state (Projects on a project page), 24px scrolled state, mobile menu, toggles. |
| REQ-008 | Met in code, wrong data | Links, categories → `/projects?category=`, legal, social/contact from `getSiteSettings()`. The default data are placeholders (F-01). |
| REQ-009 | Met in code, wrong data | Per-locale message (design `waText`, verified). Default number is the placeholder `966500000000` (F-01). |
| REQ-010 | Met, with edge cases | Close → push at 1150ms → wait for commit → open (~2.4s); reduced motion skips it. Edge cases F-05, F-06. |
| REQ-011 / AC-004 | Met | Cursor only with `(pointer: fine)` and no reduced motion; RAF and listeners are cleaned up on unmount. |
| REQ-012 | Met | 314/314 design `T` keys extracted; **EN and AR values are byte-identical to the design for all 314 keys** (script compare). 7 shell keys were added (F-10). |
| REQ-013 / AC-005 | Not verified | Nothing pushed; CI never ran on GitHub; no preview URL. Correctly reported as BLOCKED in T-006 (user action). |
| BR-001 | Met | Key parity test; RTL mirrors chevrons (`rtl:rotate-180`), logical `start/end` utilities. |
| BR-002 | Met for what exists | Global reduced-motion CSS, no transition, no cursor. No auto-advancing UI exists yet (FEAT-003). |
| NFR-001 | Met locally | Strict TS, lint and build pass; CI file written but never run (F-09). |
| NFR-002 | Not measured | No Lighthouse/LCP measurement was done. Both logo variants are `priority` (F-13). |
| NFR-003 | Met (basic) | Skip link, `aria-current`, `aria-expanded`/`aria-controls`, Escape closes the menu and returns focus; focus ring = browser default (F-11). |

## 3. Findings

### F-01 — BLOCKER — Placeholder contacts are live by default, against FEAT-002 BR-009 and FEAT-003 BR-003
- **Evidence:** `src/lib/site-settings.ts:8-28` returns `phones: ["+966 50 000 0000", "+966 50 000 0001"]`, `emails: ["info@example.com", "sales@example.com"]`, `website: "https://www.example.com"`, `whatsapp.number: "966500000000"`, working hours, and `address: { en: "[Office address]", ar: "[عنوان المكتب]" }`. The production build's `/en/about` HTML contains `example.com` 19×, `[Office address]`, and `+966 50 000 000x` 9×. The floating button links to `https://wa.me/966500000000` (`whatsapp-button.tsx`), and the header top bar shows the example email and phone (`header.tsx:64-90`).
- **Why it matters:** FEAT-002 BR-009 says "Settings fields left empty hide that item on the site (no placeholder number or link is shown)" and FEAT-003 BR-003 says placeholder content is not shown live. T-004 marks "empty fields hide the item (FEAT-002 BR-009)" as done, but the UI never gets empty fields. Per `.ai/decisions/2026-10-26-accounts-and-services.md`, Vercel builds `main` → **production**, so merging this branch publishes fake contact details. The WhatsApp/tel links send visitors' leads to a number that may belong to a real third party. FEAT-002 impact (line 16) also plans to keep these defaults "as fallback", so the placeholders would outlive the Sanity switch.
- **Fix:** Make every contact default empty: `phones: []`, `emails: []`, `website: ""`, `whatsapp.number: ""`, `workingHours: []`, `address: { en: "", ar: "" }`, `mapUrl: ""`, socials `""`. Keep only real copy: the WhatsApp prefilled message (design `waText`, REQ-009) is fine to keep. The existing hide-when-empty logic then gives a clean shell (no top bar, no contact column, no WhatsApp button) until the client fills Site settings. If a visual fixture is wanted, put it in tests or behind a dev-only flag (`process.env.NODE_ENV !== "production"`), never as the production default. Add a unit test that `getSiteSettings()` defaults contain no `example.com`, no `000 000`, no `[`.

### F-02 — HIGH — Proxy matcher only matches `/`; the escaped dot is lost
- **Evidence:** `src/proxy.ts:10` `matcher: ["/((?!api|studio|_next|_vercel|.*\..*).*)"]`. In a JS string `"\."` is just `"."`, so the pattern becomes `.*..*` ("any non-empty rest"). The compiled manifest confirms it: `.next/server/functions-config-manifest.json` → `"originalSource": "/((?!api|studio|_next|_vercel|.*..*).*)"`. On the production server: `GET /` → 307 `/en`, but `GET /about` → **404**, `GET /projects/exec-hq` → **404**, `GET /contact` → 404. The installed docs use a double backslash: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:94` (`'.*\\.png$'`).
- **Why it matters:** Unprefixed URLs (typed, shared, old links) 404 instead of redirecting. next-intl's middleware never runs on `/en/*` or `/ar/*`, so its locale cookie and alternate-links header are never set (T-002 claims "remembers via NEXT_LOCALE cookie"). FEAT-005 redirects (FEAT-002 BR-001 slug changes) cannot live in this proxy as written. The e2e test `e2e/i18n.spec.ts:45` passes vacuously: it only asserts `/studio` is *not* redirected, which is true because the proxy touches nothing. The T-002 claim "matcher excludes … any path with a file extension" is wrong.
- **Fix:** Change it to `"/((?!api|studio|_next|_vercel|.*\\..*).*)"`. Optionally add a boundary, `(?!(?:api|studio|_next|_vercel)(?:/|$)|.*\\..*)`, so `/studios-x` or `/apiary` are not excluded by accident. Add e2e assertions: `/about` → 307 `/en/about`; `/studio` and `/api/x` are not redirected; `/logo.png` is not redirected.

### F-03 — MEDIUM — E2E suite is unreliable on the dev server (20/40 failed on a clean run)
- **Evidence:** `playwright.config.ts:15-16` uses `npm run dev` with `fullyParallel: true`. Run 1 on a fresh `.next` had 20 failures: `.next/dev/prerender-manifest.json` was corrupted (1235 bytes ending in `..."notFoundRoutes":[]}outes":[]}`), and the dev server logged `Failed to generate static paths for /[locale]…` / `SyntaxError: Unexpected non-whitespace character after JSON at position 1225` for every later request. Run 2 passed 40/40. Against a production build, 40/40 passed. T-006 lists this as a "flake" whose tests "still passed", which is not what happened here.
- **Why it matters:** A red suite at random makes the suite noisy and trains people to ignore it. The dev server also behaves differently from production (proxy, SSG, `useSearchParams` bail-out), so F-02 and F-07 are invisible to the suite. It also blocks adding e2e to CI.
- **Fix:** Run Playwright against a production server: `webServer.command: "npm run build && npm run start -- --port ${PORT}"` (or `next start` when `CI`/`E2E_PROD` is set). This also removes the "a `.next` left by build breaks dev" trap. If dev mode must stay, set `workers: 1` for it.

### F-04 — MEDIUM — `SiteSettings` contract does not match FEAT-002 REQ-005b (phone/email labels)
- **Evidence:** `src/types/site-settings.ts:19-20` `phones: string[]; emails: string[];`. FEAT-002 REQ-005b defines "phone numbers (label en/ar + number), email addresses (label en/ar + address)". FEAT-002 T-004 requires "`getSiteSettings()` reads Sanity; callers unchanged".
- **Why it matters:** The contract the impact analysis promised ("FEAT-002 swaps the implementation without changing callers") cannot hold. Either labels are dropped in FEAT-002, or the type, footer, header and tests all change.
- **Fix:** Now, while there is one consumer, change to `phones: { label: LocalizedString; number: string }[]` and `emails: { label: LocalizedString; address: string }[]`. Render the label in footer rows (fall back to the generic `contact.phone`/`contact.email` label when the label is empty).

### F-05 — LOW — Browser Back during the closing curtain is overridden by the pending navigation
- **Evidence:** `src/components/layout/page-transition.tsx:115-117`: the 1150ms timer calls `router.push(href)` unconditionally. Probe: on `/en/contact`, click About, press Back at 300ms → URL `/en` → at ~1.15s the app pushes `/en/about` anyway (final URL `/en/about`).
- **Why it matters:** The user asked to go back and is sent forward. This matters on mobile, where Back is a gesture.
- **Fix:** While `busy`, listen for `popstate`. On popstate, `clearAll()`, reset the state to `{ phase: null }` and set `busy.current = false`. Add a unit/e2e test.

### F-06 — LOW — Commit detection by exact URL equality keeps the curtains closed 5s for redirects or normalised URLs
- **Evidence:** `page-transition.tsx:121-122` waits until `location.pathname + search === target`, else falls back to `commitTimeout: 5000` (line 20).
- **Why it matters:** Any target that redirects or rewrites its URL will hold the closed overlay for 5s: FEAT-005 slug-change redirects (FEAT-002 BR-001), a page that normalises its query with `router.replace` (e.g. FEAT-003 projects filter dropping an invalid `category`), or `redirect()` in a page. If navigation fails, the overlay opens on the old page after 5s (not stuck, but slow). Timers and the interval are cleared on unmount; no leak found.
- **Fix:** Detect commit through React instead of polling: wrap `router.push` in `startTransition` from `useTransition` and open when `isPending` turns false. Alternatively, open on any `usePathname()`/`useSearchParams()` change after the push. Keep the timeout as a safety net.

### F-07 — LOW — Language switch is missing from the server-rendered HTML
- **Evidence:** `src/components/layout/lang-switch.tsx:17` calls `useSearchParams()`. On statically generated pages this bails out to the nearest Suspense, and `header.tsx:143-145` uses `<Suspense fallback={null}>`. The production `/en/about` HTML contains 0 occurrences of `data-testid="lang-switch"`.
- **Why it matters:** No language switch without JS, crawlers don't see the EN/AR link, and the header controls shift when it hydrates (CLS on every page).
- **Fix:** Render a server-safe fallback, the same link without the query string: `<Suspense fallback={<LangSwitch className=… ignoreQuery />}>`. Or read `window.location.search` in the click handler instead of `useSearchParams`.

### F-08 — LOW — 404 pages are outside the shell, unlocalised and without `lang`
- **Evidence:** There is no `src/app/[locale]/not-found.tsx` and no catch-all. Production `GET /en/nope` → 404 with a bare `<html>` (no `lang`/`dir`, Next default page). Unknown non-locale paths behave the same.
- **Why it matters:** It's a broken-looking experience in both languages and an a11y gap (`lang` missing). FEAT-003 project pages will call `notFound()` and land here too.
- **Fix:** Add `src/app/[locale]/[...rest]/page.tsx` → `notFound()` and `src/app/[locale]/not-found.tsx` (localised, inside the shell). For non-locale paths, consider `global-not-found.tsx` (experimental flag `globalNotFound`, documented in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md:49-76`), which is the documented answer for apps with multiple root layouts (this one will have two once `/studio` exists). This can also be scheduled in FEAT-003/005.

### F-09 — LOW — CI workflow hygiene
- **Evidence:** `.github/workflows/ci.yml` has no `permissions:` block (line 12 goes straight to `jobs:`), and it has never run.
- **Why it matters:** `GITHUB_TOKEN` gets the repo/org default scope, which may include write access; least privilege is cheap.
- **Fix:** Add top-level `permissions: { contents: read }`. After F-03, consider an e2e job (`npx playwright install --with-deps chromium` + production server). Steps otherwise mirror the npm scripts. `npm ci` + cache is fine, and no secrets are needed.

### F-10 — NOTE — Seven shell strings are not from the design `T` object; their Arabic needs a native check
- **Evidence:** All 314 design keys match exactly. Added keys: `nav.menu`/`closeMenu` (AR present inline in the design), `switchLang`, `toggleTheme`, `mainLabel` (design has only English `aria-label`s), and `skip`, `logoAlt` (not in the design). Arabic for `switchLang`, `toggleTheme`, `mainLabel` and `skip` (`messages/ar.json:84-88`) was written by the implementer.
- **Suggested:** Native-speaker review of those 4 strings. EN `mainLabel` is "Main" while AR says "Main navigation"; this is harmless.

### F-11 — NOTE — Focus ring is the browser default
- **Evidence:** No `:focus-visible` rules in `src/app/globals.css` or components. The design defines cyan outlines (e.g. `.ft-lk:focus-visible{outline:2px solid var(--cyan);outline-offset:4px}`).
- **Suggested:** Add a base `:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px }` so focus is consistent and visible on the navy footer and glass header (NFR-003).

### F-12 — NOTE — Footer year is frozen at build time
- **Evidence:** `footer.tsx:117` `new Date().getFullYear()` in a server component on SSG pages.
- **Suggested:** This is acceptable once FEAT-002 revalidation re-renders pages. Otherwise compute it in a tiny client component, or accept a rebuild each January.

### F-13 — NOTE — NFR-002 (LCP) unmeasured; both logos are preloaded
- **Evidence:** `header.tsx:121,129`: both light and dark logos are `priority`, while one of them is always `display:none`.
- **Suggested:** Measure LCP (Lighthouse mobile) on a preview deploy. Keep `priority` on the light logo only, or use a single `<picture>`/CSS swap.

### F-14 — NOTE — Design token `--gray: #E6E6E6` not ported
- **Evidence:** Design `:root{--gray:#E6E6E6}`, used 4×; it is absent from `globals.css`.
- **Suggested:** Add it with the other tokens when FEAT-003 needs it.

### F-15 — NOTE — No favicon
- **Evidence:** No `src/app/icon.*`/`favicon.ico`/`public/favicon.ico`. Every page load logs a 404.
- **Suggested:** Add `src/app/[locale]/icon.png` (or FEAT-005).

### F-16 — NOTE — Spec tension for FEAT-002 (not a FEAT-001 code issue)
- FEAT-002 REQ-009 / T-005 seed "the design's placeholder contacts" into the Sanity `siteSettings`. Published, they would show live, which contradicts FEAT-002 BR-009 and FEAT-003 BR-003. Recommend the seed leave contact fields empty, or create the settings as a draft only.

### F-17 — NOTE — `/studio` (FEAT-002) feasibility with `[locale]/layout.tsx` as root layout: OK
- A static `src/app/studio/[[...tool]]/page.tsx` with its own `src/app/studio/layout.tsx` (own `<html>/<body>`) is a second root layout; Next docs (`layout.md:142-145`) allow multiple root layouts. The static segment `studio` takes precedence over `[locale]`. `globals.css`, fonts and providers are imported only in `[locale]/layout.tsx`, so they do not leak into the Studio. Navigating between the site and the Studio is a full page load (expected). `/api/*` route handlers need no layout. Prerequisites: F-02 fixed (then `/studio` is correctly excluded), and F-08's not-found strategy should account for two root layouts.

### F-18 — NOTE — Other checks with no issue found
- **Transition:** ctrl/cmd/shift/alt/middle clicks, `target`, `download`, hash, external (`scheme:`) and locale links are not intercepted (`transition-link.tsx`); ctrl-click verified to open a new tab with no overlay. Same-URL clicks are not intercepted. Unmount clears timeouts/interval. Native back/forward run without a transition (verified).
- **Theme:** no flash (asserted at DOMContentLoaded), `suppressHydrationWarning` only on `<html>`, toggle icons swapped by CSS, no hydration warnings in the production console.
- **Menu:** Escape closes and returns focus; closes on route change; the next Tab goes into the menu (DOM order). It is a disclosure, so no focus trap is needed. `aria-controls` points to an id that only exists while open (harmless).
- **Security:** no secrets in the diff; `.env*` ignored except `.env.example`; external links use `rel="noopener noreferrer"`.
- **`react-bootstrap-icons`:** tree-shaken. The client chunks contain exactly the 8 icons used in client components; the footer icons render on the server.
- **Custom cursor:** its RAF loop runs continuously while enabled. This matches the design; it could idle when the ring has caught up.

## 4. Summary

The foundation is solid: the toolchain, strict TS, extracted messages that exactly match the design, tokens, the no-flash theme, the shell, and the transition and cursor with reduced-motion handling are well done and tested. Two problems must be fixed before merge to `main`, which auto-deploys to production: the placeholder contact defaults (F-01) and the one-character proxy matcher bug (F-02). F-03 (unreliable e2e harness) and F-04 (settings contract vs FEAT-002) should be fixed in the same pass because they are cheap now and expensive later. REQ-013/AC-005 stay open until the first push.

REVIEW STATUS: CHANGES_REQUIRED

## Fixes after review

Implementer, 2026-10-26, on `feat/FEAT-001-app-foundation`. Validation after the fixes: `npx tsc --noEmit` clean, `npm run lint` clean, `npm test` 8 files / 66 tests passed, `npm run build` ok (15 static pages), `npm run test:e2e` against `next build && next start` 62 passed.

| Finding | Status | Commit |
|---|---|---|
| F-01 placeholder contact defaults | Fixed (all contact defaults empty; UI hides items; unit + e2e) | `7977e4b` |
| F-02 proxy matcher | Fixed (+ segment boundaries; e2e proves redirects and exclusions) | `13ad543` |
| F-03 e2e on dev server | Fixed (production server; `E2E_DEV=1` for dev) | `5353297` |
| F-04 settings contract | Fixed (labeled phones/emails) | `7977e4b` |
| F-05 Back during curtains | Fixed | `994b1a7` |
| F-06 commit detection | Fixed (any URL change, 1.5s fallback) | `994b1a7` |
| F-07 language switch in server HTML | Fixed | `f073e1c` |
| F-08 404 pages | Fixed for locale paths and /api; see note | `4c36b68` |
| F-09 CI permissions | Fixed | `5e672aa` |
| F-10 | Skipped (per coordinator) | - |
| F-11 focus ring | Fixed (cyan) | `9b6d4b8` |
| F-12 footer year | Fixed (client) | `9cb30cc` |
| F-13 | Skipped (per coordinator) | - |
| F-14 `--gray` | Fixed | `9b6d4b8` |
| F-15 favicon | Fixed (`src/app/icon.svg`, navy tile with the three brand stripes; the logo PNGs are wide wordmarks, no square mark exists) | `57dfa3c` |
| F-16 / F-17 | Skipped (per coordinator) | - |

Note on F-08: `src/app/global-not-found.tsx` was tried and removed. Every path with a first segment matches `[locale]`, so global-not-found is never used. Instead: `[locale]/not-found.tsx` + `[locale]/[...rest]` for `/en/*` and `/ar/*` (unprefixed unknown paths are redirected there by the proxy), and `api/[...path]` returns JSON 404. Not fixed: a 404 for an excluded non-locale path such as `/studio/x` (before FEAT-002 adds the Studio) still shows Next's default error shell without `lang`, because the root layout `[locale]/layout.tsx` calls `notFound()` for an invalid locale and Next's fallback then has no `<html lang>`. FEAT-002's own Studio layout makes that moot.

## Re-review 2026-10-26

Scope: commits `7977e4b`..`13f1d8c` (plus `05834a4`, the FEAT-002 spec change for F-16) on `feat/FEAT-001-app-foundation`. Each fix was checked independently: code read, tests re-run, and probes against a production build (`next build` + `next start`, curl and Playwright, including a no-JS context and a delayed RSC response).

### Validation

| Check | Result |
|---|---|
| `npm run lint` | Clean (exit 0) |
| `npm run typecheck` | Clean (exit 0) |
| `npm test` | 8 files / 66 tests passed |
| `npm run build` (clean `.next`) | Success: SSG for `/en` and `/ar` × 6 routes, `_not-found`, `icon.svg`. Dynamic: `[locale]/[...rest]`, `[locale]/projects/[slug]`, `api/[...path]`. Proxy present. Compiled matcher `originalSource` = `/((?!(?:api\|studio\|_next\|_vercel)(?:/\|$)\|.*\\..*).*)` (dot correctly escaped) |
| `npm run test:e2e` (clean `.next`; config now builds and runs `next start`) | 62 passed (24.2s), exit 0 |

`.next` was removed afterwards; the tree is clean.

### Per-finding verdict

| Finding | Verdict | Evidence |
|---|---|---|
| F-01 placeholder contacts | **Fixed** | `src/lib/site-settings.ts`: all contact fields are empty; only the WhatsApp message (design `waText`) is kept. `git grep` finds no placeholder in shipped `src/` code (only in doc comments and test fixtures, `src/test/render.tsx`). Unit test `contact.test.ts` asserts the empty defaults and no `example.com\|000 000\|[Office\|[عنوان`. `layout.test.tsx` "shipped defaults" asserts no top bar, contact column, socials, WhatsApp, `tel:`, `mailto:` or `wa.me`. E2E `shell.spec.ts` asserts the same on the production build. Empty items are hidden. See N-04 for placeholder strings still in the message files. |
| F-02 proxy matcher | **Fixed** | `src/proxy.ts:12`. Production probes: `/about` → 307 `/en/about`; `/projects?category=hq` → 307 with the query kept; `/apiary` and `/does-not-exist` → 307; `/studio`, `/studio/x`, `/api`, `/api/x`, `/favicon.ico` → no redirect. The new e2e block `e2e/i18n.spec.ts` "proxy matcher (F-02)" asserts the 307 status **and** the exact `Location` (EN and AR Accept-Language), and asserts that excluded paths get no `Location`. It would have failed on the old matcher, so it is a real regression test. |
| F-03 e2e harness | **Fixed** | `playwright.config.ts`: `npm run build && npm run start` by default, `E2E_DEV=1` for dev, no silent reuse. 62/62 green on a clean `.next`. |
| F-04 settings contract | **Fixed** | `src/types/site-settings.ts`: `phones`/`emails` are `LabeledValue[]` (`{ label: {en, ar}, value }`), matching FEAT-002 REQ-005b. The footer shows the label under each entry (unit-tested). |
| F-05 Back during curtains | **Fixed** | `page-transition.tsx:115-121`: popstate cancels the timers and the overlay. Probe: Back at 300ms → stays on `/en`, no overlay. Back after the push committed (1.3s) → native back to `/en/contact`, overlay removed. Unit + e2e tests added. Minor leftover: N-03. |
| F-06 commit detection | **Fixed, but introduced a regression** | Any URL change after the push now counts as commit (redirects are handled; unit test). The safety timeout was cut from 5000ms to 1500ms (`page-transition.tsx:20`), which breaks slow navigations: see N-01. |
| F-07 SSR language switch | **Fixed** | Production `/en/projects/exec-hq` HTML has `<a hrefLang="ar" … data-testid="lang-switch" href="/ar/projects/exec-hq">`. The `Suspense` was removed and the query is added on click (`lang-switch.tsx:31-36`). Probe: `/en/projects?category=mosque` → `/ar/projects?category=mosque`, `dir=rtl`. A modified click (new tab) drops the query; that is acceptable. |
| F-08 404 pages | **Partly fixed** | With JS: `/en/nope` and `/ar/a/b` → 404 status, localised content inside the shell, `lang`/`dir` correct (e2e). Unprefixed unknown paths → proxy → localised 404. Unknown `/api/*` → JSON 404. **But the server HTML is Next's error shell**, see N-02. |
| F-09 CI permissions | **Fixed** | `.github/workflows/ci.yml`: `permissions: contents: read`. CI is still never run on GitHub (no push). |
| F-10 Arabic shell strings | Skipped (intentional) | Still open for native review. The new `notFound.*` strings (4 keys) also need it (N-05). |
| F-11 focus ring | **Fixed** | `globals.css` base `:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px }`. E2E asserts computed outline `2px solid rgb(76, 166, 203)`. |
| F-12 footer year | **Fixed** | `current-year.tsx`: `useSyncExternalStore` with the build year as server snapshot and the live year on the client, so there is no hydration warning. |
| F-13 LCP / logo preload | Skipped (intentional) | Open: NFR-002 is still unmeasured. |
| F-14 `--gray` | **Fixed** | `globals.css` `--gray` + `--color-gray`; covered by the token test. |
| F-15 favicon | **Fixed** | `src/app/icon.svg` is served as `image/svg+xml` and linked from every page (e2e: no 404 on load). A direct `/favicon.ico` request still returns 404 (harmless; browsers follow the `<link rel=icon>`). |
| F-16 seed placeholders | **Fixed in spec** | `05834a4`: FEAT-002 REQ-009 / T-005 now seed an empty `siteSettings`. |
| F-17 `/studio` feasibility | Skipped (note only) | Still valid. The F-02 fix now correctly excludes `/studio` and `/studio/*`. |

### New findings

#### N-01 — MEDIUM — 1.5s commit timeout opens the curtains on the old page during slow navigations (regression from the F-06 fix)
- **Evidence:** `src/components/layout/page-transition.tsx:20` `commitTimeout: 1500` (was 5000). `page-transition.test.tsx:101` pins `expect(TRANSITION_TIMING.commitTimeout).toBeLessThan(2000)`. Probe on the production build, with the About page's RSC response delayed by 3s (Playwright `page.route`), timeline in ms after the click:
  - 73 → `close` on `/en`
  - 1239 → `hold` on `/en`
  - **2872 → `open` on `/en`, with the home page still showing**
  - 4006 → overlay removed, still on `/en`
  - **4255 → URL becomes `/en/about` and the About page appears with no transition**
- **Why it matters:** A navigation slower than ~2.7s (1.15s close + 1.5s timeout) plays the reveal on the *old* page, then the new page appears abruptly. That is the opposite of the design's close → swap → open. Slow navigations are realistic for this site: uncached dynamic `projects/[slug]` pages fed by Sanity, heavy FEAT-003 pages, and a mid-range phone on 4G (NFR-002). The old 5s timeout only existed to handle redirects; the new "any URL change" check already covers those, so the short timeout is no longer needed.
- **Fix:** Restore a generous safety timeout (≥ 5–8s) and drop the `< 2000` assertion. To also handle "landed on the current URL" without a long wait, detect completion with React: call `router.push` inside `startTransition` from `useTransition()` and open when `isPending` becomes false (or the URL changed). Keep the timeout as the last resort. Add an e2e test with a delayed RSC response (as above) asserting that the overlay stays closed until the URL changes.

#### N-02 — LOW — The localised 404 is rendered only by client JS; the server HTML is Next's blank error shell
- **Evidence:** Production `GET /en/nope` → status 404, but the HTML is `<html id="__next_error__">` with no `lang`/`dir`, an empty `<body>` (scripts only), and the RSC payload carries `digest:"NEXT_HTTP_ERROR_FALLBACK;404"`. "Page not found" appears only inside the RSC payload. With JS disabled (Playwright `javaScriptEnabled: false`), the page shows no 404 content and `lang` is `null`. The e2e tests pass only because the client renders the not-found UI after hydration.
- **Why it matters:** This is the original F-08 problem (no `lang`, no shell), now hidden behind JS. Crawlers and no-JS users see a blank page, and every 404 costs a full client render. It was not detected because the tests run with JS on.
- **Fix:** Find out why the `notFound()` thrown in `[locale]/[...rest]/page.tsx` escapes the `[locale]/not-found.tsx` boundary during SSR. Candidates to check: whether the async `getTranslations("notFound")` in `not-found.tsx` resolves the locale during SSR (try `getTranslations({ locale: await getLocale(), namespace: "notFound" })`, or a client component using `useTranslations`), and whether a root-level layout (the root layout is `[locale]/layout.tsx`) affects how Next 16 places the not-found boundary. Add an e2e test using `request.get("/en/nope")` that asserts the raw HTML contains `lang="en"` and `data-testid="not-found"`.

#### N-03 — NOTE — popstate listener is not removed when the provider unmounts
- **Evidence:** `page-transition.tsx:121` adds a `popstate` listener per transition and removes it only in `finish()`. The unmount cleanup (`useEffect(() => clearAll, …)`, line 75) clears timers but not the listener. Fragment navigations also fire `popstate`, so they would cancel a running transition. The overlay blocks clicks, so this is unlikely in practice.
- **Suggested:** Keep the active `cancel` in a ref and remove it in the unmount cleanup.

#### N-04 — NOTE — Design placeholders remain in the message files (for FEAT-003)
- **Evidence:** `messages/en.json:25` `contact.locCity: "[Office address]"` (AR `"[عنوان المكتب]"`), `:160-161` `pdH1/pdH2` (hard-coded working hours), `:97` `tbc: "To be confirmed"`. They are not rendered today, which is consistent with extracting the full `T` object.
- **Suggested:** FEAT-003 must take address and hours from `SiteSettings` (hidden when empty), never from these keys (FEAT-002 BR-009, FEAT-003 BR-003). Consider deleting `locCity`/`pdH1`/`pdH2` once FEAT-003 confirms they are unused.

#### N-05 — NOTE — New authored strings need the same native review as F-10
- **Evidence:** `messages/{en,ar}.json` `notFound.{code,title,body,home}` are not from the design.

#### N-06 — NOTE — Doc text shows the matcher with a single backslash
- **Evidence:** `.ai/work/FEAT-001-app-foundation/tasks/T-002.md` "Fixes after review" quotes the matcher as `.*\..*`, while the code (correctly) has `"\\."`. Anyone copying from the doc would reintroduce F-02.
- **Suggested:** Quote the exact source string.

### Summary

All findings that were addressed are fixed except F-08 (works only with JS, N-02). The F-01 blocker and the F-02 high are resolved and covered by tests that would catch a regression. One regression came in with the F-06 fix (N-01, MEDIUM): fix it before merge, or accept it knowingly, because it affects every slow navigation. There are no blockers. REQ-013/AC-005 (Vercel preview) and the first CI run still wait for the push.

REVIEW STATUS: READY_FOR_HUMAN_REVIEW
