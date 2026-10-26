---
name: impact
description: Analyze the likely impact of a feature or change across domain, database, APIs, UI, integrations, tests, infrastructure, and documentation before implementation.
---

# Impact Analysis

Use before planning implementation of a non-trivial change.

## Analyze

Read the work spec and relevant repository code. Identify affected:
- domain/module boundaries
- database/schema/migrations
- APIs/contracts
- frontend/mobile surfaces
- integrations
- background jobs/events
- auth/security
- tests
- infrastructure/deployment
- documentation

Also identify:
- dependencies
- conflicts with existing decisions
- backward compatibility concerns
- concurrency/idempotency risks
- likely migration or rollout risks

## Output

Write `.ai/work/<id>/impact.md` with:
- Summary
- Affected areas
- Files/modules likely involved
- Dependencies
- Risks
- Unaffected areas
- Open questions
- Recommended implementation order

Do not modify application code.

Finish with:
`IMPACT STATUS: READY_FOR_PLAN`
or stop with a clear blocker.
