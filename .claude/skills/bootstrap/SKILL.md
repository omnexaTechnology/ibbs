---
name: bootstrap
description: Initialize the AI Software Factory workspace in a repository, creating the .ai state directory, board, project context, and workflow metadata without changing application code.
---

# Bootstrap the AI Software Factory

Use this skill when a repository is new to the workflow, or when `.ai/` is missing/incomplete.

## Goals

Create a small, durable project-control layer. Do not modify application source code.

## Steps

1. Inspect the repository:
   - language/runtime
   - package manager
   - framework
   - existing tests/build/lint commands
   - major directories
   - existing `CLAUDE.md`, `AGENTS.md`, `.ai/`, docs, and architecture files
2. If `.ai/` does not exist, create:
   ```
   .ai/
   ├── PROJECT.md
   ├── BOARD.md
   ├── STATUS.md
   ├── decisions/
   └── work/
   ```
3. Populate `.ai/PROJECT.md` with:
   - project purpose
   - detected stack
   - architecture summary
   - important commands
   - conventions
   - known constraints
   - explicit unknowns
4. Initialize `.ai/BOARD.md` with columns:
   - Inbox
   - Discovery
   - Ready
   - In Progress
   - Review
   - Done
   - Blocked
5. Initialize `.ai/STATUS.md` with current workflow state and the next recommended action.
6. Do not invent product requirements or architectural decisions. Mark unknowns as `UNKNOWN`.
7. If the repository already has project documentation, link to it instead of duplicating large amounts of content.

## Safety

Never delete or overwrite existing `.ai` artifacts without preserving their information. If conflicting state exists, ask before destructive reconciliation.

## Definition of Done

- `.ai/PROJECT.md` exists and is grounded in repository evidence.
- `.ai/BOARD.md` exists.
- `.ai/STATUS.md` exists.
- No application code was changed.
