# FEAT-004 — Review 3: R2 fixes + T-003 (forms wired into pages)

Reviewer: Claude (reviewer agent), 2026-10-27
Scope: `c975ed5..HEAD` on `feat/FEAT-004-forms` (worktree `ibss-web-feat004`), focusing on `b464c2f` (R2-01..R2-07), `e920027` (T-003) and the rebase onto `c975ed5`.

## Verdict: READY

0 blocker, 0 major, 3 minor, 5 nit.

All seven R2 findings are fixed. I checked the two abort fixes against the real libraries, not only the mocks. T-003 wires the contact and project forms correctly. The server/client boundary is clean, and no secret or recipient address reaches the client bundles or the page output. The rebase is coherent: `npm ci` accepts the lockfile.

The three minors should still be fixed before merge, because each one is quick:

- R3-01: the project form shows two headings.
- R3-02: the sticky sidebar hides the bottom of the project form.
- R3-03: USER-ACTIONS has no firewall step, although T-003 says it does.

## Validation (run in the worktree)

| Check | Result |
|---|---|
| `npm run lint` | pass (exit 0, no warnings) |
| `npx tsc --noEmit` | pass (exit 0) |
| `npx vitest run` | pass: **34 files, 357 tests** (after the rebase, FEAT-003 tests are included). It prints jsdom "Not implemented: navigation to another Document" noise. Running `src/components/forms` and `src/components/sections` on their own gives 0 of these lines, so the noise does not come from FEAT-004 code. |
| `npm run build` | pass (exit 0); `ƒ /api/leads`, `● /en/contact`, `● /ar/contact` |
| Playwright `e2e/lead-forms.spec.ts`, `contact.spec.ts`, `project.spec.ts` (`PORT=3204`, production build + `next start`) | **18 passed, 0 failed** (lead-forms 4, contact 8, project 6) |
| `npm run scan:build` (on the e2e build) | PASS: 860 files scanned, 3 secret values loaded, 0 hits |
| Extra literal scan of `.next/static` and the page output (`html/rsc/body/meta`): `RESEND_API_KEY`, `LEAD_FALLBACK_EMAIL`, `LEAD_FROM_EMAIL`, `SANITY_API_WRITE_TOKEN`, `api.resend.com`, `onboarding@resend.dev` | 0 hits each. `recipients` appears in 2 static chunks, which are the Studio schema (field name only), and in 0 page files. |
| Actual lead recipients: read-only query of `private.leadRouting` with the read token, values scanned in-process and never printed | The dataset holds **0** recipients today, so this scan proves nothing yet (see "Could not verify"). |
| Lockfile: `npm ci --dry-run --ignore-scripts` on a copy of `package.json` + `package-lock.json` (npm 11.21.1, node 22.16) | exit 0, 1,559 packages. The root `packages[""]` deps match `package.json` exactly. `three` 0.186.1, `zod` 4.6.7 (already in the lock as a non-dev transitive dep; now direct), `resend` 6.34.1 plus its 4 transitive packages (`postal-mime`, `standardwebhooks`, `@stablelib/base64`, `fast-sha256`). There is no conflict-marker residue. |
| R2-02 against real `next-sanity` `createClient` and a local HTTP server that never answers, `signal: AbortSignal.timeout(400)` | Rejects with `AbortError` after 414 ms, 1 request, no retry |
| R2-03 against real `resend` 6.34.1 (`RESEND_BASE_URL` pointed at the same hanging server), `{ signal: AbortSignal.timeout(400) }` | Returns `{ error: { name: "application_error" } }` after 407 ms, 1 request. `notifyLead` therefore throws and the route falls back correctly. |
| Browser probes (`/api/leads` always intercepted; no real write or send): EN + AR project page and contact page at 1280×800 | See R3-01 and R3-02. On a mocked 502 the alert appears in EN and AR. No WhatsApp link appears, because the seeded settings have no WhatsApp number (`wa.me` is absent from the contact HTML too). `<html dir>` is `ltr`/`rtl`. `Date.now() - performance.timeOrigin - performance.now()` was about −1 ms in a fresh browser. |

