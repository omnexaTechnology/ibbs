# FEAT-004 — Re-review of fixes (F4-01 … F4-13)

Reviewer: Claude (re-reviewer agent), 2026-10-27
Scope: fix commits `8f7e019`, `6c3d689`, `13af0d2`, `b41a972` (diff `c802a79..b41a972`), branch `feat/FEAT-004-forms`, worktree `ibss-web-feat004`.

## Verdict: FIX_REQUIRED

One major item remains (R2-01): F4-02 is only half fixed. The review's second case, "typed before hydration and sent within 2 s of mount", is still open, and the F4-01 fix makes it more likely. The submit button is now disabled until hydration, so a visitor who filled the form early taps Send again the moment it enables. That submit is less than 2 s after mount, so the lead is dropped while the visitor sees a success message. It is a small fix. Everything else is minor or nit. F4-01, F4-03, F4-04, F4-06, F4-07, F4-10, F4-11 and F4-12 are fixed correctly. F4-05 and F4-08 are fixed, with nits. F4-09 is only partly fixed (R2-02, R2-03).

## Validation (run in the worktree)

| Check | Result |
|---|---|
| `npm run lint` | pass (exit 0) |
| `npx tsc --noEmit` | pass (exit 0) |
| `npx vitest run` | pass: 22 files, 238 tests (218 before the fixes, +20) |
| `npm run build` (no Sanity/Resend env) | pass (exit 0); `ƒ /api/leads` present |
| Client chunks (`.next/static`) scanned for `SANITY_API_WRITE_TOKEN`, `RESEND_API_KEY`, `LEAD_FALLBACK_EMAIL`, `api.resend.com`, `onboarding@resend.dev` | 0 hits |

Extra checks I wrote myself. They lived in a temporary `src/__r2tmp/`, which I deleted afterwards. Nothing was committed and nothing reached the network.

| Check | Result |
|---|---|
| F4-01: `renderToString` then `hydrateRoot` (jsdom) of `CallForm` + `ContactForm` | Server HTML: both submit buttons have `disabled=""`, and both forms have `method="post"`. After hydration both buttons are enabled. There were **0** `console.error` calls and **0** `onRecoverableError` calls, so no hydration mismatch. `useSyncExternalStore(subscribeNever, () => true, () => false)` is the standard "hydrated" pattern: the server snapshot (`false`) is used for SSR and hydration, then React re-renders with the client snapshot (`true`). On client-side navigation it is `true` from the first render. |
| F4-04: stream of 9,105 bytes of Arabic text in 7-byte chunks (characters split across chunks) | 200. `name` and `message` are stored byte-for-byte correct (`Buffer.concat` before decoding). |
| F4-04: 15,000 Arabic characters (30,105 bytes, under the limit in characters, over it in bytes) in 1,000-byte chunks | 413. The stream's `cancel()` was called after 21 pulls, so the rest was never read. |
| F4-03: Content-Type variants | `Application/JSON` and `application/json;charset=UTF-8` are accepted. `text/plain;application/json` and a missing header get 415. `application/jsonx` passes the prefix check, which is harmless because it is not a CORS "simple" type either. |
| F4-09: `@sanity/client` 8.11 against a local server that never answers, `timeout: 400` | `create` and `patch` reject after about 410–420 ms with `TimeoutError`. The socket is closed and there is no retry (1 hit). A `fetch` without `timeout` was still hanging at 3 s (the default is 300 s; see R2-02). |
| F4-09: log content | `[leads] recipients-fallback (<ErrorName>)` and `[leads] sanity-save failed (TimeoutError)` contain only the step and the error class, no PII. The existing route test checks that `"Sara"` is absent. |
| F4-05: table of 57 numbers through `isValidPhone`/`normalizePhone` | See the phone section below. |

## Per-finding status

