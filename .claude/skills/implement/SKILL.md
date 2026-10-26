---
name: implement
description: Execute an approved task plan safely, one task at a time, updating task state, tests, git branch/commit information, and the AI development board.
---

# Implementation

Use only after the work has an approved plan.

## Before each task

1. Read the work spec, impact, plan, and task file.
2. Read relevant existing code and tests.
3. Verify dependencies are complete.
4. Update task status to `IN_PROGRESS`.
5. If the task requires a decision not covered by the spec, stop and ask.

## Execution

For each task:
1. Implement the smallest coherent change.
2. Preserve existing architecture unless the task explicitly changes it.
3. Add/update tests appropriate to the change.
4. Run focused validation.
5. Run broader validation when practical.
6. Review the diff for accidental changes.
7. Record result in the task file.
8. Update `.ai/BOARD.md` and `.ai/STATUS.md`.

## Git

If the repository uses branches, use a task/feature branch rather than committing directly to the default branch unless the user explicitly asks otherwise.

Suggested branch:
`feat/<work-id>-<short-name>`
or
`fix/<work-id>-<short-name>`

Do not push or create a PR unless requested or explicitly permitted by the project workflow.

## Failure

If validation fails:
- diagnose
- fix if clearly within scope
- otherwise mark `BLOCKED` with evidence

Never mark a task DONE just because code was written.

## Definition of Done

A task is DONE only when:
- implementation is present
- acceptance criteria are satisfied
- relevant tests pass
- no known in-scope blocker remains
- task artifact and board are updated
