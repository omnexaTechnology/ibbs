# Intake — 2026-10-26

Request (user): convert the IBSS Furniture design (Claude Design export, live demo at https://ibss-demo.vercel.app) into a Next.js app with Sanity CMS, using Sanity Studio as the client's dashboard. Write specs.

Classification: one new project, split into 5 work items so each can be reviewed on its own.

| ID | Title | Type | Depends on |
|---|---|---|---|
| FEAT-001 | App foundation: Next.js, EN/AR + RTL, theme, layout shell | feature | — |
| FEAT-002 | Sanity content model + embedded Studio + seed content | feature | FEAT-001 |
| FEAT-003 | Pages: port the 7 views, animations and 3D, driven by Sanity | feature | FEAT-001, FEAT-002 |
| FEAT-004 | Lead forms: contact, project request, call request | feature | FEAT-001 (FEAT-002 if leads are stored in Sanity) |
| FEAT-005 | SEO, performance and launch | technical task | FEAT-003, FEAT-004 |

Duplicates: none. Overlap: FEAT-002 defines the schemas, FEAT-003 consumes them; the boundary is the GROQ query layer (owned by FEAT-002).

Effort estimate given to the user on 2026-10-26: 10–14 working days total (6–9 with heavy AI help). Revised after impact + plan (2026-10-26): 25 tasks, ~23 dev-days for FEAT-001..004 (FEAT-005 not yet planned) — see each `plan.md`.

Status (2026-10-26): FEAT-001..004 have spec, impact and plan; plans await user approval. FEAT-005 is in Discovery.

## Lean runs (user rule, 2026-10-28)
1. One Opus review per feature, not per batch. Small fix rounds: the lead checks the diff and targeted tests; no re-review agent.
2. Agents run lint, tsc, unit tests, and only the e2e specs for files they touched. Full Playwright suite, `E2E_FIXTURES=1` build and screenshots: once, in the final pass (e.g. FEAT-003 T-010).
3. Grep `design-reference/Main.dc.html` by section class / function name; never read the whole file.
4. Fix blockers and majors right away; minors and nits go to one list for the final pass.
