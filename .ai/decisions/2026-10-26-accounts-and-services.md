# Accounts and external services — 2026-10-26

Source: user, 2026-10-26.

| Service | Value | Notes |
|---|---|---|
| GitHub | `https://github.com/omnexaTechnology/ibbs.git` (private, empty at 2026-10-26, default branch not set) | Repo name is `ibbs` (not `ibss`). Local folder stays `ibss-web`. `gh` on this machine is logged in as `melamrosy72` with ADMIN on the repo. |
| Sanity | project ID `zf4tpgl3`, dataset `production` | On Omnexa's Sanity account (FEAT-002 D6). Project ID and dataset are public config (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`). Tokens go only in `.env.local` / Vercel env, never in git or chat. |
| Lead fallback inbox | `melamrosy72@gmail.com` | `LEAD_FALLBACK_EMAIL` until the client sets addresses in Site settings (FEAT-004 D2). |
| Vercel | UNKNOWN — user says a project is deployed, but the repo is empty and this machine's Vercel login (team `melamrosy72s-projects`) only shows `ibss-demo`. | Ask which project/team; otherwise create one from the repo after the first push. |
| Resend | UNKNOWN — account not confirmed. | Needed for FEAT-004 T-001 real delivery; tests mock it. |
