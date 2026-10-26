import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { SANITY_TAGS } from "@/sanity/queries";

/**
 * Sanity webhook target (REQ-008): when an editor publishes, Sanity POSTs `{ "_type": "..." }` here
 * and the cache tag of that document type is invalidated, so the live site updates within seconds.
 *
 * Authentication is Sanity's signed webhook: the dashboard "Secret" signs the body and sends the
 * signature in the `sanity-webhook-signature` header; we verify it with SANITY_REVALIDATE_SECRET.
 * Anything unsigned, wrongly signed, or received while the secret is not configured gets 401.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.error("[revalidate] SANITY_REVALIDATE_SECRET is not set: rejecting the request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    // `false`: no extra wait for Content Lake propagation; the site reads without the API CDN.
    parsed = await parseBody<{ _type?: string }>(req, secret, false);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (parsed.isValidSignature !== true) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = parsed.body?._type;
  const tags = Object.values(SANITY_TAGS) as string[];
  if (!type || !tags.includes(type)) {
    // Signed but not a type the site shows (e.g. a lead): nothing to refresh.
    return NextResponse.json({ revalidated: false, type: type ?? null });
  }

  // { expire: 0 }: the next request waits for fresh data instead of being served stale.
  revalidateTag(type, { expire: 0 });
  return NextResponse.json({ revalidated: true, type });
}
