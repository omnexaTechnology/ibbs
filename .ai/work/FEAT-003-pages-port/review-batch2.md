# FEAT-003 — Batch 2 review (batch-1 fixes, T-003 project detail, T-009 contact + legal)

Date: 2026-10-27. Scope: fix commits `d6a8511..9244c66` (on top of `7e74cd1`), plus task commits `eeff54d` (T-003) and `4eeca73` (T-009).
Reviewer worked read-only on source in `ibss-web-feat003` (branch `feat/FEAT-003-pages`, clean tree at `9244c66`). The only file written is this one.

## Verdict: READY

All 13 batch-1 findings are fixed or noted as agreed, and none of the fixes caused a regression. B1-01 is confirmed on a real build and at runtime. T-003 and T-009 meet their acceptance criteria. Lint, typecheck, unit tests, the build and the whole Playwright suite pass.

There are no blockers and no majors. Two minors are worth fixing before T-010 because they affect keyboard users (AC-005): a keyboard press can be ignored after a touch swipe (R2-01), and Shift+Tab can leave the lightbox (R2-02). Both are small, contained changes.

Counts: blocker 0, major 0, minor 6, nit 4 (10 total).

## Validation

| Check | Result |
|---|---|
| `npm run lint` | pass (exit 0, no output). |
| `npx tsc --noEmit` | pass (exit 0). |
| `npx vitest run` | pass: 31 files, 256 tests (batch 1: 28 / 232). |
| `npm run build` (`E2E_FIXTURES=1`, in the worktree) | pass (exit 0). 30 static pages, including 12 project-slug paths, contact, privacy and terms in EN and AR. |
| B1-01 bundle check (build) | Only `253kns01kajwq.js` (215 kB) and `26zl-r_g95kfv.js` (375 kB) contain `WebGLRenderer`. None of the 14 chunks referenced by `/en/e2e-fixtures.html`, the only page that uses `SceneRoot`, contains it, and no prerendered HTML references either Three chunk. Only the dynamic-import loader `05v7gf54nwfe_.js` points to them. |
| B1-01 bundle check (runtime, `next start` :3300) | `/en/e2e-fixtures` with the scene idle: no downloaded script contains `WebGLRenderer`. After scrolling the scene near, Three loads, so the lazy load still works. `/en/privacy`, `/en/contact` and `/ar/projects/exec-hq` load no Three. |
| B1-07 runtime | No ScrollTrigger chunk is downloaded on `/en/privacy`, `/en/contact`, `/ar/projects/exec-hq` or the fixture page (no section loads GSAP yet). |
| Playwright, relevant specs (`three`, `project`, `contact`) | 19/19 pass (`PORT=3300 E2E_REUSE=1`). |
| Playwright, full suite | 94/94 pass against the same server. Studio, revalidate and lead-privacy all ran locally with the worktree's `.env.local`. |
| Secret scan | Every server-only `.env.local` value (read token, write token, revalidate secret) was grepped across `.next/static`: none found. `site-settings.ts`, `sanity/content.ts` and `sanity/fetch.ts` all import `server-only`. |
| Probe: swipe-end click swallow | Confirmed (see R2-01). Fixture carousel at 390 px with touch: after a CDP touch swipe, the 1st Enter on dot 1 does nothing and the 2nd Enter works. |
| Probe: lightbox focus (B1-04) | On `/en/projects/exec-hq`, clicking the image keeps focus inside the dialog (root); ArrowRight then goes 1/4 → 2/4 and Esc closes it, so B1-04 is fixed. Shift+Tab from there leaves the dialog (see R2-02). |

## Batch-1 findings: status

