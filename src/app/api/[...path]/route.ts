// Unknown /api/* paths answer with a JSON 404 (not an HTML page). Real API routes added later
// (FEAT-002 revalidate webhook, FEAT-004 lead endpoints) are more specific and win over this.
const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
