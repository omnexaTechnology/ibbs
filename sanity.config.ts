"use client";

// Studio configuration, embedded at /studio (src/app/studio). Runs in the browser.

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "ibss",
  title: "IBSS Innovations",
  basePath: "/studio",
  // "unconfigured" keeps `next build` working without env vars; the Studio then shows a project error at runtime.
  projectId: projectId || "unconfigured",
  dataset,
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
