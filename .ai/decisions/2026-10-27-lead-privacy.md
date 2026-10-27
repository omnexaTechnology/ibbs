# Lead privacy: where leads and recipients live, and what the site token can do — 2026-10-27

Source: FEAT-002 Opus review (F-01, F-08), decided by the implementer under "work autonomously"; the dataset switch is a user action.

## Decision

1. **Lead data is never part of the public site contract.**
   - Leads are `lead.<uuid>` documents (dotted ID: not readable anonymously).
   - The notification recipients live in their own document, type `leadRouting`, fixed ID `private.leadRouting` (also dotted). They were removed from `siteSettings`, whose object is passed to client components and printed in every page.
   - The only reader is the server-only `getLeadRecipients()` in `src/sanity/lead-routing.ts` (FEAT-004). Page queries stay in `src/sanity/queries.ts` and must not mention leads or recipients.
2. **The `production` dataset becomes private** (user action in `.ai/USER-ACTIONS.md`, still pending). The site keeps using the **Viewer** read token, server only.
3. **Guards:** a unit test fails if any page query string mentions `lead`, `recipient` or `private.`; a unit test pins the keys the layout passes to client components; an e2e test checks, and `npm run scan:build` (a manual step after `npm run build`, not run in CI) scans the build output, that no page or RSC payload contains `leadNotificationEmails`, `leadRouting` or recipients; `npm run verify:privacy` also checks the routing document is not anonymously readable.

## Alternatives considered

- **Keep the dataset public and drop the read token from the site.** Then a stolen token could not exist, and dotted IDs keep leads and recipients private. Rejected as the default: a private dataset is the safer setting for everything else (unpublished or future document types), and the token is server-only and already scanned out of the client bundle. Still possible later; nothing in the code depends on the dataset being private.
- **Keep recipients in `siteSettings` and strip them in the view model.** Rejected: the document has a root ID, so it is anonymously readable through the API while the dataset is public.

## Residual risk

A Viewer token reads the whole dataset, including leads (Sanity cannot restrict a token per document type on this plan). If the read token leaks (Vercel env, logs, a debugging route), leads and recipients are exposed. Mitigations: token only in server code (`server-only`), never `NEXT_PUBLIC_`, the guards above, write token kept off Vercel until FEAT-004 (Production only), rotate in the Sanity dashboard if in doubt.