## R2 findings: status

| ID | Status | Notes |
|---|---|---|
| R2-01 | fixed | `use-lead-form.ts:28-31`. If any non-honeypot field has text at mount, the clock starts at `performance.timeOrigin`; otherwise at `Date.now()`. The empty `<option value="">` of the select and the honeypot are excluded, so an untouched form never counts as "typed". The test hydrates server HTML that already holds typed values and fails without the fix. Analysis below; one nit (R3-06). |
| R2-02 | fixed | `sanityFetch` passes `signal`. `getLeadRecipients` uses `AbortSignal.timeout(3000)`. The real client aborts (verified above), and the rejection reaches the `LEAD_FALLBACK_EMAIL` path. |
| R2-03 | fixed | `withTimeout` is gone, and `emails.send(payload, { signal })` aborts the real request (verified). The new comment overclaims (R3-05). |
| R2-04 | fixed | The `save.ts:7` comment now describes the sequential worst case. |
| R2-05 | fixed | `PATH = /^\/(?:en\|ar)(?:\/[\w\-/%.~]{0,190})?$/`. `//host`, `/www.host`, `/`, `/english`, `/fr/x` and full URLs are dropped (tested). The e2e asserts `pageUrl: /<locale>/<path>` for both pages. |
| R2-06 | fixed | `normalizePhone` gives `+9665XXXXXXXX` / `+9661XXXXXXXX`. `9200…`/`800…` stay digits, and foreign numbers keep `+`. The stored value is consistent everywhere: the route builds `record` from `parsed.data` (zod `.transform(normalizePhone)`), and that one `record.phone` goes to Sanity (`save.ts:43`) and the email (`emails/new-lead.ts:19`). The client sends the raw value, and the server normalizes again. `isValidPhone` still accepts the canonical forms (`SAUDI_MOBILE`/`SAUDI_LANDLINE` allow `+966`). Nit R3-08. |
| R2-07 | fixed | The `renderToString` test checks 3 `disabled` submit buttons and 3 `method="post"` forms. The separate hydrate/no-`console.error` check was not added. The R2-01 test hydrates, but it does not spy on `console.error`. Acceptable. |

### R2-01: is the `performance.timeOrigin` logic safe?

- **bfcache restore**: the page is not re-mounted, so the effect does not run again. `startedAt` keeps its first value, the elapsed time is only longer, and there is no false negative.
- **Long-open tab**: `timeOrigin` is fixed at navigation, so the elapsed time only grows. No false negative.
- **Client-side (soft) navigation**: `timeOrigin` is the original document load, which can be hours old. The newly mounted form has empty fields, so `typed` is false and `Date.now()` is used. The page age is not used here. Correct.
- **Browser form restoration on reload/back without bfcache**: the fields are restored before hydration, so `typed` is true and the clock is the page age of the *new* navigation. A visitor who re-submits less than 2 s after the reload is still dropped silently, but the behaviour before the fix was the same. Not a regression.
- **Can it be gamed more than before?** Only by a bot that drives the real page, fills the fields *before* hydration, and clicks the moment the button enables on a page that hydrates in more than 2 s. Before the fix such a bot was dropped; now it passes. The weakening does not matter in practice, because `elapsedMs` comes from the client anyway: a bot that posts to `/api/leads` directly can send any value. The timer only stops naive bots, and the honeypot plus the firewall rate limit (R3-03) do the real work.
- **Clock mixing**: `performance.timeOrigin` (fixed at navigation) is compared with `Date.now()` (wall clock). They agree in normal use (−1 ms measured), but a wall-clock change between load and submit moves the result (R3-06).

## T-003: what was checked

