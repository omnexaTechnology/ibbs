# Accounts and external services — 2026-10-26

Source: user, 2026-10-26.

| Service | Value | Notes |
|---|---|---|
| GitHub | `https://github.com/omnexaTechnology/ibbs.git` (private, empty at 2026-10-26, default branch not set) | Repo name is `ibbs` (not `ibss`). Local folder stays `ibss-web`. `gh` on this machine is logged in as `melamrosy72` with ADMIN on the repo. |
| Sanity | project ID `zf4tpgl3`, dataset `production` | On Omnexa's Sanity account (FEAT-002 D6). Project ID and dataset are public config (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`). Tokens go only in `.env.local` / Vercel env, never in git or chat. |
| Lead fallback inbox | `melamrosy72@gmail.com` | `LEAD_FALLBACK_EMAIL` until the client sets addresses in Site settings (FEAT-004 D2). |
| Vercel | Created **manually by the user**, connected to `omnexaTechnology/ibbs` through Vercel's GitHub integration (user, 2026-10-26). | We only push to GitHub; Vercel builds `main` → production and every branch/PR → preview. We do NOT run `vercel link`/`vercel deploy` for this app. The user sets env vars in the Vercel dashboard (names listed in `.env.example`). FEAT-001 T-006 'Vercel project' criterion = user action; verify by checking that a preview URL appears on the pushed branch/PR. |
| Resend | UNKNOWN — account not confirmed. | Needed for FEAT-004 T-001 real delivery; tests mock it. |
