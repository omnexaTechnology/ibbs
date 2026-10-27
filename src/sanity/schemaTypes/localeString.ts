import { defineField, defineType } from "sanity";

/** A short text with an English and an Arabic value side by side (REQ-003). */
export const localeString = defineType({
  name: "localeString",
  title: "Text (EN / AR)",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({ name: "en", title: "English", type: "string" }),
    defineField({ name: "ar", title: "العربية (Arabic)", type: "string" }),
  ],
});
