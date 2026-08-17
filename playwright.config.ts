import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// E2E runs against an isolated SQLite db (tests/e2e/.data/test.db), never dev.db.
const TEST_DB_URL = "file:./tests/e2e/.data/test.db";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.artifacts",
  // Chromium E2E specs share one SQLite database and several deliberately
  // exercise direct database mutations alongside browser requests. WAL avoids
  // lock timeouts, but cannot provide test-level isolation between workers.
  // Keep this integration suite deterministic instead of allowing one test's
  // cleanup or price mutation to race another test's assertion.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
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
    {
      name: "chromium",
      testIgnore: /(forest|beach)-wedding-journey-.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // The forest journey boots a full WebGL world and then measures the frames
      // it produces: ~5.7s to `data-world-ready`, a 600ms reduced-motion entry
      // budget, and camera-pose assertions with a 0.003 tolerance. Those readings
      // are only meaningful when the scene owns the GPU. Sharing it corrupted them
      // — 13 specs failed at 4 workers, 4 at 2, 1 with parallel files, and every
      // one passed alone, three runs in a row.
      //
      // One worker for this project only, which is what Playwright documents for
      // a resource that cannot be exercised concurrently; the other projects keep
      // the machine's full worker count. No assertion is relaxed: the 600ms and
      // 2.4s budgets are explicit per-call timeouts inside the specs, and neither
      // the project nor the expect timeout can widen them. The expect budget just
      // covers world boot, which outlives the 10s default on a cold cache.
      name: "forest",
      expect: { timeout: 20_000 },
      testMatch: /forest-wedding-journey-.*\.spec\.ts/,
      timeout: 180_000,
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },
    {
      // Same constraint as the forest project: this lab boots a full WebGL world
      // and then measures the frames it produces, and the planar water reflection
      // adds a second scene pass per frame. Those readings are only meaningful
      // when the scene owns the GPU, so this project runs one worker while the
      // others keep the machine's full count. No assertion is relaxed —
      // per-call timeouts inside the specs bound the budgets, and neither
      // setting here can widen them.
      name: "beach",
      expect: { timeout: 20_000 },
      testMatch: /beach-wedding-journey-.*\.spec\.ts/,
      timeout: 180_000,
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },
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
      // Opt-in only: the diagnostic suite runs with FOREST_RUNTIME_DIAGNOSTICS=1
      // so a production build still publishes the on-demand snapshot reader.
      // Restart the reused server when toggling this.
      FOREST_RUNTIME_DIAGNOSTICS: process.env.FOREST_RUNTIME_DIAGNOSTICS ?? "",
      BEACH_WEDDING_JOURNEY_LAB_ENABLED: "1",
      // Same opt-in as the forest reader above: the beach diagnostic suite runs
      // with BEACH_RUNTIME_DIAGNOSTICS=1 so a production build still publishes
      // `window.__beachWeddingJourneyDiagnostics`. Restart the reused server
      // when toggling this.
      BEACH_RUNTIME_DIAGNOSTICS: process.env.BEACH_RUNTIME_DIAGNOSTICS ?? "",
      NODE_ENV: "test",
    },
  },
});