- **Placement**: `ContactForm` sits inside the `data-slot="contact-form"` card on `/[locale]/contact`. `ProjectForm` sits inside `ProjectFormSlot` in the project page sidebar. Both are server components that pass only the `whatsappHref` string (or `null`) to the client form. `SiteSettings` is not serialised to the client by these components, and the lead routing is never read on a page.
- **WhatsApp fallback**: `whatsappHref(settings, locale)` is localized and returns `null` when there is no number. The link appears only in the delivery-failure banner (`FormAlert`), not in the validation banner. The unit tests cover the href; e2e cannot, because the seed has no number (R3-04).
- **The call form is not wired**: there is no "request a call" block on this branch (it lives on the home page in FEAT-003). The deviation is documented in T-003 "Result" and the plan row. Acceptable.
- **EN/AR + RTL**: both pages pass in EN and AR. Form strings come from `forms.*`, and phone/email inputs stay LTR (`fields.tsx:45`).
- **a11y**: the labels, `aria-required`, `aria-invalid` focus, the `role=alert` banner and the focused `role=status` success state come from T-002 and are unchanged. Keyboard focus into the sticky sidebar does scroll the page, but the focused message box can stay partly hidden (R3-02).
- **e2e quality**: `lead-forms.spec.ts` covers 2 pages × 2 locales: `method="post"`, waiting for hydration (button enabled), a mocked 200 showing the success state, and the payload's `formType`/`locale`/`pageUrl`. It always intercepts `/api/leads`, so no real write or send is possible. Gaps are in R3-04.

## Findings

