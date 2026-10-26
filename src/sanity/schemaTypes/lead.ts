import { defineField, defineType } from "sanity";

/**
 * Website form submission (FEAT-004 writes it, server only).
 *
 * PRIVACY (BR-007): leads are personal data. The server creates them with IDs of the form
 * `lead.<uuid>` (see src/sanity/lead-id.ts). Sanity gives unauthenticated users read access to
 * root-path IDs only; an ID containing a "." is private even on a public dataset.
 *
 * Editors see everything read-only; they can tick "handled" and delete a lead.
 */
export const lead = defineType({
  name: "lead",
  title: "Lead",
  type: "document",
  fields: [
    defineField({ name: "handled", title: "Handled", description: "Tick when someone has replied to this enquiry.", type: "boolean", initialValue: false }),
    defineField({
      name: "formType",
      title: "Form",
      type: "string",
      readOnly: true,
      options: { list: [{ value: "contact", title: "Contact form" }, { value: "project", title: "Project request" }, { value: "call", title: "Call request" }] },
    }),
    defineField({ name: "name", title: "Name", type: "string", readOnly: true }),
    defineField({ name: "company", title: "Company", type: "string", readOnly: true }),
    defineField({ name: "email", title: "Email", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "Phone", type: "string", readOnly: true }),
    defineField({ name: "spaceType", title: "Type of space", type: "string", readOnly: true }),
    defineField({ name: "area", title: "Area", type: "string", readOnly: true }),
    defineField({ name: "message", title: "Message", type: "text", rows: 6, readOnly: true }),
    defineField({ name: "locale", title: "Website language", type: "string", readOnly: true }),
    defineField({ name: "pageUrl", title: "Page it was sent from", type: "string", readOnly: true }),
    defineField({ name: "createdAt", title: "Received at", type: "datetime", readOnly: true }),
    defineField({
      name: "emailDelivered",
      title: "Notification email delivered",
      description: "If this is not ticked, the email failed: follow up using the details above.",
      type: "boolean",
      readOnly: true,
    }),
  ],
  orderings: [{ title: "Newest first", name: "createdAtDesc", by: [{ field: "createdAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", formType: "formType", createdAt: "createdAt", handled: "handled" },
    prepare: ({ name, formType, createdAt, handled }) => ({
      title: `${handled ? "[done] " : ""}${name || "Unknown"}`,
      subtitle: [formType, createdAt ? new Date(createdAt).toLocaleString("en-GB") : ""].filter(Boolean).join(" · "),
    }),
  },
});
