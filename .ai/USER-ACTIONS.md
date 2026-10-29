# Your actions and reviews — IBSS website

Things only you can do, or that wait for your review. Work continues without them unless an item says **BLOCKING**.
Newest items at the top of each section. Tick a box when done; Claude reads this file to pick up your answers.

Last update: 2026-10-29

## Blocking something

_(none right now)_

## To do (accounts and dashboards)

- [ ] **Make the Sanity dataset private**: sanity.io/manage → project `zf4tpgl3` → Datasets → `production` → Private. It is public now (checked 2026-10-26). The code also hides leads on its own, but private is the safe setting.
- [ ] **Sanity publish webhook** — exact clicks in `docs/SANITY-SETUP.md`. (CORS for `https://ibbs-ten.vercel.app` done 2026-10-29. Never add a wildcard like `https://*-team.vercel.app`; add the real domain the same way at launch.)
  - Publish webhook → `https://ibbs-ten.vercel.app/api/revalidate` (switch to the real domain at launch), signed with the `SANITY_REVALIDATE_SECRET` value. Copy the filter and projection from the doc: the filter now includes `leadRouting`.
- [ ] **Open `/studio` and log in** (http://localhost:3000/studio with `npm run dev`, or the Vercel URL). Check:
  - the 6 seeded projects and 4 hero images are there;
  - the click-on-photo hotspot picker places dots on a project;
  - "Lead routing (private)" opens, saves and publishes, and publishing it triggers the webhook (Sanity → API → Webhooks → Attempts);
  - the Vision tool shows for you (Administrator) but not for an Editor account;
  - on a lead, the "Handled" box saves without a Publish step, and delete works. Ask Claude to create one test lead if there are none yet.
- [ ] **Fill Site settings in the Studio and publish**: real phones, emails, WhatsApp number, hours, address, map link and social links. It is empty on purpose, so nothing shows on the site until you fill it. The "who receives new enquiries by email" addresses are **not** in Site settings any more (review F-01). They go in the separate **Lead routing (private)** entry in the Studio menu: hidden from the public and from every web page. Fill it in there (empty is fine until the forms ship in FEAT-004).

## Deferred to FEAT-005 (launch) — you chose this on 2026-10-29

Until these are done the live forms save leads to Sanity (once `SANITY_API_WRITE_TOKEN` is in Vercel Production) but send no email, and spam protection is only the honeypot + timing check.

- [ ] **Resend account** under `melamrosy72@gmail.com`; put `RESEND_API_KEY` in `.env.local` and Vercel. The code also reads `LEAD_FALLBACK_EMAIL` (set to `melamrosy72@gmail.com`) and `LEAD_FROM_EMAIL` (sender address). Until you verify a sending domain in Resend, the sender is `onboarding@resend.dev`, which can only deliver to the Resend account owner's inbox.
- [ ] **Vercel Firewall rate limit** (about 3 minutes). Project → Firewall → Configure → New rule "Rate limit lead submissions":
  - If Request Path equals `/api/leads` AND Method equals `POST`
  - Rate limit: 5 requests per 1 minute, keyed by IP; then Deny with 429
  - Publish.
- [ ] **`NEXT_PUBLIC_SITE_URL`** in Vercel = the real domain once known. Until then search-engine links use the Vercel address.

## To review when you have time

- [ ] **FEAT-003 checks on the Vercel preview** (after the FEAT-003 PR is open and the Vercel project exists; about 20 minutes):
  - Run Lighthouse (mobile) on `/en`, `/en/projects`, `/en/about`. Target: performance 90+. If `/en/projects` is under 90, tell Claude (fix R3-15 is ready to do).
  - Open home, projects and about on a real phone: swipe the carousels, check the 3D scenes look right and the phone stays smooth.
  - Compare the preview with https://ibss-demo.vercel.app side by side and note anything that looks off.
  - In Studio, change the phone number in Site settings, publish, and check `/en/contact` shows it within a minute.
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

- The enquiry forms need JavaScript: a visitor with it turned off sees the form but cannot send (the submit button stays disabled). WhatsApp and phone links still work.
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
| FEAT-003 | Partner and client logos (home partners strip, "Organizations we work with") | The design's placeholder marks are shown. Send real logos, or say "hide": one switch, `SHOW_PLACEHOLDER_LOGOS` in `src/content/placeholders.ts` |
| FEAT-003 | Dots (hotspots) on the home hero photos | Shown on screens wider than 900px (the spec asks for them; the design has none). Say "drop" to match the design: `SHOW_HERO_PINS` in `src/content/hero-copy.ts` |
| FEAT-003 | Home stats (years, projects, …) | Hidden until the client confirms the numbers; then flip `confirmed` in `src/content/stats.ts` |
| FEAT-003 | Home "materials" picker and testimonials | Not built: the approved demo's home page doesn't show them (the data sits unused in the design file). Say if you want them added |
| FEAT-004 | "Request a call" form | Built but not shown: the design defines it but places it on no page. Say where you want it (e.g. the home CTA) |
| FEAT-005 | Domain, analytics, legal text, launch date | Unknown — needed before launch only. The privacy and terms pages hold draft text: **someone must approve it before launch** (FEAT-003 review R2-06) |

## Done

- [x] Vercel project live at https://ibbs-ten.vercel.app; Sanity CORS origin added for it (2026-10-29).
- [x] PR #3 (FEAT-003) and PR #4 (FEAT-004) merged into `main` (2026-10-28).
- [x] PR #1 (FEAT-001) and PR #2 (FEAT-002) merged into `main` (2026-10-27). CI now installs npm 11 first, because npm 10 rejected the lock file.
- [x] Sanity read + write tokens created and put in `.env.local` (2026-10-26).
- [x] Leads fallback inbox: `melamrosy72@gmail.com` (2026-10-26).
- [x] GitHub repo `omnexaTechnology/ibbs`, Sanity project `zf4tpgl3` / `production` (2026-10-26).
