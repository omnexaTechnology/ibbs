# Status

Last update: 2026-10-27

## Overall
- FEAT-001 (foundation): PR #1, CI green, reviewed. Waiting for the user's merge and Vercel project.
- FEAT-002 (Sanity): PR #2 stacked on #1. Review found a blocker (lead recipients serialised into every page); fixed by moving them to the private `private.leadRouting` document read only by `getLeadRecipients()`. Re-review READY_FOR_HUMAN_REVIEW; follow-ups done. Validation: lint, tsc, 167 unit, schema validate, both builds, 75 e2e, verify:content, scan:build.
- FEAT-003 (pages): T-001 UI primitives and T-002 3D core done in worktree `../ibss-web-feat003` (196 unit, 76 e2e on port 3200). The design uses Three r149, the site r186; color/light compatibility shims added, side-by-side parity under review.
- FEAT-004 (forms): ready; starts once FEAT-003 is rebased (both touch the contact page).
- FEAT-005: Discovery.

## Blockers
None blocking the build. User actions (Vercel project + env, Sanity CORS/webhook/private dataset, live Studio checks, Resend) are in USER-ACTIONS.md.

## Risks
- Detailed plan (~23 dev-days) is well above the 10–14 days quoted earlier; mostly the 3D scenes.
- Three r149 → r186 lighting differences: every scene must be compared with the design.
- Much of the design's content is placeholder (stats, client names, testimonials, logos).
- Parallel agents share the machine: e2e ports are split (3100 main, 3200 feat003 worktree).

## Next recommended action
User: review/merge PR #1 then PR #2; do the dashboard steps. Claude: finish the FEAT-003 batch-1 review, rebase FEAT-003 onto FEAT-002, continue T-003..T-009, start FEAT-004.
