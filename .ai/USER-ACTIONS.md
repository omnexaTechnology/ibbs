# Your actions and reviews — IBSS website

Things only you can do, or that wait for your review. Work continues without them unless an item says **BLOCKING**.
Newest items at the top of each section. Tick a box when done; Claude reads this file to pick up your answers.

Last update: 2026-10-27

## Blocking something

_(none right now)_

## To do (accounts and dashboards)

- [ ] **Create the Vercel project** from GitHub repo `omnexaTechnology/ibbs` (you said you'd do this manually).
  - Add these env vars in Vercel → Settings → Environment Variables (Production + Preview): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`. Copy the values from your `.env.local`. (Claude generated `SANITY_REVALIDATE_SECRET` there on 2026-10-26 because it was empty. Use the same value in the Sanity webhook.)
  - **Do not add `SANITY_API_WRITE_TOKEN` to Vercel yet.** Nothing deployed uses it until the forms (FEAT-004) ship. Then add it to Production only. (Corrected 2026-10-27 after review F-07.)
  - Then check: PR #1 shows a Vercel preview link; `/en` and `/ar` open on it.
- [ ] **Make the Sanity dataset private**: sanity.io/manage → project `zf4tpgl3` → Datasets → `production` → Private. It is public now (checked 2026-10-26). The code also hides leads on its own, but private is the safe setting.
- [ ] **Sanity dashboard steps** — exact clicks in `docs/SANITY-SETUP.md` (in the repo on `main`). After the Vercel project exists:
  - CORS origins, with "Allow credentials" on (needed to log in at `/studio`): add **exact addresses only**: `http://localhost:3000`, plus your production domain or the stable `<project>.vercel.app` address. **Never add a wildcard like `https://*-team.vercel.app`.** Anyone can create a matching vercel.app address and use a logged-in editor's session from it. Use the Studio on production or localhost, not on preview URLs. (Corrected 2026-10-27 after review F-04. The setup doc gets the same fix.)
  - Publish webhook → `https://<your-domain>/api/revalidate`, signed with the `SANITY_REVALIDATE_SECRET` value. Copy the filter and projection from the doc: the filter now includes `leadRouting`.
- [ ] **Open `/studio` and log in** (http://localhost:3000/studio with `npm run dev`, or the Vercel URL). Check:
  - the 6 seeded projects and 4 hero images are there;
  - the click-on-photo hotspot picker places dots on a project;
  - "Lead routing (private)" opens, saves and publishes, and publishing it triggers the webhook (Sanity → API → Webhooks → Attempts);
  - the Vision tool shows for you (Administrator) but not for an Editor account;
  - on a lead, the "Handled" box saves without a Publish step, and delete works. Ask Claude to create one test lead if there are none yet.
- [ ] **Fill Site settings in the Studio and publish**: real phones, emails, WhatsApp number, hours, address, map link and social links. It is empty on purpose, so nothing shows on the site until you fill it. The "who receives new enquiries by email" addresses are **not** in Site settings any more (review F-01). They go in the separate **Lead routing (private)** entry in the Studio menu: hidden from the public and from every web page. Fill it in there (empty is fine until the forms ship in FEAT-004).
- [ ] **Resend account** (for form emails, FEAT-004) under `melamrosy72@gmail.com`; put `RESEND_API_KEY` in `.env.local` and Vercel. Not needed until FEAT-004 ships. The code is ready (2026-10-27): it also reads `LEAD_FALLBACK_EMAIL` (set to `melamrosy72@gmail.com`) and `LEAD_FROM_EMAIL` (sender address). Until you verify a sending domain in Resend, the sender is `onboarding@resend.dev`, which can only deliver to the Resend account owner's inbox.

## To review when you have time

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

## Good to know (no action needed)

- Sanity read token (Viewer) can technically read leads too — on the free plan tokens can't be limited per document type. It is only used on the server and no site query reads leads, so visitors can't get them. Leads are also stored under hidden IDs (`lead.…`) that anonymous users can't read even while the dataset is public — tested live on 2026-10-26.
- **Don't run `npm run seed -- --force` on production** once Site settings are filled in, unless Claude asks. The script now protects Site settings and Lead routing, and `--force` on production refuses without `--yes`, but there is no reason for you to run it.
- Seeded gallery photos got generic alt text ("<project> – photo n"); edit in Studio if you want better descriptions.

## Questions with a default (Claude proceeds with the default unless you change it)

| Item | Question | Default in use |
|---|---|---|
| FEAT-001 | Default language | English; `/` follows the browser language |
| FEAT-002 | Are stats (120 projects, 85k m², 60 clients, 10 years), testimonials, client/partner logos real? | Hidden on the live site until you confirm real values |
| FEAT-002 | Home page project panels: 4 "featured" or all 6? (review F-03) | All projects, as in the design (6 panels). The "Show on the home page" switch in the Studio is retired and hidden: order is set with the Order number |
| FEAT-002 | Studio UI in Arabic for editors? | English Studio, Arabic content fields |
| FEAT-003 | Is the design final? | Built from the 2026-10-26 export; later changes handled as new work |
| FEAT-003 | Contact page map | Link to Google Maps from Site settings (no embedded map) |
| FEAT-003 | Project page: related or next/previous? | Related projects (same category) |
| FEAT-004 | Required form fields | Name, phone, and email or message |
| FEAT-004 | Spam protection | Honeypot + rate limit (no Turnstile) |
| FEAT-004 | Confirmation email to the visitor | No |
| FEAT-004 | Fallback inbox for enquiries (used when Lead routing is empty or can't be read) | `melamrosy72@gmail.com` for now. **Before launch, give a client-owned address** so enquiries don't land in a personal Gmail (review F4-09) |
| FEAT-004 | Language of the "space type" in saved leads and emails | English label for every lead, so the sales team reads one language |
| FEAT-004 | Phone number format in saved leads | Normalised (e.g. `+9665…` or `05…`), not exactly as typed |
| FEAT-004 | "Space type" dropdown | Starts on "Select…" and is optional (the design had no placeholder) |
| FEAT-004 | Saudi landlines (`011…`) and 9200 numbers in the phone field | Accepted (review F4-05). Say if only mobiles should be allowed |
| FEAT-005 | Domain, analytics, legal text, launch date | Unknown — needed before launch only. The privacy and terms pages hold draft text: **someone must approve it before launch** (FEAT-003 review R2-06) |

## Done

- [x] PR #1 (FEAT-001) and PR #2 (FEAT-002) merged into `main` (2026-10-27). CI now installs npm 11 first, because npm 10 rejected the lock file.
- [x] Sanity read + write tokens created and put in `.env.local` (2026-10-26).
- [x] Leads fallback inbox: `melamrosy72@gmail.com` (2026-10-26).
- [x] GitHub repo `omnexaTechnology/ibbs`, Sanity project `zf4tpgl3` / `production` (2026-10-26).
