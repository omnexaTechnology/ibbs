# Sanity setup (FEAT-002)

Project ID `zf4tpgl3`, dataset `production`, on Omnexa's Sanity account. Everything the code needs is already in the repo; this file lists the steps that only a person with dashboard access can do. Never paste token values into chat, issues or commits.

Done already (by Claude, using the tokens in `.env.local`): the seed has been run (6 projects, 4 hero images, empty Site settings), and the privacy check passed. See sections 7 and 8.

## 1. Environment variables

Copy `.env.example` to `.env.local` (it is git-ignored) and fill in:

| Variable | Where it comes from | Used by |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `zf4tpgl3` (public) | Studio and site |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` (public) | Studio and site |
| `SANITY_API_READ_TOKEN` | token with role **Viewer** (section 3) | the site, server only |
| `SANITY_API_WRITE_TOKEN` | token with role **Editor** (section 3) | seed script now, lead creation in FEAT-004; server only |
| `SANITY_REVALIDATE_SECRET` | any long random string you invent (section 4) | `POST /api/revalidate` |

In **Vercel**: Project -> Settings -> Environment Variables, add the same five for **Production** and **Preview** (not "Development"). Redeploy afterwards. Never prefix a token with `NEXT_PUBLIC_`.

The site still builds and runs with none of these set (it shows built-in defaults), so a missing variable never breaks a deploy; it only means no Sanity content.

## 2. CORS origins (needed for the Studio at /studio)

sanity.io/manage -> project **zf4tpgl3** -> **API** -> **CORS origins** -> **Add CORS origin**. Add each of these with **Allow credentials** switched ON:

1. `http://localhost:3000`
2. your production domain, e.g. `https://www.your-domain.com`
3. the Vercel production URL, e.g. `https://ibbs.vercel.app`
4. Vercel preview URLs. Previews have a different host for every branch, so either add each one you want to use the Studio on, or add a wildcard origin such as `https://*-your-team.vercel.app` (Sanity supports a `*` wildcard in the subdomain).

Without the right origin the Studio at that address shows a "CORS origin not allowed" screen.

## 3. API tokens

sanity.io/manage -> project -> **API** -> **Tokens** -> **Add API token**.

- Name `ibss-site-read`, permissions **Viewer** -> copy into `SANITY_API_READ_TOKEN`.
- Name `ibss-site-write`, permissions **Editor** -> copy into `SANITY_API_WRITE_TOKEN`.

A token is shown once. Keep them only in `.env.local` and Vercel. If one leaks, delete it in the same screen and create a new one.

## 4. Publish webhook (Studio publish -> live site within about a minute)

Needs the site to be deployed first (the URL must be reachable by Sanity).

sanity.io/manage -> project -> **API** -> **Webhooks** -> **Create webhook**:

| Field | Value |
|---|---|
| Name | `ibss-revalidate` |
| URL | `https://<your-domain>/api/revalidate` (for a preview test use that preview's URL) |
| Dataset | `production` |
| Trigger on | Create, Update, Delete (Delete also fires when someone unpublishes) |
| Filter | `_type in ["project", "heroSlides", "siteSettings", "leadRouting"]` |
| Projection | `{"_type": coalesce(_type, before()._type)}` (type only: never add fields, the webhook must not carry content or recipients) |
| HTTP method | POST |
| Drafts / Versions | leave **off** (only publishes should trigger it) |
| Secret | the same value as `SANITY_REVALIDATE_SECRET` |
| Enabled | on |

How to check it: edit a project in the Studio, publish, open the webhook's **Attempts** log in the dashboard (expect HTTP 200 with `{"revalidated":true,"type":"project"}`), reload the live page. A wrong secret gives HTTP 401. As a safety net the site also re-reads Sanity at least once an hour even if a webhook is missed.

## 5. Make the dataset private (recommended)

The `production` dataset is currently **public** (anyone can read published content through the API). Content on the site is public anyway, but private is the safe setting.

sanity.io/manage -> project -> **Datasets** -> `production` -> **Edit** (or the three-dot menu) -> set visibility to **Private**.

What changes: anonymous API requests start to fail; the site keeps working because it sends `SANITY_API_READ_TOKEN`; images on `cdn.sanity.io` stay public. Check afterwards: open the site, and run `npm run verify:content` locally (should still pass).

Leads are protected either way, see `docs/SECURITY.md`.

## 6. Open the Studio

- Locally: `npm run dev`, open http://localhost:3000/studio, sign in with the Sanity account (Google/GitHub/email). Only people who are members of the project can do anything in it.
- Invite the client's editors: sanity.io/manage -> project -> **Members** -> **Invite members**, role **Editor** (can edit and publish content, cannot change project settings).
- Check the desk shows: **Projects**, **Hero images**, **Site settings**, **Lead routing (private)**, **Leads**. The seeded projects and hero images are already there; **Site settings** is empty on purpose: fill in phones, emails, WhatsApp number and social links, then Publish.
- **Lead routing (private)** is where the "who receives new enquiries by email" addresses go. It is a separate document with a hidden ID (`private.leadRouting`), so it is not readable by the public and never appears in any web page. Site settings is public (its content is printed on the website); do not put internal addresses there.
- Placing the dots on a project's cover photo: open the project, scroll to "Points of interest", open one, click the photo. (This picker has been built but not yet tried in a live Studio; please tell us if it misbehaves.)

## 7. The seed script

`npm run seed` uploads the 18 design images and creates 6 projects, the hero images, an empty Site settings document (only the WhatsApp first message) and an empty private Lead routing document.

- Safe to re-run: it only creates what is missing and never overwrites edits made in the Studio. Images are matched by content hash, so nothing is uploaded twice.
- `npm run seed -- --dry-run` shows what it would do and needs no token.
- `npm run seed -- --force` overwrites the seeded documents with the design content (this **discards** Studio edits to them; use only to reset). It never touches Lead routing, so the recipients survive.
- Needs `NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_API_WRITE_TOKEN` in `.env.local`.

Run history (dataset `production`): 2026-10-26 first run created 18 image assets + 8 documents; second run created nothing. 2026-10-27 (review F-01): created the empty `private.leadRouting` document, everything else already existed.

## 8. Useful commands

| Command | What it does |
|---|---|
| `npm run schema:validate` | checks the Studio schema |
| `npm run typegen` | regenerates `src/sanity/types.ts` after changing schemas or queries (needs `.env.local`) |
| `npm run verify:content` | the site's own queries against the real dataset |
| `npm run verify:privacy` | creates a test lead, proves it and the Lead routing document are not readable anonymously, deletes the test lead |
| `npm run sanity -- <command>` | the Sanity CLI with `.env.local` loaded (e.g. `cors list`, after `sanity login`) |
