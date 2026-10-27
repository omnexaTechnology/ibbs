import { defineArrayMember, defineField, defineType } from "sanity";
import { projectCategories, scopeItems } from "../../content/taxonomy";
import { requireBothLocales, requireKebabSlug } from "./validation";

// Category and scope lists come from code (BR-005): the Studio stores only the keys.
const categoryOptions = projectCategories.map((c) => ({ value: c.key, title: `${c.label.en} / ${c.label.ar}` }));
const scopeOptions = scopeItems.map((s) => ({ value: s.key, title: `${s.label.en} / ${s.label.ar}` }));

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  orderings: [
    { title: "Order on the site", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    { title: "Year, newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      description: "Both English and Arabic are required.",
      type: "localeString",
      validation: (rule) => rule.custom(requireBothLocales),
    }),
    defineField({
      name: "slug",
      title: "Web address (slug)",
      description:
        "The last part of the project's web address, e.g. executive-hq. Click Generate to create it from the English name. Changing it after the project is live breaks old links.",
      type: "slug",
      options: { source: "title.en", maxLength: 60 },
      validation: (rule) => rule.required().custom(requireKebabSlug),
    }),
    defineField({
      name: "category",
      title: "Category",
      description: "Where the project appears in the filter on the Projects page.",
      type: "string",
      options: { list: categoryOptions, layout: "dropdown" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cover",
      title: "Cover photo",
      description:
        "The main photo, shown on the project card and at the top of the project page. Drag the focus point to choose what stays visible when the photo is cropped.",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Gallery photos",
      description:
        "Add at least one photo (the design uses four). Each needs a short description for screen readers, in both languages.",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", title: "Description of the photo", type: "localeString" })],
          preview: {
            select: { title: "alt.en", media: "asset" },
            prepare: ({ title, media }) => ({ title: title || "Photo", media }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "areaM2", title: "Area (m²)", type: "number", validation: (rule) => rule.positive() }),
    defineField({
      name: "durationDays",
      title: "Duration (days)",
      type: "number",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (rule) => rule.integer().min(1990).max(2100),
    }),
    defineField({ name: "city", title: "City", type: "localeString" }),
    defineField({
      name: "client",
      title: "Client name (optional)",
      description: "Leave empty to show no client line on the website.",
      type: "localeString",
    }),
    defineField({ name: "challenge", title: "The challenge", type: "localeText" }),
    defineField({ name: "solution", title: "Our solution", type: "localeText" }),
    defineField({
      name: "hotspots",
      title: "Points of interest on the cover photo",
      description:
        "Small dots on the cover photo with an explanation. Upload the cover photo first, then click it to place each dot.",
      type: "array",
      of: [defineArrayMember({ type: "imageHotspot" })],
    }),
    defineField({
      name: "scope",
      title: "What we furnished",
      description: "Tick everything that applies.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { list: scopeOptions },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "featured",
      title: "Show on the home page (no longer used)",
      description:
        "No longer used: the home page now shows all projects in their order. Kept only so older documents open without warnings.",
      type: "boolean",
      hidden: true,
      deprecated: { reason: "The home page shows all projects in order. Use the Order field to change the sequence." },
    }),
    defineField({
      name: "order",
      title: "Order",
      description: "Smaller numbers come first (1, 2, 3 ...).",
      type: "number",
      validation: (rule) => rule.integer(),
    }),
  ],
  preview: {
    select: { title: "title.en", subtitle: "category", media: "cover" },
    prepare: ({ title, subtitle, media }) => {
      const label = projectCategories.find((c) => c.key === subtitle)?.label.en;
      return { title: title || "Untitled project", subtitle: label, media };
    },
  },
});
