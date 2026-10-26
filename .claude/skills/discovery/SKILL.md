---
name: discovery
description: Interview the user to clarify a feature or project idea and turn the conversation into explicit scope, actors, flows, rules, constraints, and open questions.
---

# Discovery

Use for new projects and non-trivial features.

## Interview behavior

Ask focused questions in small batches. Prefer the highest-impact unknowns first:
1. goal/problem
2. users/actors
3. core workflow
4. business rules
5. permissions
6. data ownership
7. edge cases
8. integrations
9. non-functional constraints
10. out of scope

Do not ask questions whose answers can be safely inferred from existing project conventions.

When the user answers, restate the resulting decision briefly and continue.

## Completion

When enough information exists, produce/update:
- `.ai/work/<id>/spec.md`
- `.ai/work/<id>/questions.md`

The spec must contain:
- Goal
- Actors
- User/system flows
- Functional requirements
- Business rules
- Acceptance criteria
- Non-functional requirements, if relevant
- Explicit out of scope
- Remaining unknowns

End with `DISCOVERY COMPLETE` only when no unanswered question is likely to change the implementation materially.

Do not write application code.
