import "server-only";
import { sanityFetch } from "./fetch";
import {
  HERO_SLIDES_QUERY,
  HOME_QUERY,
  PROJECT_BY_SLUG_QUERY,
  PROJECT_SLUGS_QUERY,
  PROJECTS_QUERY,
  SANITY_TAGS,
} from "./queries";
import {
  toHeroSlides,
  toProjectPage,
  toProjects,
  toProjectSlugs,
  type HeroSlideContent,
  type Project,
  type ProjectPage,
} from "./view-models";

/**
 * Typed content API for the pages (FEAT-003). Each function is ONE query (NFR-001) and returns
 * view models, never raw Sanity data. They throw if Sanity fails: pages decide how to degrade.
 */

export async function getProjects(): Promise<Project[]> {
  return toProjects(await sanityFetch({ query: PROJECTS_QUERY, tags: [SANITY_TAGS.project] }));
}

/** The project and its related projects (same category, max 3) in one query; null if unknown or incomplete. */
export async function getProjectBySlug(slug: string): Promise<ProjectPage | null> {
  return toProjectPage(
    await sanityFetch({ query: PROJECT_BY_SLUG_QUERY, params: { slug }, tags: [SANITY_TAGS.project] }),
  );
}

/** Every project slug, for `generateStaticParams`. */
export async function getProjectSlugs(): Promise<string[]> {
  return toProjectSlugs(await sanityFetch({ query: PROJECT_SLUGS_QUERY, tags: [SANITY_TAGS.project] }));
}

export async function getHeroSlides(): Promise<HeroSlideContent[]> {
  return toHeroSlides(await sanityFetch({ query: HERO_SLIDES_QUERY, tags: [SANITY_TAGS.heroSlides] }));
}

/** Home page: hero images + the projects in design order (max HOME_PROJECT_LIMIT) in one round trip. */
export async function getHomeContent(): Promise<{ hero: HeroSlideContent[]; projects: Project[] }> {
  const raw = await sanityFetch({ query: HOME_QUERY, tags: [SANITY_TAGS.heroSlides, SANITY_TAGS.project] });
  return { hero: toHeroSlides(raw.hero), projects: toProjects(raw.projects) };
}
