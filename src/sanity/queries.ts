import { defineQuery } from "next-sanity";

/**
 * All GROQ queries of the site (REQ-007). Drafts never appear: the client uses the "published"
 * perspective (BR-002). Each page needs ONE query (NFR-001): home = HOME_QUERY, projects list =
 * PROJECTS_QUERY, project page = PROJECT_BY_SLUG_QUERY.
 */

/** Cache tags = Sanity document types, so a webhook for a type revalidates exactly its queries. */
export const SANITY_TAGS = {
  project: "project",
  heroSlides: "heroSlides",
  siteSettings: "siteSettings",
} as const;
export type SanityTag = (typeof SANITY_TAGS)[keyof typeof SANITY_TAGS];

// Image fields needed by src/sanity/image.ts: asset ref, crop, hotspot + placeholder and size.
const IMAGE = `asset, hotspot, crop, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

const PROJECT = `{
  _id,
  title,
  "slug": slug.current,
  category,
  areaM2,
  durationDays,
  year,
  city,
  client,
  challenge,
  solution,
  scope,
  featured,
  order,
  cover{ ${IMAGE} },
  gallery[]{ _key, alt, ${IMAGE} },
  hotspots[]{ _key, x, y, tag, title, description }
}`;

const ORDER = `order(order asc, year desc, _createdAt desc)`;

const HERO = `{ "slides": [
  slide1{ alt, "image": image{ ${IMAGE} } },
  slide2{ alt, "image": image{ ${IMAGE} } },
  slide3{ alt, "image": image{ ${IMAGE} } },
  slide4{ alt, "image": image{ ${IMAGE} } }
] }`;

export const PROJECTS_QUERY = defineQuery(
  `*[_type == "project" && defined(slug.current)] | ${ORDER} ${PROJECT}`,
);

export const PROJECT_BY_SLUG_QUERY = defineQuery(
  `*[_type == "project" && slug.current == $slug][0] ${PROJECT}`,
);

export const FEATURED_PROJECTS_QUERY = defineQuery(
  `*[_type == "project" && featured == true && defined(slug.current)] | ${ORDER} [0...4] ${PROJECT}`,
);

export const HERO_SLIDES_QUERY = defineQuery(`*[_id == "heroSlides"][0] ${HERO}`);

/** Home page: hero + featured projects in a single round trip. */
export const HOME_QUERY = defineQuery(`{
  "hero": *[_id == "heroSlides"][0] ${HERO},
  "featured": *[_type == "project" && featured == true && defined(slug.current)] | ${ORDER} [0...4] ${PROJECT}
}`);

export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  phones[]{ label, number },
  emails[]{ label, address },
  website,
  whatsappNumber,
  whatsappMessage,
  workingHours[]{ days, time },
  address,
  mapUrl,
  social,
  leadNotificationEmails
}`);
