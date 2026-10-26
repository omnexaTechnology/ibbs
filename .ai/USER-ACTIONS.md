# Your actions and reviews — IBSS website

Things only you can do, or that wait for your review. Work continues without them unless an item says **BLOCKING**.
Newest items at the top of each section. Tick a box when done; Claude reads this file to pick up your answers.

Last update: 2026-10-26

## Blocking something

_(none right now)_

## To do (accounts and dashboards)

- [ ] **Create the Vercel project** from GitHub repo `omnexaTechnology/ibbs` (you said you'd do this manually).
  - Until FEAT-001 is merged, `main` has no app, so the first production build fails — expected.
  - Add the env vars from `.env.example` in Vercel → Settings → Environment Variables (Production + Preview): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, `SANITY_REVALIDATE_SECRET` (same values as your `.env.local`).
  - Then check: PR #1 shows a Vercel preview link; `/en` and `/ar` open on it.
- [ ] **Make the Sanity dataset private**: sanity.io/manage → project `zf4tpgl3` → Datasets → `production` → Private. It is public now (checked 2026-10-26). The code also hides leads on its own, but private is the safe setting.
- [ ] **Sanity CORS origins and publish webhook** — exact steps in `docs/SANITY-SETUP.md` (on branch `feat/FEAT-002-sanity` until merged). Needs the Vercel domain, so do it after the Vercel project exists.
- [ ] **Resend account** (for form emails, FEAT-004) under `melamrosy72@gmail.com`; put `RESEND_API_KEY` in `.env.local` and Vercel. Not needed until FEAT-004.

## To review when you have time

- [ ] **PR #1 — FEAT-001 app foundation**: https://github.com/omnexaTechnology/ibbs/pull/1 — CI green, Opus review + re-review passed. Merge when the Vercel preview looks right. (Claude keeps building the next items on top of this branch, so merging is not urgent.)
- [ ] **Arabic phrases written by Claude, not taken from the design** (`messages/ar.json`). Change any you'd phrase differently:
  | English | Arabic |
  |---|---|
  | Menu | القائمة |
  | Close menu | إغلاق القائمة |
  | Switch language | تبديل اللغة |
  | Toggle light/dark mode | تبديل الوضع الفاتح أو الداكن |
  | Main navigation | التنقل الرئيسي |
  | IBSS Innovations (logo) | آي بي إس إس إنوفيشنز |
  | Skip to content | تخطَّ إلى المحتوى |
  | Page not found | الصفحة غير موجودة |
  | The page you're looking for doesn't exist or has moved. | الصفحة التي تبحث عنها غير موجودة أو تم نقلها. |
  | Back to home | العودة إلى الرئيسية |

## Questions with a default (Claude proceeds with the default unless you change it)

| Item | Question | Default in use |
|---|---|---|
| FEAT-001 | Default language | English; `/` follows the browser language |
| FEAT-002 | Are stats (120 projects, 85k m², 60 clients, 10 years), testimonials, client/partner logos real? | Hidden on the live site until you confirm real values |
| FEAT-002 | Studio UI in Arabic for editors? | English Studio, Arabic content fields |
| FEAT-003 | Is the design final? | Built from the 2026-10-26 export; later changes handled as new work |
| FEAT-003 | Contact page map | Link to Google Maps from Site settings (no embedded map) |
| FEAT-003 | Project page: related or next/previous? | Related projects (same category) |
| FEAT-004 | Required form fields | Name, phone, and email or message |
| FEAT-004 | Spam protection | Honeypot + rate limit (no Turnstile) |
| FEAT-004 | Confirmation email to the visitor | No |
| FEAT-005 | Domain, analytics, legal text, launch date | Unknown — needed before launch only |

## Done

- [x] Sanity read + write tokens created and put in `.env.local` (2026-10-26).
- [x] Leads fallback inbox: `melamrosy72@gmail.com` (2026-10-26).
- [x] GitHub repo `omnexaTechnology/ibbs`, Sanity project `zf4tpgl3` / `production` (2026-10-26).
