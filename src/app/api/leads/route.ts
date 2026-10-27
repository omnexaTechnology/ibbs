import { NextResponse } from "next/server";
import { markEmailDelivered, saveLead, toLeadRecord } from "@/lib/leads/save";
import { notifyLead } from "@/lib/leads/notify";
import { MAX_BODY_CHARS, MIN_FILL_MS, leadSchema, toFieldErrors, type LeadResponse } from "@/lib/validation/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const respond = (body: LeadResponse, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Log a failure WITHOUT request data (NFR-002): only which step failed and the error class.
 * Error messages can echo submitted content, so they are not logged.
 */
function logFailure(step: "sanity-save" | "email" | "sanity-patch", error: unknown) {
  console.error(`[leads] ${step} failed (${error instanceof Error ? error.name : "unknown"})`);
}

export async function POST(request: Request): Promise<Response> {
  // 1. Size limit, before parsing anything.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_CHARS) return respond({ ok: false, error: "too_large" }, 413);
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return respond({ ok: false, error: "too_large" }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return respond({ ok: false, error: "invalid", fields: {} }, 400);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return respond({ ok: false, error: "invalid", fields: {} }, 400);

  // 2. Honeypot: a bot gets a fake success and nothing is stored or sent (AC-003).
  const honeypot = (raw as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") return respond({ ok: true }, 200);

  // 3. Same schema as the browser.
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return respond({ ok: false, error: "invalid", fields: toFieldErrors(parsed.error) }, 400);

  // 4. Timing: submitted faster than a human can type (or no timing at all) = bot, fake success.
  const { elapsedMs } = parsed.data;
  if (elapsedMs === undefined || elapsedMs < MIN_FILL_MS) return respond({ ok: true }, 200);

  // 5. Deliver (REQ-008): save, then email, then flag the lead. One of the two succeeding is a success (BR-003).
  const record = toLeadRecord(parsed.data);
  let leadId: string | null = null;
  try {
    leadId = await saveLead(record);
  } catch (error) {
    logFailure("sanity-save", error);
  }

  let emailed = false;
  try {
    await notifyLead(record);
    emailed = true;
  } catch (error) {
    logFailure("email", error);
  }

  if (leadId && emailed) {
    try {
      await markEmailDelivered(leadId);
    } catch (error) {
      logFailure("sanity-patch", error);
    }
  }

  if (!leadId && !emailed) return respond({ ok: false, error: "delivery_failed" }, 502);
  return respond({ ok: true }, 200);
}
