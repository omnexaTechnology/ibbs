---
name: spec
description: Convert clarified discovery into an implementation-ready specification with requirements, business rules, acceptance criteria, and explicit decisions.
---

# Specification

Use after discovery or when a sufficiently clear request needs a formal specification.

## Inputs

Read:
- `.ai/PROJECT.md`
- the work item's discovery/spec artifacts
- relevant existing code/docs when necessary

## Produce

Update `.ai/work/<id>/spec.md` with stable IDs:
- `REQ-xxx` functional requirements
- `BR-xxx` business rules
- `NFR-xxx` non-functional requirements
- `AC-xxx` acceptance criteria

Every requirement should be testable.

For each important rule, include:
- rule
- rationale if known
- affected behavior

Separate:
- confirmed decisions
- assumptions
- open questions

Do not invent missing product decisions.

## Gate

If an unresolved question can materially change architecture, data model, API, UX, security, or cost, stop and ask the user.

Otherwise mark:
`SPEC STATUS: READY_FOR_IMPACT_ANALYSIS`
