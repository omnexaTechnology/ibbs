import { defineField, defineType } from "sanity";
import { HERO_SLIDE_COUNT, HERO_SLIDE_TOPICS } from "../../content/taxonomy";

/** One hero slot: an image plus its description for screen readers. */
export const heroSlideImage = defineType({
  name: "heroSlideImage",
  title: "Hero image",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      description: "Landscape photo, at least 1920 px wide. Drag the focus point to choose what stays visible when it is cropped.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "alt",
      title: "Description of the image",
      description: "One short sentence for screen readers, in both languages. Required when an image is set.",
      type: "localeString",
      validation: (rule) =>
        rule.custom((alt, context) => {
          const parent = context.parent as { image?: { asset?: unknown } } | undefined;
          if (!parent?.image?.asset) return true;
          const value = alt as { en?: string; ar?: string } | undefined;
          return value?.en?.trim() && value?.ar?.trim() ? true : "Describe the image in English and Arabic.";
        }),
    }),
  ],
  preview: {
    select: { title: "alt.en", media: "image" },
    prepare: ({ title, media }) => ({ title: title || "No image yet", media }),
  },
});

const slideNames = Array.from({ length: HERO_SLIDE_COUNT }, (_, i) => `slide${i + 1}`);

type HeroDoc = Record<string, { image?: { asset?: unknown } } | undefined>;

/** Singleton (document ID "heroSlides"): exactly four image slots, one per slide of the home hero. */
export const heroSlides = defineType({
  name: "heroSlides",
  title: "Hero images",
  type: "document",
  validation: (rule) =>
    rule.custom((doc) => {
      const d = doc as HeroDoc | undefined;
      return slideNames.some((n) => d?.[n]?.image?.asset) ? true : "Add at least one image.";
    }),
  fields: slideNames.map((name, i) =>
    defineField({
      name,
      title: `Slide ${i + 1}: ${HERO_SLIDE_TOPICS[i].en}`,
      description:
        i === 0
          ? "The 4 slides of the home page banner. You can only replace the pictures: the headlines stay as they are. " +
            "Note: the small information dots (e.g. Lighting, Finish) keep their current positions on the screen. " +
            "If your new picture is laid out differently, a dot may point at the wrong spot, so choose pictures with a similar layout, or ask the developers to move the dots. " +
            "A slide left empty keeps its original picture."
          : "Replaces the picture of this slide. The dots on it keep their positions. A slide left empty keeps its original picture.",
      type: "heroSlideImage",
    }),
  ),
  preview: { prepare: () => ({ title: "Home page hero images" }) },
});
