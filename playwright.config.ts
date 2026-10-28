import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
// Default: test the production build (`next build` + `next start`), like Vercel serves it.
// E2E_DEV=1 runs against `next dev` instead (faster feedback, but dev can race on cold compiles).
const useDev = process.env.E2E_DEV === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: useDev
      ? `npm run dev -- --port ${PORT}`
      : `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    // Never silently reuse a stale server unless asked to (E2E_REUSE=1, e.g. an already running `next start`).
    reuseExistingServer: process.env.E2E_REUSE === "1",
    timeout: 300_000,
    // Builds the test-only fixture pages (src/app/[locale]/e2e-fixtures); a normal build answers 404 there.
    env: { E2E_FIXTURES: "1" },
  },
});
