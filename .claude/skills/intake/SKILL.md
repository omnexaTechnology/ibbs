---
name: intake
description: Turn one or many user work requests into a clarified work queue, interviewing the user before implementation and detecting duplicates, dependencies, and missing decisions.
---

# Work Intake

Use when the user gives one task, a large feature, or a batch of tasks.

## Core rule

Do not implement immediately when the request contains meaningful ambiguity.

First classify each item as:
- feature
- bug
- refactor
- technical task
- architecture change
- documentation
- unknown

For multiple items:
1. Normalize each item into a short title.
2. Detect duplicates/overlap.
3. Detect obvious dependencies.
4. Group related work.
5. Identify questions whose answers can materially change implementation.
6. Ask questions in small batches, not a giant questionnaire.

For a single small task with no meaningful ambiguity, you may proceed to specification.

## Create work folders

For each substantial work item:
```
.ai/work/<work-id>/
├── spec.md
├── questions.md
├── impact.md
├── plan.md
├── decisions.md
└── tasks/
```

Use stable IDs such as `FEAT-001`, `BUG-002`, or `TASK-003`.

## Approval boundary

Do not move work to `Ready` until:
- scope is understood,
- important questions are answered,
- out-of-scope items are explicit.

Update `.ai/BOARD.md` after creating or changing work items.

## Never

- silently choose important business rules
- silently expand scope
- implement while unresolved decisions can change the design
