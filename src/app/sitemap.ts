import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo";
import { getProjectSlugs } from "@/sanity/content";

// The slug fetch carries the "project" tag, so publishing a project refreshes the sitemap too.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await getProjectSlugs());
}
