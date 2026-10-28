# FEAT-003 — Pages, animation and 3D — Implementation plan

PLAN STATUS: READY_FOR_IMPLEMENTATION (approved by user 2026-10-26)
Inputs: `spec.md`, `impact.md`. Tasks in `tasks/`. Estimate: 12 day(s).

| Task | Title | Depends on | Days | Status |
|---|---|---|---|---|
| T-001 | UI primitives | FEAT-001/T-004 | 1.0 | DONE |
| T-002 | 3D core: kit, renderer, scene wrapper | FEAT-001/T-001 | 1.5 | DONE |
| T-003 | Project detail page | T-001, FEAT-002/T-003 | 1.0 | DONE |
| T-004 | Projects list page with 3D floor | T-002, T-003 | 1.0 | DONE |
| T-005 | Home 1: hero, partners, about intro, stats, sectors | T-001, FEAT-002/T-003 | 1.0 | DONE |
| T-006 | Home 2: process carousel + 3D, office walk-through | T-002, T-005 | 2.0 | DONE |
| T-007 | Home 3: projects accordion, materials, testimonials, FAQ, clients, CTA 3D | T-002, T-005 | 1.5 | DONE |
| T-008 | About page with 3D build | T-002, T-001 | 1.0 | DONE |
| T-009 | Contact and legal pages | T-001, FEAT-002/T-004 | 0.5 | DONE |
| T-010 | Parity, accessibility and performance pass | T-003, T-004, T-006, T-007, T-008, T-009 | 1.5 | PENDING |

Branch: `feat/FEAT-003-<short-name>` per task or per item, PR into `main`.
