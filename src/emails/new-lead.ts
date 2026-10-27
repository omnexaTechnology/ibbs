import type { LeadRecord } from "@/lib/leads/save";

const FORM_LABEL = { contact: "Contact form", project: "Project request", call: "Call request" } as const;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** One line, no control or bidi/format characters (safe for a subject line). */
const oneLine = (s: string) => s.replace(/[\p{Cc}\p{Cf}\u2028\u2029]+/gu, " ").trim();

/**
 * Notification email for the sales team. Plain HTML string on purpose: one table with inline
 * styles does not justify @react-email and its renderer (many extra packages) in the server bundle.
 */
export function renderNewLeadEmail(lead: LeadRecord): { subject: string; html: string; text: string } {
  const rows: [string, string | undefined][] = [
    ["Form", FORM_LABEL[lead.formType]],
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Company", lead.company],
    ["Type of space", lead.spaceType],
    ["Area (m²)", lead.area],
    ["Message", lead.message],
    ["Website language", lead.locale === "ar" ? "Arabic" : "English"],
    ["Sent from", lead.pageUrl],
  ];
  const shown = rows.filter((r): r is [string, string] => Boolean(r[1]));

  const who = lead.name ? ` from ${oneLine(lead.name).slice(0, 80)}` : "";
  const subject = `New ${FORM_LABEL[lead.formType].toLowerCase()}${who} - IBSS website`;
  const text = shown.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f2ec;font-family:Arial,Helvetica,sans-serif;color:#1e2e5a">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:18px;font-weight:bold;padding-bottom:16px">New enquiry from the IBSS website</td></tr>
${shown
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 0;border-top:1px solid #e6e6e6;font-size:14px"><div style="font-size:12px;color:#6b7694">${escapeHtml(k)}</div><div style="white-space:pre-wrap">${escapeHtml(v)}</div></td></tr>`,
  )
  .join("\n")}
<tr><td style="padding-top:16px;font-size:12px;color:#6b7694">Also saved in the Studio under Leads.</td></tr>
</table></body></html>`;
  return { subject, html, text };
}
