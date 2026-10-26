---
name: review
description: Review an implementation against its approved specification, business rules, architecture, tests, and security/performance expectations, then record actionable findings.
---

# AI Review

Use after implementation or before a PR is considered ready.

## Inputs

Read:
- work spec
- business rules
- acceptance criteria
- impact analysis
- plan/task
- git diff
- relevant tests
- architecture decisions

## Review dimensions

Check:
1. requirement compliance
2. business-rule enforcement
3. architecture consistency
4. API/data-contract correctness
5. authorization/security
6. transactions/concurrency/idempotency
7. error handling
8. performance risks
9. test coverage and meaningful assertions
10. accidental scope changes

Classify findings:
- BLOCKER
- HIGH
- MEDIUM
- LOW
- NOTE

Every actionable finding must include:
- evidence
- why it matters
- suggested fix

Do not invent problems without evidence.

## Output

Write/update:
`.ai/work/<id>/review.md`

If blockers exist:
`REVIEW STATUS: CHANGES_REQUIRED`

If no blockers:
`REVIEW STATUS: READY_FOR_HUMAN_REVIEW`

Never declare a production deployment safe solely from this review.
