---
name: board
description: Maintain and summarize the AI development board and project status from work artifacts, git state, tests, and review results.
---

# Development Board

Use to create, refresh, or summarize project work state.

## Source of truth

Prefer evidence from:
1. task artifacts
2. plan/spec status
3. git state and commits
4. test results
5. review results

Do not claim DONE solely because an AI message says it is done.

## Maintain

`.ai/BOARD.md` with:
- Inbox
- Discovery
- Ready
- In Progress
- Review
- Done
- Blocked

For each work item show:
- ID
- title
- status
- branch, if applicable
- current task
- blockers
- last update

Also maintain `.ai/STATUS.md`:
- overall progress
- active work
- completed work
- blockers
- risks
- next recommended action

## Summary

When asked for status, provide:
- what changed
- what is active
- what is blocked
- what is next
- important risks

Keep the board concise. Put detailed reasoning in work artifacts.
