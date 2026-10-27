# FEAT-004 — Impact analysis

Date: 2026-10-26.

## Summary
Three forms (contact, project request, call request) posting to one server endpoint that saves a `lead` in Sanity, emails the recipients from the private Lead routing document (`getLeadRecipients()`) via Resend, and returns a localized result.

## Affected areas
| Area | Effect |
|---|---|
| Dependencies | `react-hook-form` 7, `zod` 4, `@hookform/resolvers`, `resend` 6.x, `@react-email/components` (email template). |
| Endpoint | **Route handler** `src/app/api/leads/route.ts` rather than a server action: a fixed path lets a Vercel Firewall rate-limit rule target it, and it is easy to test. |
| Sanity | Writes `lead` docs with `SANITY_API_WRITE_TOKEN` (server only); reads the recipients with the server-only `getLeadRecipients()` (document `private.leadRouting`, type `leadRouting`; NOT `siteSettings`, review F-01). Falls back to `LEAD_FALLBACK_EMAIL` when the list is empty. |
| Email | Resend sender on a verified domain. **Before the client domain exists, Resend can only send to the Resend account owner's address** (test mode) → env fallback `LEAD_FALLBACK_EMAIL` must be that address until the domain is verified. |
| Spam | Honeypot field + timing check (submitted < 2s after render = bot) + Vercel Firewall rate limit on `/api/leads` (e.g. 5/min per IP). |
| UI | `src/components/forms/{contact-form,project-form,call-form,form-success}.tsx`, used on contact page, project page ("planning a similar project?"), and the quick call block. |
| Messages | Field labels, errors, success texts from the design's `T` (`okTitle`, `okBody`, `okAgain`, `quickDone`, `spaceTypes`) → `messages/*.json`. |
| Env vars | `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_FALLBACK_EMAIL`, `SANITY_API_WRITE_TOKEN`. |

## Files/modules likely involved
`src/lib/validation/lead.ts`, `src/app/api/leads/route.ts`, `src/lib/leads/{save,notify}.ts`, `src/emails/new-lead.tsx`, `src/components/forms/*`, `messages/{en,ar}.json`, tests under `src/**/__tests__` and `e2e/leads.spec.ts`.

## Dependencies
- FEAT-001 (layout, messages), FEAT-002 (`lead` schema, `siteSettings`, write token).
- Client domain + DNS for Resend verification (FEAT-001 Q4) — needed before real delivery to the client's inbox, not for building.

## Risks
- **R1 (medium)** Email delivery to the client's inbox is blocked until a domain is verified in Resend. Build and test with the fallback; real delivery lands with FEAT-005 launch.
- **R2 (low)** Saudi phone validation too strict could reject valid numbers → accept international E.164 too (BR-002).
- **R3 (low)** Leads hold personal data; never log request bodies (NFR-002).

## Unaffected areas
3D, page sections other than the form slots.

## Open questions
Non-blocking: required fields, Turnstile, confirmation email, fallback inbox address.

## Recommended implementation order
Schema + endpoint (save + notify) → forms UI → wire into pages → tests.

IMPACT STATUS: READY_FOR_PLAN
