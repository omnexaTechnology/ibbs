# FEAT-001 — App foundation — Implementation plan

PLAN STATUS: READY_FOR_IMPLEMENTATION (approved by user 2026-10-26)
Inputs: `spec.md`, `impact.md`. Tasks in `tasks/`. Estimate: 4.5 day(s).

| Task | Title | Depends on | Days | Status |
|---|---|---|---|---|
| T-001 | Scaffold the repo | — | 0.5 | READY |
| T-002 | Locale routing, messages and fonts | T-001 | 1.0 | PENDING |
| T-003 | Design tokens and light/dark theme | T-001 | 0.5 | PENDING |
| T-004 | Site shell: header, footer, WhatsApp, settings contract | T-002, T-003 | 1.0 | PENDING |
| T-005 | Page transitions, custom cursor, reduced motion | T-004 | 1.0 | PENDING |
| T-006 | Route stubs, CI and Vercel previews | T-002 | 0.5 | PENDING |

Branch: `feat/FEAT-001-<short-name>` per task or per item, PR into `main`.
