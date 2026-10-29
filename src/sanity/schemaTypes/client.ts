import { defineField, defineType } from "sanity";
import { projectCategories } from "../../content/taxonomy";
import { requireBothLocales } from "./validation";

// Sectors are the project categories (BR-005): the Studio stores only the key.
const sectorOptions = projectCategories.map((c) => ({ value: c.key, title: `${c.label.en} / ${c.label.ar}` }));

/** A client shown in the "Trusted across sectors" section (home + about). */
export const client = defineType({
  name: "client",
  title: "Client",
  type: "document",
  orderings: [{ title: "Order on the site", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  fields: [
    defineField({
      name: "name",
      title: "Client name",
      description: "Both English and Arabic are required.",
      type: "localeString",
      validation: (rule) => rule.custom(requireBothLocales),
    }),
    defineField({
      name: "sector",
      title: "Sector",
      description: "The tab the client appears under.",
      type: "string",
      options: { list: sectorOptions, layout: "dropdown" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Optional. A PNG or SVG with a transparent background works best. Without a logo the card shows the name only.",
      type: "image",
    }),
    defineField({
      name: "order",
      title: "Order",
      description: "Lower numbers come first within the sector. Leave empty to place the client last.",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "name.en", subtitle: "name.ar", media: "logo" },
    prepare: ({ title, subtitle, media }) => ({ title: title || "New client", subtitle, media }),
  },
});
