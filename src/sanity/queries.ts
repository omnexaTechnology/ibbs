import { defineQuery } from "next-sanity";
import { HOME_PROJECT_LIMIT } from "@/content/taxonomy";

/**
 * All GROQ queries of the site (REQ-007). Drafts never appear: the client uses the "published"
 * perspective (BR-002). Each page needs ONE query (NFR-001): home = HOME_QUERY, projects list =
 * PROJECTS_QUERY, project page = PROJECT_BY_SLUG_QUERY.
 */

/** Cache tags = Sanity document types, so a webhook for a type revalidates exactly its queries. */
export const SANITY_TAGS = {
  project: "project",
  heroSlides: "heroSlides",
  client: "client",
  siteSettings: "siteSettings",
  /** Private lead recipients: read by getLeadRecipients() only, never by pages. */
  leadRouting: "leadRouting",
} as const;
export type SanityTag = (typeof SANITY_TAGS)[keyof typeof SANITY_TAGS];

// Image fields needed by src/sanity/image.ts: asset ref, crop, hotspot + placeholder and size.
const IMAGE = `asset, hotspot, crop, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

const PROJECT_FIELDS = `
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
  order,
  cover{ ${IMAGE} },
  gallery[]{ _key, alt, ${IMAGE} },
  hotspots[]{ _key, x, y, tag, title, description }
`;
const PROJECT = `{${PROJECT_FIELDS}}`;

/** Related projects on a project page: same category, never the project itself, max 3 (FEAT-003 REQ-009). */
export const RELATED_PROJECT_LIMIT = 3;

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

/** Project page: the project and its related projects in ONE query (NFR-001). */
export const PROJECT_BY_SLUG_QUERY = defineQuery(
  `*[_type == "project" && slug.current == $slug][0]{
  ${PROJECT_FIELDS},
  "related": *[_type == "project" && defined(slug.current) && category == ^.category && _id != ^._id] | ${ORDER} [0...${RELATED_PROJECT_LIMIT}] ${PROJECT}
}`,
);

/** Slugs of every project, for generateStaticParams of the project page. */
export const PROJECT_SLUGS_QUERY = defineQuery(
  `*[_type == "project" && defined(slug.current)] | ${ORDER} { "slug": slug.current }`,
);

/** Clients of the "Trusted across sectors" section (home + about). */
const CLIENTS = `*[_type == "client"] | order(order asc, _createdAt asc){ _id, name, sector, logo{ ${IMAGE} } }`;
export const CLIENTS_QUERY = defineQuery(CLIENTS);

export const HERO_SLIDES_QUERY = defineQuery(`*[_id == "heroSlides"][0] ${HERO}`);

/** Home page: hero + the projects in design order (up to HOME_PROJECT_LIMIT) + clients in a single round trip. */
export const HOME_QUERY = defineQuery(`{
  "hero": *[_id == "heroSlides"][0] ${HERO},
  "projects": *[_type == "project" && defined(slug.current)] | ${ORDER} [0...${HOME_PROJECT_LIMIT}] ${PROJECT},
  "clients": ${CLIENTS}
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
  social
}`);
