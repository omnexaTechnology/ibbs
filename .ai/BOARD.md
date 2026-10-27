# Board

Workspace: `ibss-web` (IBSS Innovations Furniture — Next.js + Sanity)
Last update: 2026-10-27

## Inbox

## Discovery
| ID | Title | Depends on | Open items | Updated |
|---|---|---|---|---|
| FEAT-005 | SEO, performance and launch | FEAT-003, FEAT-004 | Q1 domain, Q2 analytics, Q3 legal text, Q4 launch date — needed before launch, not before building | 2026-10-26 |

## Ready
| ID | Title | Depends on | Current step | Open items | Updated |
|---|---|---|---|---|---|

## In Progress
| ID | Title | Branches | Next | Updated |
|---|---|---|---|---|
| FEAT-003 | Pages: 7 views, animations and all 3D | `feat/FEAT-003-pages` (local, worktree `../ibss-web-feat003`) | T-001, T-002 done; rebased onto FEAT-002 head (232 unit pass). Batch-1 review FIX_REQUIRED (1 blocker: Three in initial JS; 2 major: touch swipe, RTL pin mirroring). Running: T-003, T-009, then batch-1 fixes | 2026-10-27 |
| FEAT-004 | Lead forms: contact, project request, call request | `feat/FEAT-004-forms` (local, worktree `../ibss-web-feat004`) | T-001 endpoint + T-002 forms done. Review FIX_REQUIRED (1 major: forms GET-submit before hydration leaks PII to URL). Fixes running. T-003 waits for FEAT-003 T-003/T-009 | 2026-10-27 |

## Review
| ID | Title | Branches | Next | Updated |
|---|---|---|---|---|
| FEAT-001 | App foundation: Next.js, EN/AR + RTL, theme, layout shell | `feat/FEAT-001-app-foundation` → PR #1 | Merged to main (PR #1) | 2026-10-27 |
| FEAT-002 | Sanity: projects, hero images, site settings, lead routing, leads + Studio + seed | `feat/FEAT-002-sanity` → PR #2 (stacked on #1) | Merged to main (PR #2). Waiting: dashboard steps + live Studio checks (USER-ACTIONS) | 2026-10-27 |

## Done

## Blocked
