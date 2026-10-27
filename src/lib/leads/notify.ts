import "server-only";
import { Resend } from "resend";
import { renderNewLeadEmail } from "@/emails/new-lead";
import { getLeadRecipients } from "@/sanity/lead-routing";
import type { LeadRecord } from "./save";

/** Resend's shared test sender; works without a verified domain (only delivers to the account owner). */
const DEFAULT_FROM = "IBSS Website <onboarding@resend.dev>";

export const EMAIL_TIMEOUT_MS = 5_000;

/** Studio recipients (private leadRouting), else LEAD_FALLBACK_EMAIL (D2). Empty = nobody to notify. */
export async function resolveRecipients(): Promise<string[]> {
  let fromStudio: string[] = [];
  try {
    fromStudio = await getLeadRecipients();
  } catch (error) {
    // Sanity unreachable or not configured: use the fallback below. Logged without data (NFR-002).
    console.error(`[leads] recipients-fallback (${error instanceof Error ? error.name : "unknown"})`);
  }
  if (fromStudio.length) return fromStudio;
  const fallback = process.env.LEAD_FALLBACK_EMAIL?.trim();
  return fallback ? [fallback] : [];
}

/** Step 2 of REQ-008. Throws on any failure (no recipient, no API key, Resend error). */
export async function notifyLead(record: LeadRecord): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set.");
  const to = await resolveRecipients();
  if (!to.length) throw new Error("No lead recipient configured.");

  const { subject, html, text } = renderNewLeadEmail(record);
  // The signal aborts our wait, not an email Resend already accepted; with no retry that cannot duplicate (R2-03, R3-05).
  const { error } = await new Resend(apiKey).emails.send(
    {
      from: process.env.LEAD_FROM_EMAIL?.trim() || DEFAULT_FROM,
      to,
      replyTo: record.email,
      subject,
      html,
      text,
    },
    { signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS) },
  );
  if (error) throw new Error(`Resend rejected the email (${error.name}).`);
}
