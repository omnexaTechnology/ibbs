# FEAT-003 batch 3: fixes for review-batch3.md

Branch `feat/FEAT-003-pages`. Commits: `09dffd2` (R3-01, R3-02), `e240f69` (projects page fixes and parity), `e8a16c5` (home hero parity and fixes), plus the final commit with this file and the last card-grid tweak.

## Findings

| ID | Status | What was done |
|---|---|---|
| R3-01 | Done | `ProjectsExplorer` no longer reads the URL. The page renders `<Suspense fallback={<ProjectsExplorer .../>}>` with a small client wrapper `projects-explorer-from-url.tsx` that reads `?category=`. The static HTML holds the full "All" list. E2E: "R3-01: the server HTML already contains the project cards" (EN, AR). |
| R3-02 | Done | The category is now a prop derived from the URL (`replaceState` on a tab click feeds `useSearchParams`). A change resets the page. E2E: footer category link clicked while on `/projects` (EN, AR); unit test with a rerender. Search text and city/type selects are kept across tab changes (as before). |
| R3-03 | Done | The pin layer has `max-[900px]:hidden` (`HotspotImage` got a `layerClassName` prop), so hidden pins also leave the tab order. |
| R3-04 | Done | `.ui-scene canvas:focus-visible { outline-offset: -4px }`. |
| R3-05 | Left shown (lead's default) | One flag: `SHOW_PLACEHOLDER_LOGOS` in `src/content/placeholders.ts`. Set to `false` to hide the partners strip and the "Organizations we work with" section. |
| R3-06 | Done | Pins show only when the slide uses the design photo or an image with the same aspect ratio (within 0.01). Switch for all pins: `SHOW_HERO_PINS` in `src/content/hero-copy.ts`. |
| R3-07 | Done | The hero goes under the sticky header (`-mt-[92px]`) and is `100svh`, or `100svh - 42px` when the top bar is rendered (CSS `body:has([data-testid=topbar])`). E2E checks the hero bottom equals the viewport bottom at 1440x900. |
| R3-08 | Done | A page change scrolls the explorer top into view (smooth, or auto under reduced motion). Focus stays on the pressed button. |
| R3-09 | Done | Only slide 1 renders an `<h1>`; slides 2 to 4 use a `<p>` with the same classes. |
| R3-10 | Done | ICU plural `projects.pjCount` (EN and AR with all plural forms). |
| R3-11 | Done | Pager label `projects.pjPages` ("Pages" / "الصفحات"). |
| R3-12 | Done | `<dt>` first in the DOM, `flex-col-reverse` for the visual order. |
| R3-13 | Done | The test dispatches `webglcontextlost` after the rerender and asserts that `second` is called and `first` is not. |
| R3-14 | Done | `move` ends the drag when a mouse move arrives with `buttons === 0`. |
| R3-15 | Not done | Measure in T-010 first, as the review says (design also renders continuously). |
| R3-16 | Not done | Out of scope (motion e2e, other batch). It was not seen failing in this run. |

## Parity gaps

| Gap | Status |
|---|---|
| Hero pins | The design's final hero markup has no pins at any width (the `.hx-hs` CSS exists but no element). REQ-001 requires pins, so they stay on, hidden at <= 900 px (the design's rule), and behind `SHOW_HERO_PINS`. Lead's call. |
| Extra "Discuss Your Project" button | Removed. The design hero has one button ("Explore Our Projects"). |
| Thumbnail fan | Done: 3 cards of the other slides (`ui-fan-c`, positions from the design variables, a row at the bottom on mobile, RTL mirrored), click jumps to the slide. Added `thumbs`, `pill`, `showProgress` props to `Carousel`. |
| Pill dots, progress bar | Done (progress bar hidden <= 900 px like the design, and when auto-advance is off). |
| Mode box | Done: `ui/mode-box.tsx` uses next-themes `setTheme` (same store as the header toggle). Shown on home at > 900 px, and on inner-page heroes at >= 1340 px (design rule). |
| Text block x position | Container is now max 1280 + 32 px padding, so the text starts at x=112 at 1440. |
| "Spaces we furnish" grid | Replaced by "Organizations we work with" (`home/clients.tsx`): sector tabs and two opposing marquee rows. Data (6 sectors x 2 rows x 8, EN and AR) is in `src/content/clients.ts`, copied from the design `CL2`. Heading texts were already in messages. The sector deep links from the home page are gone (not in the design); the footer still links to the filtered list. |
| Projects: hero button | Done, anchors to the browse heading. |
| Projects: heading and lead layout | Done (two columns >= 1025 px). |
| Projects: tabs one scrolling row on mobile | Done (wrap from `md` up). |
| Projects: cards | Done: white number pill at the top end, title only at rest, details on hover or focus, always shown <= 1024 px or on touch; blue area chip with a thousands separator; 4:3.3 on phones, one column <= 640 px. |
| Projects: pager | Shown even for one page. |

## Not done

- About intro headline (about 54 px, two lines), the badge style and the round-photo shadow box (review "Visual parity" item 4): not in this task's list. Still open.
- Top contact bar, footer wordmark: FEAT-001 shell.

## Validation

- `npm run lint`, `npx tsc --noEmit`: pass.
- `npx vitest run`: 34 files, 274 tests, pass.
- `npm run build` (normal): pass. It is the build left in place.
- Playwright full suite (`E2E_FIXTURES=1` build): 115 passed, 4 failed in a 3-worker run (browser crash `EXCEPTION_ACCESS_VIOLATION` and timeouts under load, plus one AR-only test bug: button names are Arabic). After fixing the test, the four passed when re-run with 1 worker. The final run of `home.spec.ts` and `projects.spec.ts` on the normal build: 25 passed.
- Screenshots (home and projects, 1440 and 390, EN and AR) are in the scratchpad `b3fix` folder.
