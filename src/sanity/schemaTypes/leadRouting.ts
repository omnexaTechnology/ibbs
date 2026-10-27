import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Singleton (document ID "private.leadRouting"): who receives new-enquiry emails.
 *
 * PRIVACY (F-01): these are internal addresses. The ID contains a "." so Sanity gives anonymous
 * users no read access even while the dataset is public; the website never shows or queries it
 * for pages. Only the server-side `getLeadRecipients()` (FEAT-004) reads it.
 */
export const leadRouting = defineType({
  name: "leadRouting",
  title: "Lead routing",
  type: "document",
  fields: [
    defineField({
      name: "recipients",
      title: "Who receives new enquiries by email",
      description:
        "Every message sent through the website forms is emailed to these addresses (and also saved under Leads). Add one or more. These addresses are private and never shown on the website.",
      type: "array",
      of: [defineArrayMember({ type: "string", validation: (rule) => rule.email() })],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: { prepare: () => ({ title: "Lead routing (private)" }) },
});
