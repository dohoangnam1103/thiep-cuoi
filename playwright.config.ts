import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// E2E runs against an isolated SQLite db (tests/e2e/.data/test.db), never dev.db.
const TEST_DB_URL = "file:./tests/e2e/.data/test.db";

export default defineConfig({
  metadata: {
    forestProductionBuild: true,
  },
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.artifacts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "tests/e2e/.report", open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    // Pin locale so the default-locale route ("/") deterministically serves Vietnamese;
    // next-intl detects Accept-Language otherwise and would serve English in CI browsers.
    locale: "vi-VN",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // prepare-db runs first so test.db exists before `next start` boots (Playwright
    // starts webServer BEFORE globalSetup, so db prep can't live in global-setup).
    // Production build+start avoids Next 16's single-`next dev`-per-dir lock.
    command: `npx tsx tests/e2e/prepare-db.ts && next build && next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: TEST_DB_URL,
      SESSION_SECRET: "e2e-session-secret-do-not-use-in-prod",
      AUTH_SECRET: "e2e-auth-secret-do-not-use-in-prod",
      CASSO_WEBHOOK_TOKEN: "e2e-casso-token",
      PAYOS_CLIENT_ID: "e2e-payos-client",
      PAYOS_API_KEY: "e2e-payos-api-key",
      PAYOS_CHECKSUM_KEY: "e2e-payos-checksum",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      // `next build` forces NODE_ENV=production; the suite serves over loopback HTTP.
      ALLOW_INSECURE_SITE_URL: "1",
      GUEST_MEDIA_ROOT: `${process.cwd()}/tests/e2e/.data/guest-media`,
      EDITOR_UPLOAD_ROOT: `${process.cwd()}/tests/e2e/.data/editor-uploads`,
      GATEFOLD_LAB_ENABLED: "1",
      SLEEVE_LAB_ENABLED: "1",
      DORAEMON_DOOR_LAB_ENABLED: "1",
      DETECTIVE_CONAN_CASEBOOK_LAB_ENABLED: "1",
      FLOW_DEMO_LAB_ENABLED: "1",
      DALAT_JOURNEY_LAB_ENABLED: "1",
      FOREST_WEDDING_JOURNEY_LAB_ENABLED: "1",
      NODE_ENV: "test",
    },
  },
});
