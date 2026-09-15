import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const PORT = Number(process.env.SITE2_E2E_PORT ?? 3222);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const APP_DIR = import.meta.dirname;
const TEST_DB_URL = `file:${path.join(APP_DIR, ".e2e", "test.db")}`;

export default defineConfig({
  // Site-2 specs only; each needs the site-2 server (port 3222) and the
  // isolated temp SQLite DB below — never master dev.db or production data.
  testDir: "../../tests/e2e",
  testMatch: /site-2-.*\.spec\.ts/,
  outputDir: "./.e2e/artifacts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    locale: "vi-VN",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testMatch: /site-2-(mvp|shells|marketing|support|workspace|guests-rsvp|payment)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual-desktop",
      testMatch: /site-2-visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "visual-mobile",
      testMatch: /site-2-visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "visual-dark",
      testMatch: /site-2-visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        colorScheme: "dark",
      },
    },
    {
      name: "visual-reduced",
      testMatch: /site-2-visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
      },
    },
  ],
  webServer: {
    command: `rm -f .e2e/test.db && DATABASE_URL="${TEST_DB_URL}" npx prisma db push && next build && next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    cwd: APP_DIR,
    env: {
      DATABASE_URL: TEST_DB_URL,
      SESSION_SECRET: "site2-e2e-secret-do-not-use-in-prod",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      SITE2_PAYMENT_ENABLED: "1",
      SITE2_PAYOS_SANDBOX: "1",
      SITE2_PLAN_PRICE: "99000",
      SITE2_PAYOS_CHECKSUM_KEY: "e2e-sandbox-checksum-key",
      NODE_ENV: "test",
    },
  },
});
