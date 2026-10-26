# FEAT-005 — SEO, performance and launch

SPEC STATUS: DISCOVERY (2026-10-26)
Depends on FEAT-003 and FEAT-004. Questions: `questions.md`.

## Goal
The site is found in Google in both languages, loads fast, and goes live on the client's domain with real content.

## Requirements
- **REQ-001** Per-page metadata (title, description, OG image) in EN and AR, from Sanity with fallback to `siteSettings` defaults.
- **REQ-002** `hreflang` alternates between `/en` and `/ar`; canonical URLs.
- **REQ-003** `sitemap.xml` (all locales, all published projects) and `robots.txt`.
- **REQ-004** Structured data: `Organization` / `LocalBusiness` on home, `BreadcrumbList` on project pages.
- **REQ-005** Redirects: changed project slugs, and the old demo URL `ibss-demo.vercel.app` → new domain if requested.
- **REQ-006** Analytics (Vercel Analytics or GA4 — Q2).
- **REQ-007** Launch checklist: real contacts/socials in `siteSettings`, placeholders removed, legal pages approved, form delivery tested, domain + SSL, Sanity CORS origins set.

## Non-functional
- **NFR-001** Core Web Vitals "good" on all pages except the 3D-heavy home (see FEAT-003 NFR-001).

## Acceptance criteria
- **AC-001** Google Rich Results test passes for home and a project page.
- **AC-002** Sitemap lists every published project in both locales; drafts excluded.
- **AC-003** Launch checklist fully ticked and signed off by the user.

## Out of scope
Paid ads, Google Business Profile setup, content writing / translation.

## Open
See `questions.md`.
