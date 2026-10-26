import { defineField, defineType } from "sanity";

/** A long text with an English and an Arabic value side by side (REQ-003). */
export const localeText = defineType({
  name: "localeText",
  title: "Long text (EN / AR)",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({ name: "en", title: "English", type: "text", rows: 5 }),
    defineField({ name: "ar", title: "العربية (Arabic)", type: "text", rows: 5 }),
  ],
});
