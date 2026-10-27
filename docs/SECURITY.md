# Security notes: Sanity access and lead privacy (FEAT-002 T-006)

## Tokens

| Token | Role | Where it lives | Can do |
|---|---|---|---|
| `SANITY_API_READ_TOKEN` | Viewer | server environment only (`.env.local`, Vercel) | read the whole dataset, including drafts and leads. The site uses it with `perspective: "published"` and never queries leads. |
| `SANITY_API_WRITE_TOKEN` | Editor | server environment only | create/change/delete documents and upload assets. Used by `npm run seed` and (FEAT-004) to create `lead` documents. |
| `SANITY_REVALIDATE_SECRET` | n/a | server environment + webhook "Secret" | verifies that `/api/revalidate` calls really come from our Sanity webhook (HMAC signature). |

The write token's scope is **Editor on the whole dataset**. Sanity's per-document-type restrictions need custom roles, which are not on the free plan, so the token cannot be limited to creating `lead` documents. Mitigations: it is only read by server code (the lead endpoint in FEAT-004 and the seed script), it is never prefixed `NEXT_PUBLIC_`, and it can be rotated in sanity.io/manage -> API -> Tokens. FEAT-004 must keep it out of any module imported by client components.

A Viewer token can read every document, so "the read token cannot read leads" is **not enforceable by Sanity** on this plan. What protects leads from the website side:

1. `src/sanity/client.ts` (the only place the read token is used) starts with `import "server-only"`: importing it from a client component fails the build. A unit test pins this and that no token is read from a `NEXT_PUBLIC_` variable.
2. No GROQ query in `src/sanity/queries.ts` mentions leads, recipients or private IDs (unit test `src/sanity/lead-routing.test.ts`). The lead recipients (document `private.leadRouting`, dotted ID, so also not anonymously readable) are read only by the server-only `getLeadRecipients()` in `src/sanity/lead-routing.ts`; they are not part of `SiteSettings`, so they never reach a client component or a page. See `.ai/decisions/2026-10-27-lead-privacy.md`.
3. The build output contains neither the token names nor values (checked below).

## Leads are private even on a public dataset

Lead documents get IDs of the form `lead.<uuid>` (`src/sanity/lead-id.ts`; FEAT-004 must create them with `leadDocumentId()`).

Sanity documentation (https://www.sanity.io/docs/content-lake/ids, read 2026-10-26): "Any document ID containing a `.` is considered private ... can only be accessed when a user is logged in or a valid authentication token is provided ... The root path (also known as the published ID) is accessible without authentication, while all subpaths are private."

Verified against the real project on 2026-10-26 while the dataset was still PUBLIC (`npm run verify:privacy`; creates a test lead with the write token, checks, deletes it):

- anonymous `*[_type == "lead"]` via api.sanity.io and apicdn.sanity.io: 0 results
- anonymous query by the lead's exact ID: 0 results
- anonymous `GET /data/doc/production/<id>`: HTTP 200 but `documents: []`, `omitted: [{reason: "permission"}]`; a normal project document requested in the same call was returned
- the write token could read the lead; the test lead was deleted afterwards

Still make the dataset private (docs/SANITY-SETUP.md section 5): the dotted ID is a defence for leads, private is the setting for everything.

Never put personal data in a document ID: Sanity keeps every ID ever written until the dataset is deleted.

## Build output check

After `npm run build` with the real `.env.local`, all 651 files in `.next/static` (what browsers download) were searched for the variable names and for the actual values of the read and write tokens: no match. The names appear only in server bundles (`.next/server`), where the code reads `process.env.<NAME>`, and no token value is present there either (values are read at run time, not inlined). `SANITY_REVALIDATE_SECRET` was empty in `.env.local` at the time, so its value could not be checked.

## The Studio

`/studio` is protected by Sanity login: the page itself is static and public, but without membership in the project the Studio can read and change nothing. It is `noindex`.
