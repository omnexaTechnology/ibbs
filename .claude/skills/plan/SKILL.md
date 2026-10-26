---
name: plan
description: Break a clarified feature or batch of work into small executable tasks with dependencies, acceptance criteria, file/module targets, and a safe implementation order.
---

# Implementation Plan

Use after specification and impact analysis.

## Planning rules

Break work by coherent vertical or technical slices. Avoid one giant task and avoid meaningless micro-tasks.

Each task must have:
- stable ID
- title
- purpose
- dependencies
- expected files/modules
- acceptance criteria
- validation/tests
- risk notes
- status

Create:
```
.ai/work/<id>/plan.md
.ai/work/<id>/tasks/T-001.md
.ai/work/<id>/tasks/T-002.md
...
```

Use dependency states:
- READY
- BLOCKED
- PENDING

Prefer tasks that can be independently reviewed.

For batches of unrelated tasks, keep separate work IDs and create a dependency map instead of merging them into one feature.

## Approval gate

Before implementation, present:
- task count
- dependency summary
- major risks
- any decision still required

Do not start coding just because the plan exists.

Mark:
`PLAN STATUS: READY_FOR_IMPLEMENTATION`
only when the user has approved the plan or explicitly instructed implementation.
