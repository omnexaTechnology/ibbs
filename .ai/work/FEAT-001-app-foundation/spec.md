# FEAT-001 — App foundation: Next.js, EN/AR + RTL, theme, layout shell

SPEC STATUS: READY_FOR_IMPACT_ANALYSIS (2026-10-26)
Source: `design-reference/Main.dc.html` (helmet `<style>` tokens, header/footer markup, `T` strings, `go()` transitions). Questions: `questions.md`.

## Goal
A Next.js app that reproduces the design's shared shell in English and Arabic, so FEAT-003 can drop pages into it and FEAT-002 can mount Sanity Studio.

## Confirmed decisions
- D1 Next.js App Router, deployed on Vercel (user, 2026-10-26).
- D2 Sanity CMS with Sanity Studio as the dashboard (user, 2026-10-26).
- D3 Follow the Omnexa Learn client stack: next-intl (EN + AR, RTL), Tailwind + shadcn/ui, GSAP, strict TypeScript (user, 2026-10-26).
- D4 All page text and UI strings live in next-intl message files (`messages/en.json`, `messages/ar.json`), seeded from the design's `T` object and section copy — only projects and hero images are in Sanity (FEAT-002 D2).

## Requirements
- **REQ-001** Locale routing `/en/...` and `/ar/...`; `<html lang dir>` set per locale (`ar` → `dir="rtl"`). Root `/` redirects to the default locale.
- **REQ-002** Routes: `/[locale]`, `/[locale]/about`, `/[locale]/projects`, `/[locale]/projects/[slug]`, `/[locale]/contact`, `/[locale]/privacy`, `/[locale]/terms`. Replaces the design's single-page `go(view)` state.
- **REQ-003** Language switch keeps the current page (and project slug).
- **REQ-004** Design tokens from the design's `:root` (navy `#1E2E5A`, blue `#2E6EB5`, cyan `#4CA6CB`, green `#8BC34A`, cream `#F5F2EC`, night `#0B1120`, night-2 `#131D36`, + RGB variants) as CSS variables; `.site` light/dark surface variables preserved.
- **REQ-005** Fonts Montserrat (EN) and Alexandria (AR), weights 400–700, self-hosted via `next/font`.
- **REQ-006** Light/dark theme toggle as in the design; choice remembered per visitor; no flash of the wrong theme on load.
- **REQ-007** Header: logo, nav (Home, About, Projects, Contact), active state (Projects also active on a project page), scrolled state after 24px, mobile menu, language + theme toggles.
- **REQ-008** Footer: main links, project categories (link to projects filtered by category), privacy/terms, social icons and contact details from Sanity Site settings (FEAT-002 REQ-005b).
- **REQ-009** Floating WhatsApp button; number and prefilled message per locale from Sanity Site settings (default text from the design's `waText`).
- **REQ-010** Page transition between routes matching the design's close → swap → open sequence (~1.15s / 2.4s); skipped under `prefers-reduced-motion`.
- **REQ-011** Custom cursor on pointer devices only (`setupCur`); off for touch and reduced motion.
- **REQ-012** UI strings (labels, buttons, aria text) for both locales.
- **REQ-013** Vercel project + preview deployments per branch.

## Business rules
- **BR-001** Arabic is a full locale, not a translation fallback: every visible string has an AR value; RTL mirrors layout and directional icons.
- **BR-002** Reduced motion disables transitions, cursor effects and auto-advancing animation everywhere.

## Non-functional
- **NFR-001** Strict TypeScript; lint + build pass in CI.
- **NFR-002** Shell (no 3D) LCP < 2.5s on a mid-range phone on 4G.
- **NFR-003** Keyboard-accessible nav, menu and toggles; visible focus.

## Acceptance criteria
- **AC-001** `/ar/about` renders RTL with Alexandria; `/en/about` LTR with Montserrat.
- **AC-002** Switching language on `/en/projects/exec-hq` lands on `/ar/projects/exec-hq`.
- **AC-003** Theme persists across reloads with no flash.
- **AC-004** Reduced-motion users get no page transition and no custom cursor.
- **AC-005** Push to a branch creates a Vercel preview URL.

## Assumptions
- A1 Design tokens become Tailwind theme colours backed by the CSS variables, so light/dark switches the variables only.
- A2 Default locale is English — pending Q2.

## Out of scope
Page content and sections (FEAT-003), CMS (FEAT-002), forms (FEAT-004), SEO metadata (FEAT-005).

## Open
See `questions.md`.
