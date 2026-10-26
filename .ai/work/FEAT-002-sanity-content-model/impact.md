# FEAT-002 — Impact analysis

Date: 2026-10-26.

## Summary
Adds Sanity (Omnexa account) with an embedded Studio, four document types (`project`, `heroSlides`, `siteSettings`, `lead`), a typed query layer, publish → revalidate, and a seed of the design content. Defines the data contract FEAT-003 renders and the `lead` store FEAT-004 writes.

## Affected areas
| Area | Effect |
|---|---|
| Dependencies | `sanity` 6.x, `next-sanity` 13.x (peer: next ^16, react ^19.2.3, styled-components ^6.1), `@sanity/vision`, `@sanity/image-url` 2.x, `styled-components`. Versions checked on npm 2026-10-26. |
| Routes | `src/app/studio/[[...tool]]/page.tsx` (outside `[locale]`, own layout, `noindex`); `src/app/api/revalidate/route.ts`. |
| Schema | `src/sanity/schemaTypes/{localeString,localeText,hotspot,project,heroSlides,siteSettings,lead}.ts`, desk structure with 3 singletons (hero, settings) + leads list. |
| Shared constants | Category keys (6) and scope keys (7) move to `src/content/taxonomy.ts`; Studio uses them as option lists, the site uses them for labels (BR-005). |
| Query layer | `src/sanity/{client,env,image,queries,fetch}.ts`; types generated with `sanity typegen` into `src/sanity/types.ts`. |
| FEAT-001 contract | `getSiteSettings()` switches from design defaults to Sanity, with the defaults kept as fallback for empty fields only where BR-009 allows (empty = hidden, not placeholder). |
| Security | Three tokens: none in the browser; a read token (server) for drafts-free published content; a write token (server, FEAT-004) limited to creating `lead`. Dataset **private**, so `lead` docs are never public (BR-007). |
| Env vars | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET` — local `.env.local` + Vercel. |
| Sanity project settings | CORS origins: localhost:3000, Vercel preview domain, production domain. Webhook → `/api/revalidate`. |
| Seed | `scripts/seed.ts`: uploads the hero images + 6 projects' images from `design-reference/assets/`, creates documents from the design's `PR`, `SL` data and placeholder contacts. |

## Files/modules likely involved
`sanity.config.ts`, `sanity.cli.ts`, `src/sanity/**`, `src/app/studio/**`, `src/app/api/revalidate/route.ts`, `src/content/taxonomy.ts`, `src/lib/site-settings.ts`, `scripts/seed.ts`, `.env.example`.

## Dependencies
- FEAT-001 T-001 (app exists) and T-004 (settings contract).
- Access to Omnexa's Sanity account to create the project and tokens (user, D6).

## Risks
- **R1** A private dataset means every site query needs the read token on the server; image URLs from the Sanity CDN are still public (fine — images are public content). Low.
- **R2** `next-sanity` 13 / `sanity` 6 are newer than anything used at Omnexa so far; Studio embedding API may differ from older guides. Check the installed package docs first. Medium.
- **R3** Hero hotspots stay in code (D5); a replaced image keeps old dot positions. Accepted; Studio field description warns. Low.
- **R4** Sanity free plan limits (members, API requests) — fine for this size, but leads count against document limits over years. Low.

## Conflicts found with existing specs
- **FEAT-003 REQ-011** says legal pages come from Sanity "rich text". Per D2 only projects, hero, settings and leads are in Sanity → legal pages live in code (MDX per locale). FEAT-003 updated.

## Unaffected areas
Page section copy, FAQs, testimonials, materials, process stages, stats — stay in `messages/*.json` / `src/content/*`.

## Open questions
Non-blocking (see `questions.md`).

## Recommended implementation order
Project + Studio mount → schemas + structure → query layer + typegen → settings contract switch → revalidate webhook → seed → security check.

IMPACT STATUS: READY_FOR_PLAN
