/**
 * Document ID for a new lead (used by FEAT-004 when it creates leads).
 *
 * Leads are personal data (BR-007). Sanity's access rules give unauthenticated users read access
 * to documents under the ROOT path only; "any document ID containing a '.' can only be accessed
 * when a user is logged in or a valid token is provided" (https://www.sanity.io/docs/content-lake/ids,
 * checked 2026-10-26). So `lead.<uuid>` stays private even if the dataset is public.
 * Never put personal data in the ID itself: IDs are retained after deletion.
 */
export const LEAD_ID_PREFIX = "lead.";

export function leadDocumentId(uuid: string = crypto.randomUUID()): string {
  return `${LEAD_ID_PREFIX}${uuid}`;
}

export function isLeadDocumentId(id: string): boolean {
  return id.startsWith(LEAD_ID_PREFIX);
}

/**
 * Fixed ID of the "Lead routing" singleton (who gets the notification emails). Same rule as
 * leads: the "." keeps it unreadable for anonymous users, even on a public dataset.
 */
export const LEAD_ROUTING_ID = "private.leadRouting";
