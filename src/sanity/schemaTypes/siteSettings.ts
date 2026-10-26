import { defineArrayMember, defineField, defineType } from "sanity";
import { requireWhatsappNumber } from "./validation";

const emptyHides = "Leave empty to hide it on the website.";

/** Singleton (document ID "siteSettings"): contact details, social links and lead notification emails. */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "phones",
      title: "Phone numbers",
      description: `Shown in the footer and on the Contact page. ${emptyHides}`,
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "phoneEntry",
          fields: [
            defineField({ name: "label", title: "Label (e.g. Sales)", type: "localeString" }),
            defineField({
              name: "number",
              title: "Number",
              description: "As it should be displayed, e.g. +966 50 123 4567.",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "number", subtitle: "label.en" } },
        }),
      ],
    }),
    defineField({
      name: "emails",
      title: "Email addresses",
      description: `Shown on the Contact page. ${emptyHides}`,
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "emailEntry",
          fields: [
            defineField({ name: "label", title: "Label (e.g. Sales)", type: "localeString" }),
            defineField({
              name: "address",
              title: "Email address",
              type: "string",
              validation: (rule) => rule.required().email(),
            }),
          ],
          preview: { select: { title: "address", subtitle: "label.en" } },
        }),
      ],
    }),
    defineField({
      name: "website",
      title: "Website",
      description: `Full address starting with https://. ${emptyHides}`,
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      description: `Digits only, with the country code, no + or spaces. Example: 966501234567. The green WhatsApp button is hidden while this is empty.`,
      type: "string",
      validation: (rule) => rule.custom(requireWhatsappNumber),
    }),
    defineField({
      name: "whatsappMessage",
      title: "WhatsApp first message",
      description: "The text already typed in when a visitor opens WhatsApp from the website.",
      type: "localeText",
    }),
    defineField({
      name: "workingHours",
      title: "Working hours",
      description: `Each row is a group of days with its hours. ${emptyHides}`,
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "hoursRow",
          fields: [
            defineField({ name: "days", title: "Days (e.g. Sunday – Thursday)", type: "localeString" }),
            defineField({ name: "time", title: "Hours (e.g. 9:00 – 17:00)", type: "localeString" }),
          ],
          preview: { select: { title: "days.en", subtitle: "time.en" } },
        }),
      ],
    }),
    defineField({ name: "address", title: "Office address", description: emptyHides, type: "localeText" }),
    defineField({
      name: "mapUrl",
      title: "Map link",
      description: `Link to the office on a map (e.g. a Google Maps link). When empty, the address is shown as plain text.`,
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "social",
      title: "Social media",
      description: `Full address of each page, starting with https://. An empty field hides that icon on the website.`,
      type: "object",
      options: { columns: 1 },
      fields: [
        ["linkedin", "LinkedIn"],
        ["instagram", "Instagram"],
        ["x", "X (Twitter)"],
        ["snapchat", "Snapchat"],
        ["tiktok", "TikTok"],
      ].map(([name, title]) =>
        defineField({ name, title, type: "url", validation: (rule) => rule.uri({ scheme: ["http", "https"] }) }),
      ),
    }),
    defineField({
      name: "leadNotificationEmails",
      title: "Who receives new enquiries by email",
      description:
        "Every message sent through the website forms is emailed to these addresses (and also saved under Leads). Add one or more.",
      type: "array",
      of: [defineArrayMember({ type: "string", validation: (rule) => rule.email() })],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: { prepare: () => ({ title: "Contact & social settings" }) },
});
