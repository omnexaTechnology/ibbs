# FEAT-004 — Open questions

Answered 2026-10-26: destination = email (Resend) + Sanity leads (D1); recipients = editable in Site settings (D2).

Non-blocking (defaults in brackets):
- **Q2** Which fields are required? [name, phone, and email or message]
- **Q3** Spam protection: honeypot + rate limit, or add Cloudflare Turnstile? [honeypot + rate limit]
- **Q4** Automatic confirmation email to the visitor? [no]
- ~~Q5~~ Fallback inbox until the client sets theirs → **melamrosy72@gmail.com** (user, 2026-10-26). Use as `LEAD_FALLBACK_EMAIL`; it must also be the Resend account owner while Resend is in test mode.
