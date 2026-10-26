# FEAT-003 — Pages: port the 7 views, animations and 3D, driven by Sanity

SPEC STATUS: READY_FOR_IMPACT_ANALYSIS (2026-10-26)
Source: `design-reference/Main.dc.html` markup (sections by class: `hx`, `pt3`, `ab1`, `p3`, `wk`, `cl2`, `cta1-wrap`, `sk-hero`, `ab-stats`, `pdh`, `pdx`, `lg`, `ctf`, `ctm`) and logic (`IBSS3D`, `setupScene`, `setupWalk`, `initAb3d`, `initPj3d`, `setupLamp`, `setupCta3d`, `loadGsap`). Questions: `questions.md`.

## Goal
Every page looks and behaves like the approved design in both languages, with content coming from Sanity (FEAT-002).

## Confirmed decisions
- D1 The design export is a reference mockup; values (colours, sizes, spacing, radii, shadows) are replicated, the markup is not copied wholesale (`design-reference/README.md`).
- D2 Keep all 3D experiences: home process scene, office walk-through, about build, projects floor, CTA/lamp (user, 2026-10-26).
- D3 Content source: projects, hero images and contact/social settings from Sanity (FEAT-002); everything else (section text, process stages, materials, testimonials, FAQs, stats, sectors) from next-intl messages and TS constants in code (FEAT-002 D2, D4).

## Requirements
### Home `/[locale]`
- **REQ-001** Hero carousel (4 slides) with auto-advance, dots, image hotspots (mirrored in RTL).
- **REQ-002** Partners strip (seamless loop), kinetic words band, about intro with stats counters (count up on scroll).
- **REQ-003** Process section: 4 stages, carousel + 3D scene stages (`applyStage`) with callouts.
- **REQ-004** Office walk-through (`wk`): scroll to walk, look with cursor, blue markers with details, skip / explore freely.
- **REQ-005** Featured projects accordion (desktop) / auto-advancing row (phone), with hover "peek" preview.
- **REQ-006** Materials picker (6), testimonials slider, FAQ accordion, clients section, CTA with 3D.
### About `/[locale]/about`
- **REQ-007** Hero, who we are, vision / strengths / mission tabs, stats, 3D build of reception + boardroom (8 steps, evening light), clients, CTA.
### Projects `/[locale]/projects`
- **REQ-008** 3D open-plan floor (drag / arrow keys), category filter tabs with counts, search, city filter, grid with 2 rows per page and pagination; `?category=` deep link from the footer.
### Project `/[locale]/projects/[slug]`
- **REQ-009** Hero with facts (sector, city, area, days, year, client), challenge / solution, image hotspots, scope list, gallery with lightbox, "similar project" CTA, next/prev or related projects.
### Contact `/[locale]/contact`
- **REQ-010** Direct contacts (phone, email, website, hours), WhatsApp block, contact form (FEAT-004), map/location block (`ctm`).
### Legal `/[locale]/privacy`, `/[locale]/terms`
- **REQ-011** Content from MDX files per locale in code (`src/content/legal/{en,ar}/`) — not Sanity, per FEAT-002 D2 (changed 2026-10-26 in impact analysis).

### Cross-cutting
- **REQ-012** Three.js scenes load client-side only, lazily when near the viewport, paused off-screen (IntersectionObserver), disposed on unmount — as in the design.
- **REQ-013** Fallback image when WebGL is unavailable (`no3d` state in the design).
- **REQ-014** GSAP + ScrollTrigger installed from npm (not cdnjs); triggers refreshed after route change.

## Business rules
- **BR-001** Reduced motion: no auto-advance, no scroll-scrubbed animation, 3D shows its final state without animation.
- **BR-002** RTL mirrors carousels, hotspot x-positions (`100 - x`) and scroll directions.
- **BR-003** Placeholder content (stats note, `[Client name]`, sample testimonials) is not shown on the live site unless the client provides real values.

## Non-functional
- **NFR-001** Mobile Lighthouse performance ≥ 80 on home with 3D, ≥ 90 on other pages.
- **NFR-002** 3D code split per scene; nothing from Three.js in the initial JS of pages without 3D.
- **NFR-003** Visual parity with the design at 1440px and 390px widths, EN and AR.

## Acceptance criteria
- **AC-001** Side-by-side with the design at 1440px and 390px, each page matches in EN and AR.
- **AC-002** Changing a project in Studio changes the projects list, detail page and home accordion; replacing a hero image changes the home hero.
- **AC-003** With WebGL disabled, every 3D section shows its fallback and the page still works.
- **AC-004** With reduced motion on, no auto-moving element remains.
- **AC-005** Keyboard: carousels, tabs, accordion, lightbox and 3D rotation (arrow keys) work without a mouse.

## Assumptions
- A2 The procedural `IBSS3D` kit and `cd80e49e…json` model data are ported as TypeScript modules, not edited in Sanity.

## Out of scope
Editing 3D scenes in Sanity, new pages not in the design, blog/news.

## Open
See `questions.md`.
