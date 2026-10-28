# FEAT-004 — Review fixes (F4-01 … F4-13)

Commits: `8f7e019` (validation/save), `6c3d689` (route/notify/email), `13af0d2` (forms UI/messages).

| ID | Status | What was done |
|---|---|---|
| F4-01 | fixed | `method="post"` on `<form>` in `request-form.tsx` and `call-form.tsx` (covers contact/project too). Submit disabled until mounted (`ready` from `useSyncExternalStore`, false on server/hydration). Test: all three forms have `method=post` and enabled buttons after mount. |
| F4-02 | fixed | `startedAt` set only on mount and in `reset()`; no longer restarts on `idle`. Test: resend after a server 400 reports larger `elapsedMs`. |
| F4-03 | fixed | Route returns 415 unless `content-type` starts with `application/json`. Test added. `Sec-Fetch-Site` check skipped (optional). |
| F4-04 | fixed | Body read via stream reader, cancelled with 413 once over `MAX_BODY_BYTES` (renamed from `MAX_BODY_CHARS`, now bytes). Test with a chunked body without Content-Length. |
| F4-05 | fixed | (a) `normalizePhone` NFKC-normalizes (`＋`, full-width digits) and strips `\p{Cf}`, dashes, NBSP. (b) Saudi landlines ACCEPTED (`01[1-467]xxxxxxx`, also `966`/`+966`; `9200xxxxx`; `800xxxxxxx`). (c) `+9660…` trunk 0 dropped; anything starting `+966` must satisfy Saudi rules (so `0096650123` is rejected). Cases added to `lead.test.ts`. |
| F4-06 | fixed | `aria-required` on input/textarea/select when `required`. Test added. |
| F4-07 | fixed | Honeypot renamed `hp_extra` (constant `HONEYPOT_FIELD`) on client, schema and route; label "Leave this empty"; `data-1p-ignore`, `data-lpignore`, `data-bwignore`, `data-form-type="other"`. Old `website` name dropped (forms are not mounted on any page yet). |
| F4-08 | fixed | Client sends `window.location.pathname` only; schema keeps only a path matching `^/[\w\-/%.~]{0,199}$`, anything else (full URLs, junk) becomes undefined. Email "Sent from" shows the path; full URL not rebuilt (not needed). |
| F4-09 | fixed | (a) Fallback to `LEAD_FALLBACK_EMAIL` kept; read failure logs `[leads] recipients-fallback (<ErrorName>)`, no PII. Test added. (b) Sanity write client `timeout` 8 s for create (runs in parallel with the email), 3 s for the flag patch; Resend wrapped in 5 s `Promise.race`. |
| F4-10 | fixed | `oneLine` strips `\p{Cc}`, `\p{Cf}`, U+2028/2029. Test added. |
| F4-11 | fixed | Banner now "Please correct the highlighted fields." (EN/AR). |
| F4-12 | fixed | `maxLength` on name 120, company 160, email 254, phone 40, area 20, message 5000. Area normalized with `normalizeDigits` in the schema (Arabic-Indic to ASCII). |
| F4-13 | fixed | Added tests: double submit, clock after 400, form method, Content-Type 415, chunked 413, phone cases, pageUrl, recipients-fallback log, control chars. |

## Decisions for USER-ACTIONS
- Saudi landlines and unified numbers are accepted; the client may narrow this.
- Before launch set `LEAD_FALLBACK_EMAIL` to a client-owned address and `LEAD_FROM_EMAIL` to the verified domain; the fallback is used on any recipients read failure too.
- `pageUrl` stores a path only (no host).
- Update `impact.md`/T-001 expected file name `.tsx` to `.ts` for the email template (review note, not done here).

## R2 fixes (review-2.md)

| ID | Status | Change |
|---|---|---|
| R2-01 | fixed | `use-lead-form.ts`: on mount, if any non-honeypot field already has text, `startedAt = performance.timeOrigin` (page age); otherwise `Date.now()`. Test: SSR markup with typed values, `hydrateRoot`, immediate send, `elapsedMs >= 2000` (fails without the fix). |
| R2-02 | fixed | `sanityFetch` takes an optional `signal`; `getLeadRecipients` passes `AbortSignal.timeout(3000)` (`RECIPIENTS_TIMEOUT_MS`). Rejection already falls back to `LEAD_FALLBACK_EMAIL`. Tests: signal passed through; a hanging read rejects with `TimeoutError` after 3 s. |
| R2-03 | fixed | `notify.ts`: `withTimeout` removed; `emails.send(payload, { signal: AbortSignal.timeout(5000) })` (option verified in resend 6.34.1 typings: `RequestOptions.signal`). Tests: signal passed; an error result counts as failure. No `idempotencyKey` added (not requested). |
| R2-04 | fixed | `save.ts` comment now describes the sequential save, email, patch worst case. |
| R2-05 | fixed | Path regex requires `/en` or `/ar` (optionally followed by `/...`, up to 190 chars). Tests for accepted and rejected paths (`//host`, `/www.host`, `/`, `/fr/x`...). |
| R2-06 | fixed | `normalizePhone` stores Saudi mobiles as `+9665XXXXXXXX` and landlines as `+9661XXXXXXXX`; 9200/800 stay digits. Tests added; two existing expectations updated (`٠٥٠…` and the route test's stored phone). |
| R2-07 | fixed | `renderToString` test: all 3 submit buttons have `disabled`, all forms `method="post"`. The `hydrateRoot` no-console.error check was not added (the R2-01 test already hydrates). |

Decisions: a bare landline without trunk 0 (`11 234 5678`) is now accepted too, as a side effect of the canonical rule (same as bare mobiles). `9201`-`9209` unified numbers still rejected (needs client confirmation).
Validation: lint, tsc, build pass; vitest 22 files, 264 tests.
