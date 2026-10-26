# FEAT-004 — Lead forms: contact, project request, call request

SPEC STATUS: READY_FOR_IMPACT_ANALYSIS (2026-10-26)
Source: `design-reference/Main.dc.html` form markup (`f-*` contact form, `pf-*` project form), quick "request a call" form, `submit` logic posting to `formEndpoint`, success state (`okTitle`, `okBody`, `okAgain`), `spaceTypes`. Questions: `questions.md`.

## Goal
Every request a visitor sends reaches the IBSS sales team reliably, and the visitor sees a clear confirmation.

## Confirmed decisions
- D1 Each submission is emailed to the sales team via Resend **and** saved as a `lead` document in Sanity (schema in FEAT-002 REQ-006) (user, 2026-10-26).
- D2 The notification email goes to the **lead notification emails** set in Sanity Site settings (FEAT-002 REQ-005b), so the client chooses and changes the inbox themselves. Until it is set, emails go to an Omnexa address configured as an env fallback.

## Requirements
- **REQ-008** Delivery order: save the lead in Sanity first, then send the email, then set `emailDelivered`. If one of the two succeeds the visitor sees success; if both fail, the error state (BR-003).
- **REQ-009** The Sanity write token lives only on the server (env var), never in the browser.
- **REQ-001** Contact form and project form, fields: name, company, email, phone, space type (select, 8 options from `spaceTypes`), area, message.
- **REQ-002** Quick "request a call" form (phone, optionally name) with its own thank-you text (`quickDone`).
- **REQ-003** Server-side handling in a Next.js route handler / server action; no third-party form endpoint in the browser.
- **REQ-004** Validation on client and server with the same schema; localized error messages.
- **REQ-005** Success and error states as in the design; "send another request" resets the form.
- **REQ-006** Spam protection (honeypot + rate limit; Cloudflare Turnstile if Q3 says so).
- **REQ-007** Each submission records locale, page URL and form type.

## Business rules
- **BR-001** Required: name, phone, and at least one of email or message — pending Q2 (design marks no required fields explicitly).
- **BR-002** Phone accepts Saudi formats (`05xxxxxxxx`, `+9665xxxxxxxx`) and international numbers.
- **BR-003** A failed delivery never shows a success message.

## Non-functional
- **NFR-001** Submission response < 2s; errors logged.
- **NFR-002** No personal data written to logs.

## Acceptance criteria
- **AC-001** A valid submission reaches the destination chosen in Q1 within a minute, with all fields, locale and page.
- **AC-002** Invalid email/phone shows an inline localized error; nothing is sent.
- **AC-003** A bot filling the honeypot gets a fake success; nothing is sent.
- **AC-004** When delivery fails the visitor sees an error with WhatsApp as fallback.

## Assumptions
- A1 Resend sends from a verified sender on the client's domain (needs DNS access — FEAT-001 Q4).

## Out of scope
CRM integration, auto-replies to the visitor (unless Q4), file uploads.

## Open
See `questions.md`.
