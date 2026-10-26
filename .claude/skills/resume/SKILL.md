---
name: resume
description: Resume an interrupted AI development workflow by reconstructing current project state from the AI artifacts, repository, git history, tests, and board.
---

# Resume Work

Use when the user says "resume", "continue", "where were we?", or returns to a project after a pause.

## Reconstruct state

Read:
- `.ai/BOARD.md`
- `.ai/STATUS.md`
- `.ai/PROJECT.md`
- active work spec/impact/plan
- task files
- review artifacts
- git status
- recent commits/diff
- relevant test results if available

Determine:
- current work item
- current task
- completed tasks
- next READY task
- blockers
- unresolved decisions
- whether repository state matches AI artifacts

## If state conflicts

Do not blindly overwrite records.

Report the conflict and reconcile using repository evidence. Ask the user if the conflict cannot be resolved safely.

## Output

Give a concise resume summary:
- We were doing X.
- Completed Y.
- Current state Z.
- Next action N.

Then wait for the user's instruction unless the user explicitly asked to continue execution.
