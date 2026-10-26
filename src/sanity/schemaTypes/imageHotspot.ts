import { defineField, defineType } from "sanity";
import { HotspotPositionInput } from "../components/HotspotPositionInput";

/** A point on a project's cover photo with a short explanation (REQ-004). */
export const imageHotspot = defineType({
  name: "imageHotspot",
  title: "Point of interest",
  type: "object",
  components: { input: HotspotPositionInput },
  fields: [
    defineField({
      name: "x",
      title: "Horizontal position (%)",
      description: "0 = left edge, 100 = right edge. Easiest: click on the photo above.",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "y",
      title: "Vertical position (%)",
      description: "0 = top edge, 100 = bottom edge. Easiest: click on the photo above.",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({ name: "tag", title: "Small label", description: "One or two words, e.g. Lighting.", type: "localeString" }),
    defineField({ name: "title", title: "Title", type: "localeString" }),
    defineField({ name: "description", title: "Description", type: "localeText" }),
  ],
  preview: {
    select: { title: "title.en", subtitle: "tag.en", x: "x", y: "y" },
    prepare: ({ title, subtitle, x, y }) => ({
      title: title || "Point of interest",
      subtitle: [subtitle, x !== undefined && y !== undefined ? `${x}% / ${y}%` : ""].filter(Boolean).join(" · "),
    }),
  },
});
