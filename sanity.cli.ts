import { defineCliConfig } from "sanity/cli";

// Used by `npx sanity ...` commands (schema validate, typegen, dataset, cors). Needs the env vars
// (put them in .env.local and run commands through `npm run sanity -- <command>`).
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "unconfigured",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  },
  typegen: {
    path: "./src/**/*.{ts,tsx}",
    schema: "schema.json",
    generates: "./src/sanity/types.ts",
  },
});
