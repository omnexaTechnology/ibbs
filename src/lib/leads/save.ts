import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "@/sanity/env";
import { leadDocumentId } from "@/sanity/lead-id";
import { SPACE_TYPE_LABELS_EN, type LeadInput } from "@/lib/validation/lead";

/**
 * Sanity write client (REQ-009): server only, token from SANITY_API_WRITE_TOKEN (no NEXT_PUBLIC_
 * prefix). Created per call so a missing token fails that call, not the module import.
 */
function createWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!isSanityConfigured || !token) throw new Error("Sanity write access is not configured.");
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token });
}

/** A lead as stored and as emailed (space type already turned into its English label). */
export type LeadRecord = Omit<LeadInput, "website" | "elapsedMs" | "spaceType"> & { spaceType?: string };

export function toLeadRecord(input: LeadInput): LeadRecord {
  const { website, elapsedMs, spaceType, ...rest } = input;
  void website;
  void elapsedMs;
  return { ...rest, spaceType: spaceType ? SPACE_TYPE_LABELS_EN[spaceType] : undefined };
}

/** Step 1 of REQ-008: create the `lead.<uuid>` document (dotted ID = private). Returns its ID. */
export async function saveLead(record: LeadRecord, now: Date = new Date()): Promise<string> {
  const doc = await createWriteClient().create(
    {
      _id: leadDocumentId(),
      _type: "lead",
      handled: false,
      formType: record.formType,
      name: record.name,
      company: record.company,
      email: record.email,
      phone: record.phone,
      spaceType: record.spaceType,
      area: record.area,
      message: record.message,
      locale: record.locale,
      pageUrl: record.pageUrl,
      createdAt: now.toISOString(),
      emailDelivered: false,
    },
    { visibility: "async" },
  );
  return doc._id;
}

/** Step 3 of REQ-008: record that the notification email went out. */
export async function markEmailDelivered(id: string): Promise<void> {
  await createWriteClient().patch(id).set({ emailDelivered: true }).commit({ visibility: "async" });
}