| ID | Status | Notes |
|---|---|---|
| F4-01 | fixed | `method="post"` on both forms. The button is disabled in SSR and during hydration and enabled afterwards, with no mismatch (verified above). Side effect: R2-01. Trade-off: visitors without JS cannot submit at all (accepted; see "not verified"). |
| F4-02 | **partly fixed** | The clock no longer restarts on `idle`, and `reset()` restarts it. The pre-hydration case from the original finding is not handled (R2-01). |
| F4-03 | fixed | 415 before reading the body. A test was added. |
| F4-04 | fixed | Bytes are counted while streaming, the stream is cancelled on overflow, multibyte text is handled correctly, and the constant is renamed `MAX_BODY_BYTES`. |
| F4-05 | fixed | See the phone section. Nit R2-06. |
| F4-06 | fixed | `aria-required` on input, textarea and select when the field is required. |
| F4-07 | fixed | `HONEYPOT_FIELD = "hp_extra"` is used by `fields.tsx` and `route.ts:49`. The schema key `hp_extra` and `LeadRecord`'s `Omit<…, "hp_extra" …>` are string literals with the same value. The route test checks that `hp_extra` is not stored. The `data-1p-ignore`/`lpignore`/`bwignore`/`form-type` attributes are present. |
| F4-08 | fixed, with nit | The client sends only the pathname, and the schema drops full URLs. The path regex still lets a `//host` or `/www.host` path through (R2-05). |
| F4-09 | **partly fixed** | (a) The fallback log is fine. (b) The Sanity write timeouts work (verified). The Resend race does not abort the request (R2-03). The recipients read has no timeout at all (R2-02). A comment says the save runs in parallel with the email, which is wrong (R2-04). |
| F4-10 | fixed | `oneLine` strips `\p{Cc}`, `\p{Cf}` and U+2028/2029. |
| F4-11 | fixed | Generic banner in EN and AR. |
| F4-12 | fixed | `maxLength` values match the schema. `area` goes through `normalizeDigits`. |
| F4-13 | fixed | Tests were added. Gaps remain: R2-07. |

## F4-05 — phone rules vs. real Saudi numbering