| ID | Status | Verified how |
|---|---|---|
| B1-01 | fixed | `src/three/support.ts` contains no Three code. `scene-root.tsx` imports only `./support`, plus `import type` from `three` and `./scene-types`. Checked in the build manifests and at runtime (above). There are two guards: a vitest test that makes `three` and `./renderer` throw when imported, and the e2e network assertion in `three.spec.ts`. |
| B1-02 | fixed | `touch-pan-y` is on the carousel root. The e2e CDP touch-drag test passes. |
| B1-03 | fixed | The `mirror` prop flips the image wrapper and the pins together, and `dir` now affects only the tooltip text. The project page passes only `dir`, and e2e confirms EN and AR x positions match. The BR-002 wording in the spec is updated. |
| B1-04 | fixed | Root has `tabIndex={-1}`, and the browser probe confirms the keys work after a click on the image. See R2-02 for a gap that remains in the trap. |
| B1-05 | fixed | Tooltip ids now use a `useId()` prefix, and a test covers two instances. |
| B1-06 | fixed | Derived state during render resets the status to `loading` when the scene goes far. The far → near → far → near test passes. |
| B1-07 | fixed | The `gsap-state.ts` flag is checked in both effects, a unit test covers it, and the runtime check above confirms it. |
| B1-08 | fixed | The probe uses `webgl2` only. |
| B1-09 | fixed | The check is now `deviceMemory < 4`, with a test. Checking real devices is still open for T-010, as agreed. |
| B1-10 | noted | Notes added in `T-006.md` and `T-008.md`. |
| B1-11 | fixed | `toneMapping` passes from `SceneRoot` through `SceneCanvas` to `createRenderer`, with ACES as the default. `shadows` was left out on purpose because quality already controls it. Acceptable. |
| B1-12 | fixed | Decay is 0 when distance or decay is 0. Test added. |
| B1-13 | fixed, with an edge case | (a) The latest `onStatus` is kept in a ref, and an effect updates `aria-label`; neither has a test (R2-10). (b) `onClickCapture` swallows the click that ends a swipe. The edge case the fixer accepted is real and also hits the carousel, not only the lightbox (R2-01). |

## T-003 (project detail): OK

- AC met. The page has facts, challenge and solution, hotspots, scope, a gallery with lightbox, a FEAT-004 slot (`data-slot=project-form` with `data-project-slug`), related projects and a CTA. The client row is hidden when empty, with a unit test. `generateStaticParams` comes from `getProjectSlugs()`. An unknown slug calls `notFound()` and gets a localized 404 (checked in e2e).
- Sanity: the slug is passed as a GROQ parameter (`params: { slug }`), not concatenated into the query. The view model guarantees `cover` and at least one gallery image (BR-004 filter in `toProject`), so `project.cover.src` in the metadata is safe.
- Server/client: only `ProjectGallery` is a client component, and it receives public image data. Everything else is a server component, and Three is not loaded (e2e).
- RTL: the arrows use `start`/`end` with `rtl:-scale-x-100`, the counter is `dir="ltr"`, and pins are not mirrored (correct now). The 390 px page has no overflow in either locale.
- SEO: title, description, og:title, og:description and og:image (Sanity CDN, 1200 w) are set, plus hreflang alternates. See R2-04.

## T-009 (contact + legal): OK

- REQ-010 met. The page has the address (map link only through `safeHttpUrl`), phones (`tel:` digits only, `<bdi dir="ltr">`), emails, website, hours, the WhatsApp block (digits-only `wa.me`, encoded text) and the map block. Each block is hidden when its setting is empty, and a unit test covers the empty-production state. The FEAT-004 slot `data-slot=contact-form` is empty, and the grid collapses while it is empty. Social URLs are not checked with `safeHttpUrl` in `SocialLinks`, but the Sanity schema restricts them to http(s) (`siteSettings.ts:115`), so that is fine.
- REQ-011 met in substance: per-locale legal content with the same section structure in EN and AR (test). See R2-03 for the gap against the spec.
- All contact and legal components are server components, and settings come from a `server-only` module.

## Findings

