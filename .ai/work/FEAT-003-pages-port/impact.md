# FEAT-003 — Impact analysis

Date: 2026-10-26.

## Summary
The largest item: 7 routes, ~25 sections and 5 Three.js experiences ported from `design-reference/Main.dc.html`, rendered from Sanity (projects, hero images, settings) and from code (all other copy). Most risk is in 3D and animation.

## Affected areas
| Area | Effect |
|---|---|
| Dependencies | `three` 0.186.x (+ `@types/three`), `gsap` 3.14 + `@gsap/react` (useGSAP), `yet-another-react-lightbox` or a small own lightbox (decide in T-001). Bootstrap Icons used by the design (`bi-*`) → map to lucide icons where an equivalent exists, else inline SVG. |
| 3D | The design's `IBSS3D` kit (procedural furniture: desk, chairs, tables, sofas, plants, glass, logo wall…) + model data `assets/cd80e49e…json` (bookcases etc.) → `src/three/kit.ts`, `src/three/models.json`. Scenes: home process (`setupScene`/`applyStage`), walk-through (`setupWalk`, ~400 lines incl. picking, markers, tooltips), about build (`initAb3d`), projects floor (`initPj3d`), CTA + lamp (`setupCta3d`, `setupLamp`). Each becomes a client component loaded with `next/dynamic({ ssr: false })` when near the viewport. |
| Animation | GSAP + ScrollTrigger from npm; triggers refreshed after each route change (design does `ScrollTrigger.refresh()` in `go()`). Counters, carousels, accordion, kinetic band, process carousel. |
| Content (code) | `messages/{en,ar}.json` for section copy; `src/content/{process,materials,testimonials,faqs,sectors,stats,hero-copy}.ts` for structured copy (en/ar). |
| Content (Sanity) | `projects`, `projectBySlug`, `featuredProjects`, `heroSlides`, `siteSettings` queries (FEAT-002). |
| Images | `next/image` with the Sanity loader; static design images for sections not in Sanity → `public/images/`. |
| Legal | Privacy and terms as MDX per locale in code (`src/content/legal/{en,ar}/{privacy,terms}.mdx`) — **changed from "Sanity rich text"** (conflicts with FEAT-002 D2). |
| Contact page | Contacts, hours, address, map link from `siteSettings`; form slot filled by FEAT-004. |

## Files/modules likely involved
`src/app/[locale]/**/page.tsx`, `src/components/sections/{home,about,projects,project,contact}/*`, `src/components/ui/{hotspot,carousel,counter,lightbox,accordion,section-heading}.tsx`, `src/three/{kit,materials,renderer,scene-root}.ts(x)`, `src/three/scenes/{process,walk,about-build,projects-floor,cta,lamp}.tsx`, `src/hooks/{use-in-view,use-gsap-refresh}.ts`, `src/content/**`, `public/images/**`.

## Dependencies
- FEAT-001 (shell, routes, tokens, messages), FEAT-002 (queries, types, seed so pages have data).
- FEAT-004 provides the forms on contact and project pages (slots can ship first).

## Risks
- **R1 (high)** Mobile performance with 5 WebGL scenes: one renderer per scene in the design; on one page at most two are visible, but GPU memory and JS size are real costs. Mitigation: one scene mounted at a time per viewport, dynamic import per scene, dispose on unmount (as the design does), DPR cap 1.5–2, no shadows on low-end (`navigator.hardwareConcurrency`/`deviceMemory`).
- **R2 (high)** Walk-through mode is the most complex code (scroll-driven camera, picking, outlines, tooltips, markers) and the hardest to keep working in RTL and on touch.
- **R3 (medium)** The design's logic is one big class with shared state; splitting into React components may change timing (e.g. stage sync between process carousel and 3D). Port per section with side-by-side comparison against https://ibss-demo.vercel.app.
- **R4 (medium)** Design may still change in Claude Design (Q2). Late changes mean diffing a new export against `design-reference/`.
- **R5 (low)** Design keeps `[Client name]` and sample testimonials; BR-003 hides placeholders → some sections may look empty at launch.

## Unaffected areas
Studio and schemas (FEAT-002), form handling (FEAT-004).

## Open questions
Non-blocking: design final? map embed? related vs next/prev?

## Recommended implementation order
UI primitives → 3D core (kit + scene wrapper) → Project detail + Projects list (they prove the Sanity path end to end, as recommended to the user) → Home (3 slices) → About → Contact + legal → parity/perf/a11y pass.

IMPACT STATUS: READY_FOR_PLAN
