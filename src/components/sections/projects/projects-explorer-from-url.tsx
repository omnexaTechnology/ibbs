"use client";

import { useSearchParams } from "next/navigation";
import { PROJECT_CATEGORY_KEYS, type ProjectCategoryKey } from "@/content/taxonomy";
import type { Project } from "@/sanity/view-models";
import { ProjectsExplorer } from "./projects-explorer";

const isCategory = (v: string | null): v is ProjectCategoryKey => !!v && (PROJECT_CATEGORY_KEYS as readonly string[]).includes(v);

/** Reads `?category=` (the only part that needs the client), so the rest of the list can be server-rendered. */
export function ProjectsExplorerFromUrl(props: { projects: Project[]; locale: string }) {
  const param = useSearchParams().get("category");
  return <ProjectsExplorer {...props} category={isCategory(param) ? param : "all"} />;
}