| ID | Severity | File:line | Issue | Suggested fix |
|---|---|---|---|---|
| R2-01 | minor | `src/hooks/use-swipe.ts:28,36` | After a touch swipe the browser fires no click (the finger moved), so `swiped` stays true until the next `pointerdown`. The next keyboard activation inside the carousel or lightbox is then swallowed by `onClickCapture` + `stopPropagation`. Reproduced on the fixture carousel: touch swipe, focus dot 1, Enter does nothing, the 2nd Enter works. On a `<Link>` inside a slide, Next's client-side `onClick` is skipped, so the browser does a full page load instead. This affects touch devices with keyboards and switch users (AC-005). | Swallow only pointer-generated clicks: `if (!swiped.current) return; swiped.current = false; if (e.detail === 0) return; e.stopPropagation();`. You could also clear the flag in a `setTimeout(0)` from `onPointerUp`. Add a unit test: swipe, then a `click` with `detail: 0` reaches the button. |
| R2-02 | minor | `src/components/ui/lightbox.tsx:61-72` | With B1-04, clicking the image or backdrop focuses the dialog root (`tabIndex=-1`). The Tab trap only checks `first`/`last`, so Shift+Tab from the root goes to the page behind the modal. The probe on `/en/projects/exec-hq` confirmed focus ended outside the lightbox. Tab forwards works by luck, because the first button follows the root in the DOM. | In the Tab branch, treat the root as outside the cycle: `if (document.activeElement === root.current) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }`. Add a unit test. |
| R2-03 | minor | `.ai/work/FEAT-003-pages-port/spec.md:31` vs `src/content/legal/{en,ar}.ts` | REQ-011 (and the T-009 expected files) say MDX in `src/content/legal/{en,ar}/`. The implementation uses typed TS modules. The reason (no MDX dependencies, and the TOC is generated from the same data) is sound, but it is recorded only in the T-009 Result and a code comment. The spec still describes MDX, so whoever updates the legal text (FEAT-005 Q3) will look for files that do not exist. | Update REQ-011 and the T-009 expected-files list to the TS modules, and add one line on where to edit the text, or get explicit sign-off. No code change needed. |
| R2-04 | minor | `src/app/[locale]/projects/[slug]/page.tsx:40`; `src/app/[locale]/layout.tsx:31` | There is no `metadataBase`, so the hreflang links come out relative (`<link rel="alternate" hrefLang="ar" href="/ar/projects/exec-hq">`). Search engines expect absolute hreflang URLs. There is also no canonical or `x-default`, and contact and legal have no alternates at all. No FEAT-003 requirement covers SEO, so this does not block. | Set `metadataBase` in the root or locale layout from a site-URL env var (for example `NEXT_PUBLIC_SITE_URL`), and add one helper that returns `alternates` (canonical, languages, x-default) for every page. Can go to T-010 or the SEO feature. |
| R2-05 | minor | `src/components/sections/project/project-gallery.tsx:70` | Thumbnail buttons are named "Enlarge image 2" but they only select the slide; the lightbox does not open. Screen-reader users are told the wrong action. The stage button and the corner button are both also named "Enlarge image", so three kinds of control share one name. | Name thumbnails with the existing `ui.goToSlide` ("Go to slide {n}") or a new "Show image {n}" key. |
| R2-06 | minor | `src/content/legal/en.ts:5`, `ar.ts:5` | The legal text is the design's placeholder and is marked DRAFT only in a code comment. It will go live as if final unless FEAT-005 Q3 is closed first. | Make sure FEAT-005 Q3 (legal approval) is on the board or in the user actions as a launch blocker. No code change needed. |
| R2-07 | nit | `.ai/work/FEAT-003-pages-port/tasks/T-009.md` (Validation) | The required check "E2E: contact page shows a phone changed in Studio" is covered by a unit test with fixture settings plus an e2e check that the contact page matches the footer. The reason (production settings are empty, and e2e cannot edit Studio) is fair. | Add a manual check to T-010: change a phone in Studio, publish, confirm it on `/contact` after revalidation. |
| R2-08 | nit | `src/components/sections/legal/legal-page.tsx:53` | The `mailto:` link uses `ButtonLink external`, which adds `target="_blank"`. Some browsers and mail setups then open an empty tab. | Add a `newTab` flag separate from `external`, or render a plain `<a href="mailto:…">` with the same classes. |
| R2-09 | nit | `src/components/sections/legal/legal-page.tsx:26` | The table-of-contents `<nav aria-label={doc.title}>` has the same name as the H1, so a landmark list shows "Privacy Policy" for the navigation. | Label it "Contents" / "المحتويات" (new message key). |
| R2-10 | nit | `src/three/scene-canvas.tsx:36-45` | B1-13(a) (latest `onStatus` in a ref, and `aria-label` following `label`) has no test. If it regresses, the canvas keeps the old locale's name. | Add a small test to `scene.test.tsx`: rerender with a new `label` and assert the canvas `aria-label`; rerender with a new `onStatusChange` and assert the new callback is called. |

## Could not verify

- B1-09 on real hardware (mid-range Android, iPhone): open, already assigned to T-010.
- Brightness or tone parity of 3D scenes with the design (B1-10/B1-11): there are no real scenes yet (T-004, T-006, T-008).
- Screen-reader output (NVDA, VoiceOver) for the gallery, lightbox and contact cards: checked from the markup only.
- Visual parity with the design at 1440 px and 390 px (NFR-003): not compared side by side. Only overflow was checked, by e2e.
- The editor's Studio → revalidate → contact phone flow end to end (R2-07).

Note: this review built `.next` in the worktree with `E2E_FIXTURES=1` and ran `next start` on port 3300 (now stopped). Rebuild without the flag before any production-like check.
