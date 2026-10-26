# FEAT-002 — Sanity content model, Studio, seed — Implementation plan

PLAN STATUS: READY_FOR_IMPLEMENTATION (approved by user 2026-10-26)
Inputs: `spec.md`, `impact.md`. Tasks in `tasks/`. Estimate: 4.25 day(s).

| Task | Title | Depends on | Days | Status |
|---|---|---|---|---|
| T-001 | Sanity project and embedded Studio | FEAT-001/T-001 | 0.5 | BLOCKED (code done; CORS, private dataset, login check = user) |
| T-002 | Schemas and desk structure | T-001, FEAT-001/T-004 | 1.0 | DONE |
| T-003 | Query layer, image helper, typegen | T-002 | 1.0 | DONE |
| T-004 | Switch site settings to Sanity + revalidation webhook | T-003 | 0.5 | BLOCKED (code done; dashboard webhook = user) |
| T-005 | Seed script | T-002 | 1.0 | DONE |
| T-006 | Lead privacy check | T-003 | 0.25 | DONE |

Branch: `feat/FEAT-002-<short-name>` per task or per item, PR into `main`.
