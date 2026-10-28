# FEAT-003 — Final review (before the PR to `main`)

Date: 2026-10-28. Scope: `git diff origin/main...HEAD` on `feat/FEAT-003-pages` (HEAD `7fefede`). The focus was the work no batch review had covered: T-006 (`5a69cda`), T-007 (`a82e646`), T-008 (about, merged in `110d70d`) and T-010 (`5c5a043..7fefede`), plus the cross-cutting risks (security, SSR, 3D lifecycle, a11y).
The reviewer worked read-only on source. The only file written is this one. One probe ran against a local `next start` on port 3123 (now stopped).

## Verdict: FIX_REQUIRED

There is one blocker, and the fix is small. On phones and tablets (up to 1024 px), the home "Our projects" row auto-advances with `scrollIntoView`, and that also scrolls the **page**. Every 5 s the visitor is pulled down to the featured section from wherever they are, including from the hero right after load. Everything else reviewed holds up, so the PR is ready once F3-01 is fixed.

Counts: blocker 1, major 0, minor 9.

## Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass (exit 0). |
| `npx vitest run` | Pass: 38 files, 287 tests. |
| `npm run build` (normal) | Pass. All locale pages are SSG (●). `/[locale]/e2e-fixtures` is built but answers 404 without `E2E_FIXTURES=1`. |
| Full Playwright, axe, bundle check | Not re-run (lean rules). T-010 reports 140/140, axe 0 serious/critical, and no Three in the initial chunks. |
| Targeted probe (F3-01) | Playwright, 390×800, `/en`, no input. `scrollY` went from 0 to 9054 within 12 s. The featured row starts at y 9453. |
| Secrets / private data | Only the Studio schema chunk mentions `leadRouting`, and it holds the schema definition, not data. No prerendered site page loads that chunk. No token or secret names appear in `.next/static`. FEAT-003 does not change any GROQ query (`src/sanity` has no diff). |
| `metadataBase` / canonical | Absolute canonical and hreflang URLs (en, ar, x-default) are in the built HTML. The fallback order is `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then localhost. On Vercel (the chosen host) this gives the production host even on previews, so the canonical cannot point at a preview host. See minor 1 for the localhost case. |
| 3D lifecycle | All scenes go through `SceneCanvas`: a `DisposeBag` with `forceContextLoss`, observers, listeners, and a late factory result disposed after an unmount. Process, walk and CTA set `releaseWhenFar`, so the home page holds at most 2 contexts at once (process and walk where they meet). The walk scene removes `html.wk-lock` on dispose (`ctx.own(() => exit(true))`), so a navigation away while in free mode does not leave the page unscrollable. |
| Reduced motion | Scenes run on demand. Process and walk build their final state (`rm` paths). The pinned heights drop to `auto` through CSS and through `data-pinned`. Featured and the carousels do not auto-advance. |
| B1-10 / B1-11 | Applied. The process lamps use `legacyPointFactor(10, 2, 0.5, 0.75)`. The about-build lamps use a lower `ref`. The CTA passes `LinearToneMapping` through `SceneRoot`. |
| `--link` change | Light mode only: `#2a66ab` in `:root`. Dark mode still uses `--link: var(--cyan)` in `.dark`. No `text-link` sits on a navy surface in light mode. |
| i18n | `en.json` and `ar.json` have the same keys. |
| Hydration | No `Date`, `Math.random` or `window` reads during render in the new sections. `useReducedMotion` and `useCoarsePointer` use `useSyncExternalStore` with a `false` server snapshot. |

## Blockers and majors

| ID | Severity | File:line | Issue | Suggested fix |
|---|---|---|---|---|
| F3-01 | blocker | `src/components/sections/home/featured.tsx:42`, `:63-69` | In row mode (≤1024 px), `goTo` calls `el.scrollIntoView({ inline: "start", block: "nearest" })`. That scrolls every scrollable ancestor, the window included, whenever the row is not fully in view. The auto-advance interval runs every 5 s, whether or not the section is on screen. It stops only after a pointer, focus or hover event on the row. The result: on a phone, the page jumps from the hero to "Our projects" about 5 s after load, and again every 5 s from anywhere on the page (reproduced: `scrollY` went from 0 to 9054). | Scroll only the row: `row.current.scrollTo({ left: <child offset>, behavior })`. In RTL, use the child's offset from the row's right edge, or `scrollBy` by the difference between the child's and the row's `getBoundingClientRect()` start edges. Also run the interval only while the row is in view (the existing `useInView`), as `Carousel` already does. Add an e2e that loads `/en` at 390 px, waits 6 s and expects `scrollY` to still be 0. |

## Minor

1. `src/lib/seo.ts:9`: with neither env var set (for example a self-hosted or Docker build), canonical and hreflang silently become `http://localhost:3000`. Add `NEXT_PUBLIC_SITE_URL` to the Vercel env list in `.ai/USER-ACTIONS.md`, and consider failing or warning in production builds.
2. `src/three/scenes/walk.ts:398-420`, `src/components/sections/home/walk.tsx:153`: free mode is a full-screen overlay (`z-index: 1000`, page scroll locked), but it has no `role="dialog"` and no focus containment. Tab can reach the header and footer links hidden behind it. Escape and the Exit button do work.
3. `src/three/scene-root.tsx:45`: `releaseWhenFar` uses the same 300 px margin to mount and to release. Scrolling back and forth near that edge rebuilds the whole scene each time (walk is large). Use a wider margin for the release than for the mount.
4. `src/components/sections/home/process.tsx:26` and `walk.tsx:102`: `data-pinned` starts true and flips to false only after the scene reports `unsupported`/`error`. On devices without WebGL, the section shrinks from 420vh/540vh to `auto` while the visitor scrolls, so the page jumps. Using the `hasWebGL()` result before the first scroll would avoid it.
5. `src/three/scenes/process.ts:112`: a shadow-casting point light (6 cube faces at 1024²) plus a 2048² sun shadow, on every frame while pinned. This is expensive on mid-range phones whenever `quality.shadows` is true. Consider sun-only shadows.
6. `src/components/sections/home/faq.tsx:27`: the `askWa` button ("ask on WhatsApp") links to `/contact`, not to WhatsApp. Either the label or the link does not match.
7. `src/app/[locale]/page.tsx:17`: the home page sets no `description` (the other pages do).
8. `src/components/layout/lang-switch.tsx:28`: the hard-coded `EN العربية` in the `aria-label` mixes languages without `lang` markup. It satisfies label-in-name. A translation key would be cleaner.
9. `src/components/sections/home/featured.tsx:65`: apart from F3-01, the interval keeps running and re-rendering in hidden tabs and while off screen.

## Not verified

- I did not re-run the full Playwright suite, axe or the bundle check (lean rules). I rely on T-010's 140/140 and its axe and bundle results.
- No visual or brightness comparison with the design (B1-10 lamp parity was checked in code only).
- No real-GPU test of the WebGL context count or memory across repeated navigations. The claim rests on reading the code and on the batch-3 dispose probe.
- I did not check the walk free mode `position: fixed` against a transformed ancestor during a page transition at runtime. T-010 e2e covers entering free mode.
- I did not check `VERCEL_PROJECT_PRODUCTION_URL` behaviour on a real Vercel deployment (no project exists yet).