- **Landlines `0 1[1-467] xxxxxxx`**: correct. 011 (Riyadh/central), 012 (Makkah/Jeddah/Taif), 013 (Eastern Province), 014 (Madinah/Tabuk/north), 016 (Qassim/Ha'il) and 017 (south: Asir/Jazan/Najran/Al-Baha) are the full set of geographic area codes. 010, 015, 018 and 019 are not allocated, and they are rejected. A 7-digit subscriber number gives the correct total of 10 digits with the trunk 0. `+966 1x…`, `966 1x…`, `00966 1x…` and `+966 011…` (trunk 0 dropped) are all accepted.
- **`800xxxxxxx`**: correct. Saudi toll-free numbers are `800` plus 7 digits (`800 124 6000`). An 11-digit or 7-digit version is rejected. `+966 800…` is rejected, which is acceptable because toll-free numbers are not dialled from abroad.
- **`9200xxxxx`**: matches the common unified-number format (`920 0XX XXX`). I could not confirm whether `9201`–`9209` blocks are allocated. They are rejected today (low impact: a callback number is rarely a unified number).
- **Mobile `(+966|966|0)?5xxxxxxxx`**: accepts every `05x`, including prefixes that may be unallocated (for example 052). Accepting a few extra numbers is harmless.
- **Invalid but accepted**: nothing that matters. Short or long forms, `+966` with too few digits, `07/08/09…`, letters (`05O…`) and `ext` are all rejected.
- **Valid but rejected**: only rare spellings. A landline without the trunk 0 (`11 234 5678`), a unified number written with `+966`/`0`, and a foreign number without `+`/`00` (`971…`, as before). Arabic-Indic, Eastern Arabic-Indic and full-width digits, the full-width `＋`, NBSP, and bidi marks (U+202A–202E, U+2066–2069) are all normalized and accepted.

## Findings

| ID | Severity | File:line | Issue | Suggested fix |
|---|---|---|---|---|
| R2-01 | **major** | `src/components/forms/use-lead-form.ts:27-29` | `startedAt` is set in the mount effect, which runs at **hydration**. On SSR pages a visitor can type before hydration (Three.js pages hydrate slowly on mobile). With F4-01 the button is disabled until then, so the natural action is to tap Send again the moment it enables. That is less than 2 s after mount, so `elapsedMs < MIN_FILL_MS`, the server returns a fake `{ok:true}`, and the lead is dropped behind a success message (BR-003). This was the second case in F4-02 and was not addressed. | On mount, measure from page load if the form already holds input. For example: `const typed = [...new FormData(formRef.current!).entries()].some(([k, v]) => k !== HONEYPOT_FIELD && typeof v === "string" && v !== ""); startedAt.current = typed ? performance.timeOrigin : Date.now();`. Add a test that renders with pre-filled values and submits right away. |
| R2-02 | minor | `src/lib/leads/notify.ts:21` → `src/sanity/lead-routing.ts:15-17` → `src/sanity/fetch.ts:24` | The recipients read has no timeout (the `@sanity/client` default is 300 s; verified to still hang). When Sanity hangs, which is the case F4-09(b) targets, the create times out at 8 s, then `resolveRecipients()` hangs. The `LEAD_FALLBACK_EMAIL` path never runs, and the function hits its max duration. The lead is lost even though Resend was up. | Give the read a short timeout (about 3 s), for example an optional `timeout` in `sanityFetch` passed as a request option, or `createReadClient().withConfig({ timeout })` in `getLeadRecipients`. Its rejection already falls back. Add a test: the read never resolves, and the email still goes to the fallback. |
| R2-03 | minor | `src/lib/leads/notify.ts:13-14`, `:39-50` | `Promise.race` stops waiting but does not abort the request. If Resend answers after 5 s, the email is sent but counted as failed. If the save also failed, the visitor gets a 502, resends, and sales gets a duplicate. The timer is never cleared (it is `unref`'d, so harmless). Resend 6.34.1 supports aborting: `emails.send(payload, { signal })`, and its `fetchRequest` returns `{error}` on abort. | `new Resend(apiKey).emails.send({...}, { signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS) })` and remove `withTimeout`. Optionally add `idempotencyKey` (for example the lead ID) to block duplicates on retry. |
| R2-04 | nit | `src/lib/leads/save.ts:7` vs `src/app/api/leads/route.ts:63-75` | The comment says "The create runs in parallel with the email, so both share one ~8 s window". The route awaits save, **then** email, **then** patch, so the worst case is about 8 + read + 5 + 3 s (with no limit on the read until R2-02 is fixed). The comment hides the real limit. | Fix the comment. If NFR-001 matters under degraded conditions, also run save and email with `Promise.allSettled` (the patch already waits for both). |
| R2-05 | nit | `src/lib/validation/lead.ts:78` | `PATH` accepts `//evil.test/x` (verified: stored as-is) and `/www.evil.test/login`. Gmail and Outlook auto-link domain-like text, so the "Sent from" line can still show a foreign link. The impact is the same as the free-text `message`, hence nit. A protocol-relative `//host` would also become a real foreign URL if anyone later builds `new URL(path, origin)`. | Require the locale prefix: `/^\/(?:en\|ar)(?:\/[\w\-/%.~]{0,190})?$/` (this also rejects `//`). |
| R2-06 | nit | `src/lib/validation/lead.ts:41-45`, `:61-66` | The stored "normalized" phone has several shapes for the same Saudi mobile: `0501234567`, `501234567`, `966501234567`, `+966501234567` (verified). That makes searching and de-duplicating in Studio harder. `9201`–`9209` unified numbers and `+966`-prefixed unified/toll-free numbers are rejected (see the phone section). | Make Saudi numbers canonical in `normalizePhone` (mobile and landline → `+966…`). Optionally widen unified numbers to `92\d{7}` if the client confirms. |
| R2-07 | nit | `src/components/forms/forms.test.tsx` (F4-01 test) | The F4-01 test only checks that the button is enabled after a client render. Nothing pins the server-rendered `disabled` state, so a refactor to `useState(true)` would pass the test and bring F4-01 back. There is also no test for R2-01. | Add a `renderToString` assertion (submit button has `disabled`, form has `method="post"`) and a `hydrateRoot` check for no `console.error`. I used exactly this setup in the temporary check above. |

Counts: blocker 0, major 1, minor 2, nit 4.

## New issues checked and not found

- PII: there is no request data in any new log line (`recipients-fallback`, `TimeoutError` names only). The URL now carries only the path. The 415 and 413 responses carry no data. Resend's own `logError` prints only when `NODE_ENV !== "production"`.
- Security: the 415 check runs before the body is read. The size check runs while streaming. The honeypot is checked before the schema. No secret appears in client chunks.
- a11y: `aria-required` is correct. The honeypot label "Leave this empty" sits inside an `aria-hidden` wrapper with `tabIndex={-1}`. The disabled-before-hydration button still keeps its accessible name.
- RTL/i18n: only the `fInvalid` text changed, and the EN and AR keys still match.

## Could not verify

- Behaviour in a real browser or device: how often visitors type before hydration on the real pages (the forms are not mounted until T-003), and what password managers do with `hp_extra`.
- What the App Router returns for a native POST to a page route. This is moot while the button is disabled, but visitors with JavaScript disabled cannot submit at all now. That is an accepted trade-off of F4-01 and should be noted in USER-ACTIONS: the phone/WhatsApp alternatives must be visible on the page.
- Real Sanity and Resend timing (no calls were made). Whether the Sanity read client retries GET queries when combined with a timeout (R2-02 fix).
- Allocation of Saudi unified-number blocks other than `9200` and of unused `05x` mobile prefixes (checked from knowledge of the national plan, not from an official CST table).
- Whether any page path will be longer than 199 characters after percent-encoding (an Arabic slug of about 20 characters would get close). `pageUrl` would then be silently dropped. Low impact.
