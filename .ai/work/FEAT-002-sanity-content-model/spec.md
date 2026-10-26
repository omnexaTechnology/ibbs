# FEAT-002 — Sanity content model, embedded Studio, seed content

SPEC STATUS: READY_FOR_IMPACT_ANALYSIS (2026-10-26)
Source: `design-reference/Main.dc.html` → `renderVals()` (`PR` projects, `CATS`, `scopeLib`, `SL` hero slides). Decisions: below. Questions: `questions.md`.

## Goal
The client manages **projects**, the **home hero images** and **contact & social settings** in Sanity Studio, in English and Arabic, without a developer. Leads from the website forms are also visible in the Studio (FEAT-004). All other content stays in code.

## Confirmed decisions
- D1 Sanity Studio is the dashboard (user, 2026-10-26).
- D2 Editable in Studio: **projects** and **hero section images** only (user, 2026-10-26). Page text, FAQs, testimonials, materials, process stages, about text, stats, contacts and social links stay in code (next-intl messages / TS constants).
- D3 Form submissions are emailed **and** saved in Sanity as leads (user, 2026-10-26) — schema here, writing in FEAT-004.
- D4 Contact details and social links are editable too, in a Site settings singleton (user, 2026-10-26). This amends D2.
- D5 Hero: the editor only replaces the images of the 4 existing slides; slide texts and hotspots stay in code. Advanced hero options (hotspots, slide count) are deferred (user, 2026-10-26).
- D6 The Sanity project lives in Omnexa's Sanity account (user, 2026-10-26).

## Requirements
### Studio
- **REQ-001** Studio embedded in the Next.js app at `/studio`, protected by Sanity login.
- **REQ-002** Desk structure: **Projects** · **Hero images** · **Site settings** · **Leads** (read-only list, newest first).
- **REQ-003** Every visitor-facing text field has `en` and `ar` values side by side (field-level localisation).

### Document types
- **REQ-004** `project`: title (en/ar), slug (shared by both locales), category (one of the fixed keys hq, exec, health, mosque, school, uni), cover image, gallery (images, each with alt en/ar), area m², duration days, year, city (en/ar), client name (en/ar, optional), challenge (en/ar), solution (en/ar), image hotspots on the cover (x%, y%, tag, title, description — en/ar; placed by clicking on the image), scope items (multi-select from the fixed 7 keys of `scopeLib`), featured on home (bool), order.
- **REQ-005** `heroSlides` (singleton): exactly 4 image slots, one per slide in the design's order — each = image + alt (en/ar). Slide texts (kicker, headline lines) and hotspots stay in code, per slide position (D5).
- **REQ-005b** `siteSettings` (singleton): phone numbers (label en/ar + number), email addresses (label en/ar + address), website, WhatsApp number, WhatsApp prefilled message (en/ar), working hours (days + time, en/ar), office address (en/ar), map link, social URLs (LinkedIn, Instagram, X, Snapchat, TikTok — empty hides the icon), **lead notification emails** (list of addresses that receive form submissions — FEAT-004).
- **REQ-006** `lead`: form type (contact / project / call), name, company, email, phone, space type, area, message, locale, page URL, created at, email delivered (bool). Created by the server only; editors can read, mark as handled, and delete.

### Delivery to the site
- **REQ-007** Typed GROQ queries in one module (`projects`, `projectBySlug`, `featuredProjects`, `heroSlides`, `siteSettings`) consumed by FEAT-003; images through Sanity's image CDN with `next/image` and hotspot/crop.
- **REQ-008** Publishing in Studio updates the live site within ~1 minute (Sanity webhook → `revalidateTag`).
- **REQ-009** Seed script imports the 6 design projects, the 4 hero images (from `design-reference/assets/`) and the design's placeholder contacts into the dataset.

## Business rules
- **BR-001** Project slug: unique, lowercase-kebab; changing it after publish adds a redirect (FEAT-005).
- **BR-002** Drafts never appear on the live site.
- **BR-003** Empty client name → no client line on the site (no `[Client name]` placeholder).
- **BR-004** Required to publish a project: title en+ar, slug, category, cover image, at least one gallery image.
- **BR-005** Category labels/icons and scope item texts come from code; the Studio stores only the keys, so the editor picks from a list.
- **BR-006** Hero must have at least 1 image; if the singleton is empty the site uses the design's 4 default images.
- **BR-008** Hotspots on a replaced hero image keep their design positions and may point at the wrong spot (accepted, D5); the Studio field description warns the editor.
- **BR-009** Settings fields left empty hide that item on the site (no placeholder number or link is shown).
- **BR-007** Leads are personal data: only Studio users can see them; the public dataset API token used by the site cannot read `lead` documents.

## Non-functional
- **NFR-001** Each page fetches its Sanity content in one query.
- **NFR-002** Field descriptions in plain language for a non-technical editor.

## Acceptance criteria
- **AC-001** Editor adds a project with 4 gallery images, publishes, and it appears on `/en/projects` and `/ar/projects` within a minute.
- **AC-002** Editor replaces hero image 2; the home hero shows it after publish, texts unchanged.
- **AC-003** A draft project is not visible on the site.
- **AC-004** After the seed, the projects and hero match the design.
- **AC-006** Editor changes the phone number and Instagram URL in Site settings; header/footer/contact page show them after publish; clearing the TikTok URL hides its icon.
- **AC-005** `/studio` requires Sanity login; `lead` documents cannot be fetched with the site's read token.

## Assumptions
- A1 Field-level localisation (one document, `en`/`ar` fields), not one document per language.
- A2 Categories and scope items are fixed lists in code (D2 names only projects + hero images as editable) — if the client needs to add a category, it's a code change.
- A3 Sanity free plan on Omnexa's account is enough (one project, one dataset, few editors); client editors are invited as members.
- A4 The dataset is private or the site uses a read token, so leads are never public (BR-007).

## Out of scope
Editing page text, FAQs, testimonials, materials or stats in the Studio (D2); hero hotspots, slide texts and slide count (D5, later); page builder; scheduled publishing; more than 2 languages.

## Open
See `questions.md`.
