"use client";

// Studio configuration, embedded at /studio (src/app/studio). Runs in the browser.

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { NO_CREATE_TYPES, SINGLETON_TYPES, schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

const inList = (list: readonly string[], value: string) => list.includes(value);

export default defineConfig({
  name: "ibss",
  title: "IBSS Innovations",
  basePath: "/studio",
  // "unconfigured" keeps `next build` working without env vars; the Studio then shows a project error at runtime.
  projectId: projectId || "unconfigured",
  dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  // The Vision tool runs arbitrary GROQ (it can read leads): administrators only.
  tools: (prev, { currentUser }) =>
    currentUser?.roles.some((role) => role.name === "administrator") ? prev : prev.filter((tool) => tool.name !== "vision"),
  schema: {
    types: schemaTypes,
    // Singletons and leads are not created from the "New document" menu (leads come from the website forms).
    templates: (templates) => templates.filter(({ schemaType }) => !inList(NO_CREATE_TYPES, schemaType)),
  },
  document: {
    // Singletons cannot be duplicated, deleted or unpublished; leads cannot be duplicated (editors may delete them).
    actions: (input, { schemaType }) => {
      if (inList(SINGLETON_TYPES, schemaType)) {
        return input.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action));
      }
      if (schemaType === "lead") return input.filter(({ action }) => action !== "duplicate");
      return input;
    },
  },
});