| ID | Severity | File:line | Issue | Suggested fix |
|---|---|---|---|---|
| R3-01 | minor | `src/components/forms/project-form.tsx:7` + `src/components/sections/project/project-form-slot.tsx:17-23` | The project sidebar now shows **two eyebrows and two `h2`s**: the slot's "Similar project / Discuss a project like this", then the form's own `heading` ("Project request / Tell us about your project"). The same happens in AR ("ناقش مشروعًا مماثلًا" + "حدّثنا عن مشروعك"); see the probe screenshots. The design (`ibss-demo/index.html`, `pf-*`) has a single eyebrow (`pdFormEye`) and a single title (`pdFormTitle`) above the field grid. Screen-reader users get two consecutive headings for one form. | Remove `heading` from `ProjectForm`. The slot already renders the design's heading. The `heading` prop of `RequestForm` then has no user and can be deleted. Optionally add `aria-labelledby="project-form-h"` to the `<form>`. |
| R3-02 | minor | `src/app/[locale]/projects/[slug]/page.tsx:96` | The sidebar `aside` is `lg:sticky lg:top-28`, and with the full form it is **1,263 px tall (EN) / 1,342 px (AR) in an 800 px viewport**. While it is stuck, the lower fields and the submit button sit below the fold. The submit button first becomes fully visible at scrollY 1,800 of 3,608, after the gallery and the overview. A focused `#pf-msg` showed `bottom: 913` (partly hidden). It is still reachable, but the main lead form on the page is awkward to complete. The design handles this exact case: its later rule ("detail sidebar — stacked details, no icons/shadow, full form") sets `.pdx-side { position: static }`. | Drop `lg:sticky lg:top-28` from the aside, as the design does, or make only the facts card sticky. Add an e2e check that the submit button's bounding box is in view after `scrollIntoViewIfNeeded` at 1280×800. |
| R3-03 | minor | `.ai/USER-ACTIONS.md` (no FEAT-004 entries) vs `.ai/work/FEAT-004-lead-forms/tasks/T-003.md` "Rate limit" | T-003 says the Vercel Firewall rule waits "until the user adds it (USER-ACTIONS)", but USER-ACTIONS has no such step. It also does not list `LEAD_FALLBACK_EMAIL`, `LEAD_FROM_EMAIL` with a verified sending domain, the write token for Production now that the forms ship, or the R2 review's note that visitors without JavaScript cannot submit (phone and WhatsApp must be visible). If the step is missed, production `/api/leads` has **no rate limit at all**. With an empty `private.leadRouting` and no fallback, every email fails and only the Sanity save stays. | Add a FEAT-004 block to USER-ACTIONS: the firewall rule (copy it from T-003), the Resend domain + `LEAD_FROM_EMAIL`, `LEAD_FALLBACK_EMAIL`, filling Lead routing, `SANITY_API_WRITE_TOKEN` on Production, and the WhatsApp number in Site settings (the fallback link stays hidden until it is set). |
| R3-04 | nit | `e2e/lead-forms.spec.ts:12-30` | Only the happy path is tested against a mocked 200. There is no e2e test for: (a) the failure path (502 → `form-alert`, plus `form-whatsapp` when a number exists), (b) inline validation in AR (localized messages, focus on the first invalid field), (c) `elapsedMs` in the payload (e2e submits about 200 ms after hydration, so a **real** server would silently drop this exact submission; that is worth a comment so nobody "fixes" the test against a live endpoint). The T-003 validation step (lead appears in Studio, email arrives at the fallback) is not run (preview needed). | Add a 502 case that expects `form-alert`, and an empty-submit case in AR that expects the localized `nameRequired` and focus on `#pf-name`/`#f-name`. Assert `typeof posts[0].elapsedMs === "number"`. Add a comment about the 2 s rule. |
| R3-05 | nit | `src/lib/leads/notify.ts:34` | The comment says "a late answer is never sent-but-counted-as-failed". Aborting on the client does not cancel a request Resend has already received. If the 5 s limit hits after Resend accepted the email, it is still sent but counted as failed. If the save also failed, the visitor gets 502, resends, and sales gets a duplicate. This is rare. | Correct the comment. Optionally pass `idempotencyKey: leadId ?? <hash of the record>` (supported by 6.34.1, sent as the `Idempotency-Key` header) so that a retry cannot send twice. |
| R3-06 | nit | `src/components/forms/use-lead-form.ts:30`, `:48` | The code mixes `performance.timeOrigin` with `Date.now()`, which are two clocks, and `Date.now()` also feeds the existing mount/reset path. A wall-clock change between load and submit (manual change, a large NTP step) shrinks the elapsed time, which risks a silent drop. It can even make it negative, so the client-side `leadSchema` fails on `elapsedMs` (`nonnegative`). The visitor then sees only the generic "check the fields" banner with no field marked and cannot send until they reload. This is unlikely, and partly pre-existing. | Use one monotonic clock: `startedAt.current = typed ? 0 : performance.now()` (and `performance.now()` in `reset`), with `elapsedMs: Math.round(performance.now() - startedAt.current)`. `performance.now()` counts from `timeOrigin`, so the page-age logic is kept. |
| R3-07 | nit | `src/components/forms/contact-form.tsx:5` | The doc comment still says "Not wired into the page yet (FEAT-004/T-003)". | Remove that sentence. |
| R3-08 | nit | `src/lib/validation/lead.ts:60` | The canonical rule turns any local `05XXXXXXXX` into `+9665…`. A visitor from the UAE (local mobiles are also `05X XXX XXXX`) who omits `+971` now gets a stored and emailed number that confidently says Saudi. Before R2-06 it was stored as typed. This is acceptable for a Saudi site, but sales should know about it. | No code change needed. Mention it in the handover ("numbers without a country code are assumed Saudi"), or show the raw input next to the canonical number in the email. |

## Could not verify

- **The real lead path**: no preview, no Studio check, no email. Writing to Sanity and sending email were out of scope by instruction. T-003's validation step ("lead appears in Studio, email arrives at fallback") remains open.
- **The Vercel Firewall rule**: it needs dashboard access, and its acceptance-criteria box is correctly left unchecked.
- **The recipients scan with real addresses**: `private.leadRouting` holds 0 recipients today. Run `npm run scan:build` again (and the recipient scan) once Lead routing is filled. The scan script checks the field name, not the address values.
- **The WhatsApp fallback in a browser**: the seeded Site settings have no WhatsApp number, so the link never renders in e2e or in the probes. It is covered only by unit tests.
- **Next's patched `fetch` with `signal`**: whether the leadRouting read with a `signal` still uses the Data Cache. I verified the abort with plain `next-sanity` outside Next. If the cache is skipped, each lead costs one extra Sanity read, which is harmless.
- **Chromium `performance.timeOrigin` drift**: how far it drifts from `Date.now()` in long-lived browser sessions or after sleep. It was measured only in a fresh headless browser (R3-06).
- **Mobile/tablet layout of the project form below `lg`**: the aside is not sticky there. Not probed beyond the existing 390 px no-horizontal-scroll e2e.
