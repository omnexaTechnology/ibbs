---
name: context
description: Build or refresh a concise understanding of the current software project before planning or implementing work.
---

# Project Context

Use this skill before substantial planning, implementation, debugging, or review.

## Read first

Prefer:
- `.ai/PROJECT.md`
- `.ai/BOARD.md`
- `.ai/STATUS.md`
- relevant `.ai/work/**` artifacts
- `CLAUDE.md` / `AGENTS.md`
- package manifests and project configuration
- relevant source code and tests

## Produce

Refresh `.ai/PROJECT.md` only when repository evidence has changed materially.

The context should cover:
- stack
- architecture style
- important modules
- data layer
- API conventions
- auth/authorization
- testing strategy
- build/test/lint commands
- important existing decisions
- constraints
- unknowns

Do not create requirements that the user did not provide.

## Output

Give a short "Context loaded" summary and list any important uncertainty that could affect the requested work.
