# Status

Last update: 2026-10-26

## Overall
Workspace bootstrapped; FEAT-001 (app foundation) is implemented on local branch `feat/FEAT-001-app-foundation` (6 tasks, all validated locally: lint, tsc, 60 unit tests, build, 40 Playwright e2e). Not pushed. FEAT-002..004 plans approved, not started. FEAT-005 stays in Discovery until launch details are known.

## Active
Discovery batch 1 answered (2026-10-26): Omnexa Learn stack; Sanity edits projects + hero images only; leads emailed + saved in Sanity; all 3D kept.

Discovery batch 2 answered (2026-10-26): contact + social links editable in Sanity Site settings; hero = replace the 4 images only (advanced later); Sanity project on Omnexa's account; lead emails go to addresses set in Site settings.

## Blockers
- FEAT-001/T-006 (partial): pushing the branch to GitHub (`omnexaTechnology/ibbs`) and confirming the Vercel preview URL (REQ-013, AC-005) and the first CI run need permission to push; nothing was pushed or deployed.

## Risks
- Detailed plan (~23 dev-days) is well above the 10–14 days quoted to the user earlier; mostly the 3D walk-through and other scenes.
- 3D scenes (Three.js) are the largest and least predictable part, especially mobile performance.
- Much of the design's content is placeholder (stats, client names, testimonials, contacts, logos).
- The design may keep changing in Claude Design during the build.

## Next recommended action
Review FEAT-001 (branch `feat/FEAT-001-app-foundation`), then allow the first push to `omnexaTechnology/ibbs` and check CI + the Vercel preview. Then start FEAT-002 (needs Sanity token for project `zf4tpgl3`, Resend account, lead fallback inbox).

## FEAT-002 (2026-10-26)
Implemented on local branch `feat/FEAT-002-sanity` (6 tasks, one commit each): embedded Studio at /studio, schemas, desk, query layer + typegen, site settings from Sanity, signed revalidate webhook, seed (run twice against production: 18 assets + 8 documents, no duplicates), lead privacy proven on the public dataset. Validation: lint, tsc, 131 unit tests, build with and without env, 72 e2e. BLOCKED on the user: CORS origins, webhook creation, private dataset, Studio login check, `SANITY_REVALIDATE_SECRET` is empty in .env.local. See docs/SANITY-SETUP.md.
