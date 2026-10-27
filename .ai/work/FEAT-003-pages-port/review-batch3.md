# FEAT-003 — Batch 3 review (R2 follow-ups, T-005 home part 1, T-004 projects list)

Date: 2026-10-27. Scope: `c975ed5` (R2 follow-ups), `c6c1503` (T-005), `4def6dc` (T-004), on branch `feat/FEAT-003-pages`.
The reviewer worked read-only on source in `ibss-web-feat003`. The only file written is this one. Probes and screenshots ran against a local `next start` on port 3300 (now stopped). The live design demo (https://ibss-demo.vercel.app) was used for the visual comparison, because `Main.dc.html` is not in `ibss-demo/` (only `index.html` is there).

## Verdict: FIX_REQUIRED

The R2 follow-ups are fixed. The hero, the cover-scaled pin box, the 3D floor lifecycle and the B1-01 lazy-load guard all hold up on a real build. Two majors on the projects page block READY. Both are small, contained fixes:

- **R3-01:** the project list is not in the prerendered HTML. `useSearchParams` inside a `<Suspense>` with no fallback makes the whole list render on the client only. The route stays static (●), but its HTML has no cards and no project links.
- **R3-02:** `?category=` is read only once, on mount. A footer "Our projects" link clicked while already on `/projects` changes the URL but not the tab or the list. This was reproduced.

Counts: blocker 0, major 2, minor 6, nit 8 (16 total).

## Validation

| Check | Result |
|---|---|
| `npm run lint` | Pass (exit 0). |
| `npx tsc --noEmit` | Pass (exit 0). |
| `npx vitest run` | Pass: 34 files, 273 tests (batch 2: 31 / 256). |
| `npm run build` (normal) | Pass. 30 static pages. `/[locale]` and `/[locale]/projects` are SSG (●) in EN and AR. |
| `E2E_FIXTURES=1 npm run build` | Pass. |
| Playwright, full suite (`PORT=3300 E2E_REUSE=1`) | 112 passed, 1 failed. The failure is `motion.spec.ts:6` (page transition): the URL was already `/en/about` after the 500 ms wait. Running `motion.spec.ts` alone with `--repeat-each=3` passed 24/24, so the test is flaky under parallel load (R3-16). It is outside this batch's scope. |
| Normal build restored | Yes. `npm run build` was run again without the flag at the end, and the server is stopped. |
| B1-01 (build) | Only `1ehtcnonmdcal.js` and `26zl-r_g95kfv.js` contain `WebGLRenderer`. None of the 15 chunks referenced by the prerendered `en/projects.html` contains it. |
| B1-01 (runtime) | Three loads after hydration, once the floor is within the 300 px root margin. The floor sits just under the page hero, so this happens on first view, as expected. |
| 3D dispose on navigation | `/en/projects`, then a client-side link to `/en/about`: 2 WebGL contexts were created (the support probe and the renderer), and 2 `loseContext` calls were made. 0 canvases were left and there were no console errors. Same result with reduced motion. |
| Reduced motion (floor) | 0 `requestAnimationFrame` calls in 2 s while idle (on-demand mode). With motion allowed: about 43 frames/s, continuous (R3-15). |
| Hero geometry (1440×900, 390×844, EN/AR) | On every slide, the box aspect equals the image aspect: 1.395, 2.037, 2.894 and 1.761. The box covers the hero, and pins sit at exactly x%/y% of the box. In AR the pins are at `100 − x` inside a `-scale-x-100` wrapper, and the screenshot shows the image flipped with the pins still on the plant, desk and lights. No horizontal overflow. |
| Hero headings | 4 `<h1>` in the DOM and in the static HTML. 3 are inside `inert` slides, so 1 is exposed to assistive tech (R3-09). |
| Projects search / filters | From `/en/projects`, the Arabic term "المكاتب" matches 4 of 6 projects, and "Riyadh" matches 3. `?category=bogus` falls back to "All". The empty state shows. No JS: 0 cards (R3-01). |
| CLS (3 s after load, 1440) | `/en/projects`: 0. `/en`: 0. The list appears below the fold, so it does not count as a layout shift. |
| BR-003 (stats) | `home-stats` is not rendered (all four figures are `confirmed: false`). The placeholder note is never shown. |

## R2 follow-ups: status

| ID | Status | Notes |
|---|---|---|
| R2-01 | Fixed | `use-swipe.ts:39` lets `detail === 0` clicks through. A unit test covers it. A mouse click always comes after a `pointerdown` that resets the flag, so real swipe-end clicks are still swallowed. |
| R2-02 | Fixed | `lightbox.tsx:64-69`: from the dialog root, Tab and Shift+Tab re-enter the cycle at the matching end. Unit test added. |
| R2-03 | Fixed | REQ-011 in `spec.md` now names the TS modules and says where to edit the text. |
| R2-04 | Deferred (agreed) | Listed in `T-010.md`. |
| R2-05 | Fixed | Thumbnails use `ui.goToSlide`. |
| R2-06 | Covered | `BOARD.md` lists FEAT-005 Q3 (legal text) as needed before launch. |
| R2-07 | Deferred (agreed) | Manual Studio check listed in `T-010.md`. |
| R2-08 | Fixed | The test shows the `mailto:` link has no `target`. |
| R2-09 | Fixed | The contents nav is labelled "Contents" / "المحتويات". |
| R2-10 | Partly fixed | The `aria-label` follow is tested. The second half (the new `onStatus` callback is the one called) is not asserted (R3-13). |

## T-005 (home part 1): acceptance criteria

- **Hero (REQ-001): met.** It has 4 slides, images from Sanity with the design default per slot (BR-006, unit test), texts and pins from `hero-copy.ts`, auto-advance, dots, and a counter. `mirror={rtl}` is correct: image and pins flip together, and tooltips use `dir` for text only. The cover-scaled aspect box keeps the pins on their detail at both widths, because the box is never cropped by `object-fit`. Only the hero section clips it. The cost: on a portrait phone most pins land outside the visible crop (R3-03).
- **Partners loop, kinetic band, counters (REQ-002): met.** Both loops stop under reduced motion (`ui-mq-track { animation: none }`). The duplicate copy is `aria-hidden`. The counter component is wired in, but the band is hidden by BR-003, so it is not visible yet.
- **BR-003 (stats): met.** See R3-05 for the partner placeholders, which conflict with this rule.
- **Carousel a11y (4 h1s + `inert`):** acceptable for assistive tech, because only the active slide's h1 is in the accessibility tree and `inert` also removes the inactive CTAs and pins from the tab order. It is not ideal for crawlers or the no-JS document outline, which see four h1s. A better option is in R3-09.

## T-004 (projects list): acceptance criteria

- **3D floor (REQ-008): met.** It turns by drag (with inertia), Left/Right arrows and Home, and the canvas is focusable. It loads lazily through `SceneRoot`, falls back to the isometric drawing without WebGL (e2e), is disposed on unmount and navigation (probe above), and follows reduced motion (no loop, a still frame on input). The focus ring is not visible (R3-04).
- **Tabs with counts, search, city filter, 2 rows per page, pagination: met** functionally. Search covers EN and AR titles, sector labels and city names. The empty state works, and the page resets on every filter change. On mobile, see R3-08.
- **`?category=` deep link: partly met.** It works on a fresh load and with `replaceState` on tab clicks. It does not work for client-side navigation within `/projects` (R3-02), and the list is not in the static HTML (R3-01).
- **RTL:** chevrons are mirrored, tabs wrap from the right, and there is no overflow at 390 (e2e and probe).

## Findings

| ID | Severity | File:line | Issue | Suggested fix |
|---|---|---|---|---|
| R3-01 | major | `src/app/[locale]/projects/page.tsx:45-47`; `src/components/sections/projects/projects-explorer.tsx:54` | `useSearchParams()` in a `<Suspense>` with no fallback makes the explorer bail out to client rendering at build time. `en/projects.html` contains `<!--$!--><template data-dgst>` where the list should be: 0 `project-card`s, no filter bar, no links to the project pages. Crawlers that do not run JS, no-JS users and the first paint all get a page with no projects. The "page stays static" claim in T-004 is true for the route, but not for its main content. | Pass the category in as a prop. `ProjectsExplorer({ initialCategory })` must not call `useSearchParams`. Add a 5-line `ProjectsExplorerFromUrl` client wrapper that reads the param and renders `<ProjectsExplorer key={param} initialCategory={…}/>`. The page renders `<Suspense fallback={<ProjectsExplorer initialCategory="all" …/>}><ProjectsExplorerFromUrl …/></Suspense>`, so the static HTML holds the full "All" list. Add an e2e test with `javaScriptEnabled: false` that expects 6 (or `min(8, n)`) cards. |
| R3-02 | major | `projects-explorer.tsx:54-55, 78-85` | `category` is `useState(initialFromParam)`, so it is read only on mount. The footer's "Our projects" links (`footer.tsx:64`, on every page) are client `<Link>`s to `/projects?category=…`. On `/projects` they do not remount the page. Probe: on `/en/projects?category=exec`, clicking the footer "Schools" link changes the URL to `?category=school`, but `tab-exec` stays pressed and the list is unchanged. | Key the explorer by the param (`key={param ?? "all"}` in the wrapper from R3-01, which also resets the page and filters), or derive `category` from `useSearchParams()` and only write the URL in `pickCategory`. Next syncs `useSearchParams` with native `history.replaceState`. Add an e2e test that clicks a footer category link while on `/projects`. |
| R3-03 | minor | `src/components/sections/home/hero.tsx:33-38`; `src/components/ui/hotspot.tsx:62` | The design hides hero pins at ≤ 900 px (`@media (max-width:900px){.hx-hs{display:none}}`). The app shows them. Because the box is cover-scaled and centred, most pins at 390 px are outside the visible crop: on slide 1, 2 of 3 are off-screen; on slides 2 and 3, all 3 are. They are still in the tab order, so keyboard users land on invisible buttons (WCAG 2.4.7 / 2.4.11). | Add a `className` (or `pinsClassName`) to the hotspot layer and pass `max-[900px]:hidden` from the hero, which matches the design. Hidden pins then also leave the tab order. |
| R3-04 | minor | `src/styles/ui.css:125`; `src/app/globals.css:180` | The 3D canvas is focusable (`tabIndex=0`), but the global ring (`outline-offset: 3px`) is drawn outside the canvas, and `.ui-scene { overflow: hidden }` clips it. Verified by screenshot: no visible focus on the projects floor. The design has `.pj3d:focus-visible{outline:2px solid #2E6EB5;outline-offset:-4px}`. | `.ui-scene canvas:focus-visible { outline-offset: -4px; }`. This also fixes every later scene. |
| R3-05 | minor | `src/components/sections/home/partners.tsx:6-15, 26-41` | The partner strip shows eight generic marks labelled "Partner logo" as a real list, so a screen reader reads "Partner logo" eight times. BR-003 hides placeholder content. FEAT-002 Q3 groups "partner and client logos" with the stats ("launch with placeholders hidden?"), and the stats are hidden. The two placeholders are handled inconsistently. T-005 flags this as a question but ships the strip. | Treat partners like stats. Keep a `partners` list in `src/content/` (logo + name + `confirmed`) and render nothing while it is empty, or record the lead's explicit sign-off for showing the placeholders in the spec. |
| R3-06 | minor | `hero.tsx:24-38`; `src/content/hero-copy.ts:116-117` | The hotspot positions are authored for the design default photos, but the photos are editable in Sanity (D5, AC-002 "replacing a hero image changes the home hero"). After an editor replaces a slide image, the pins and tooltips ("Indoor planters", "Leather meeting chairs") point at arbitrary spots on the new photo. | Show code hotspots only when the slide image is the design default. Keep the default asset's dimensions or `_ref` in `heroCopy` and compare, or add a `showHotspots` boolean to the hero slide schema. Note the rule in the Studio field description. |
| R3-07 | minor | `hero.tsx:76` | The hero is `h-[calc(100svh-134px)]`. 134 px is the design's 52 px top bar plus the 82–92 px header, but the app has no top bar. At 1440×900 a strip of about 42 px of cream page shows below the hero (screenshot `app-home-1440-en-top.png`). The design fills the hero to the bottom of the viewport. | Subtract only the real header height (a CSS variable set by the header, or `92px` / the mobile value). The design's mobile rule is `calc(100svh - 42px)`. |
| R3-08 | minor | `projects-explorer.tsx:181-195` | A page change neither scrolls nor moves focus. At 390 px the grid is one column of eight 4:5 cards (about 3,500 px), so after "2" the user is left at the bottom of page 2 and has to scroll up. | On page change, scroll the grid's heading into view (`behavior: reduced ? "auto" : "smooth"`) and keep focus on the pressed button. |
| R3-09 | nit | `hero.tsx:57` | There are four `<h1>`s (see the T-005 note). They are fine for assistive tech because of `inert`, but the static outline has four h1s, and the page's h1 changes as slides rotate. | Make only slide 1's heading an `h1`. Render slides 2–4 as `<p>` (or `h2`) with the same classes. Alternatively, add one `sr-only` h1 outside the carousel and render all slide headings as `p`. |
| R3-10 | nit | `projects-explorer.tsx:143-145` | The live region announces a bare number ("4"). | Use an ICU message: `"{n, plural, one {# project} other {# projects}}"` (and the AR plural forms). |
| R3-11 | nit | `projects-explorer.tsx:180` | The pager `nav` reuses `pjT1` ("Browse projects by"), the same name as the category group, so the landmark list is ambiguous. | Label it "Pages" / "الصفحات" (new key). |
| R3-12 | nit | `src/components/sections/home/stats.tsx:19-22` | Each `<dl>` group puts `<dd>` before `<dt>` in the DOM (`order-first` only reorders them visually). That breaks the `dl` content model. It is dormant while every figure is unconfirmed. | Put `<dt>` first in the DOM and use `flex-col-reverse` (or `order-last` on the `dt`). |
| R3-13 | nit | `src/three/scene.test.tsx` (R2-10 test) | The test asserts the canvas `aria-label` after a rerender. The `second` callback is created but never asserted, so the "latest `onStatus`" half of B1-13a is still untested. | Trigger a status after the rerender (for example, dispatch `webglcontextlost` on the canvas) and assert that `second` is called and `first` is not. |
| R3-14 | nit | `src/three/scenes/projects-floor.ts:108-128` | Press on the canvas, move less than 4 px, leave the canvas and release outside it: pointer capture was never taken, so `up` never fires and `drag` stays set. Moving the mouse over the canvas later turns the floor with no button pressed. | In `move`: `if (!drag) return; if (e.buttons === 0) { up(); return; }`. |
| R3-15 | nit | `src/three/scene-canvas.tsx:88`; `projects-floor.ts:155-163` | With motion allowed, the floor renders continuously (about 43 frames/s measured) even when idle, with shadows on. The design does the same, but NFR-001 asks for ≥ 90 on non-home pages. | Measure it in T-010. If it costs Lighthouse points, let `frame()` report "settled" (`|vel| < 1e-4 && |target − cur| < 1e-4`) and switch the loop to on-demand until the next input. |
| R3-16 | nit | `e2e/motion.spec.ts:16-18` | Out of this batch's scope: the transition test asserts the URL is unchanged 500 ms after a click that only waited for the overlay. Under full parallel load the swap was already done, so the test failed once and then passed 24/24 when run alone. | Assert "still old URL" right after `overlay` is visible (no fixed wait), or run `motion.spec.ts` serially. |

## Visual parity (1440 / 390, EN / AR, against https://ibss-demo.vercel.app)

Screenshots are in the reviewer's scratchpad (not committed). These are the most visible gaps, by severity. The first three matter most.

1. **High: hero composition.** The design's hero has the fan of three thumbnail cards (bottom end at 1440, a row at 390), the "Mode" light/dark box, a typewriter caret, a progress bar and pill-style dots. The app shows ring dots, a second ghost CTA ("Discuss Your Project", not in the design), and visible hotspot pins (the design shows none at 1440 or 390). The design's text block also starts at x≈112 (app: 72). The fan cards and mode box are known gaps (T-005 Result), but the extra CTA and the pins are not listed. Pins are required by REQ-001, so the lead should decide between spec and design.
2. **High: "Sectors" section is not the design's section.** The design's `cl2` ("Organizations we work with") has sector chips on the left and a client-logo grid on the right. The app renders a 3×2 card grid titled "Spaces we furnish" with the `cl2` eyebrow. Avoiding the `[Client logo]` placeholders (BR-003) is reasonable, but the layout is invented and T-005 does not record it as a gap.
3. **Medium: projects page layout.**
   - The design hero has an "Explore Our Projects" CTA. The app has none.
   - "Browse projects by / sector and location." is two lines on the left with the lead paragraph on the right in the design. The app shows one full-width line with no lead.
   - On mobile the design's category tabs are one horizontally scrolling row. The app wraps them into 4 rows (AR 390) and pushes the grid down.
   - The design's cards are cleaner: a white number pill at the top end, only the title at rest, and the area chip in blue with a thousands separator ("1,850 m²"). On mobile they are shorter and landscape. The app shows all meta at rest with a green "1850 m²" chip in 4:5 portrait.
   - The design shows the pager even with one page. The app hides it.
4. **Medium: about intro headline.** The app's H2 is about 84 px across three lines. The design's is about 54 px across two lines ("Our work reflects our / approach."). The badge in the design is stripes plus blue uppercase text, not a bordered pill. The round photos in the app show a square shadow box behind the circle (the shadow is on the un-rounded wrapper).
5. **Low:** the hero gap strip (R3-07). The top contact bar, footer contact column and big wordmark are missing, but they belong to the FEAT-001 shell, not this batch. The kinetic band and partners strip match closely.

## Could not verify

- Whether the design intends hero hotspots at all in its final `hx4` variant: the CSS has an unconditioned `.hx-hs{…display:none}` rule next to the ≤ 900 px one, and no pins are visible at 1440. This needs the lead's call (it affects REQ-001 vs D1).
- The design's 3D floor did not render in headless Chromium on the demo (blank under the projects hero), so floor framing, brightness and tone were compared against the code (`initPj3d` values), not against a screenshot.
- AC-002 for the projects list after a real Studio edit (not done: never write to real Sanity).
- Screen-reader output (NVDA, VoiceOver) for the hero carousel, tabs and pager: checked from the markup and the accessibility tree only.
- Real-device touch drag and GPU cost of the floor (T-010).
- Full-page screenshots of the app show sections below the fold as blank. This is an artefact of `animation-timeline: view()` reveals in full-page capture, not a bug. Each section was checked in its own viewport shot.
