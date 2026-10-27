# Status

Last update: 2026-10-27

## Overall
- FEAT-001 (foundation): merged to main (PR #1, 2026-10-27).
- FEAT-002 (Sanity): merged to main (PR #2, 2026-10-27). Review found a blocker (lead recipients serialised into every page); fixed by moving them to the private `private.leadRouting` document read only by `getLeadRecipients()`. Re-review READY_FOR_HUMAN_REVIEW; follow-ups done. Validation: lint, tsc, 167 unit, schema validate, both builds, 75 e2e, verify:content, scan:build.
- FEAT-003 (pages): T-001 UI primitives and T-002 3D core done in worktree `../ibss-web-feat003`, rebased onto FEAT-002 head on 2026-10-27 (232 unit pass, tsc clean). Opus batch-1 review and T-003/T-009 running. The design uses Three r149, the site r186; color/light compatibility shims added, side-by-side parity under review.
- FEAT-004 (forms): T-001 endpoint + T-002 components restarted 2026-10-27 (earlier run left no commits) in worktree `../ibss-web-feat004` (port 3300, no env, no production writes). T-003 wiring waits for FEAT-003 pages.
- FEAT-005: Discovery.

## Blockers
None blocking the build. User actions (Vercel project + env, Sanity CORS/webhook/private dataset, live Studio checks, Resend) are in USER-ACTIONS.md.

## Risks
- Detailed plan (~23 dev-days) is well above the 10–14 days quoted earlier; mostly the 3D scenes.
- Three r149 → r186 lighting differences: every scene must be compared with the design.
- Much of the design's content is placeholder (stats, client names, testimonials, logos).
- Parallel agents share the machine: e2e ports are split (3100 main, 3200 feat003 worktree).

## Next recommended action
User: create the Vercel project; do the dashboard steps. Claude: finish the FEAT-003 batch-1 review, rebase FEAT-003 onto FEAT-002, continue T-003..T-009, start FEAT-004.

## 2026-10-27 evening
- FEAT-003: batch-1 fixes done; re-review READY (0 blocker/major, 6 minor, 4 nit). Now: minor follow-ups, then T-005 (home 1) and T-004 (projects list).
- FEAT-004: fixes done; re-review FIX_REQUIRED (1 major R2-01 timer before hydration, 2 minor timeouts). Fix agent running; T-003 (wire forms into pages) after.
- FEAT-004 T-003 done (e920027): contact + project forms wired; branch now stacked on FEAT-003 (c975ed5). Call form not rendered yet — goes in the home quick-call block once home (FEAT-003 T-005/T-007) and FEAT-004 are on one branch. Opus review of R2 fixes + T-003 running.
