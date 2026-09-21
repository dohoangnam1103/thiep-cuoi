import { defineConfig } from "@playwright/test";

const baseURL = process.env.SITE2_HOME_TEST_URL ?? "http://127.0.0.1:3200";
export default defineConfig({
  testDir: "../../tests/e2e",
  testMatch: "site-2-home.spec.ts",
  outputDir: "/tmp/site2-home-v12-tests",
  workers: 2,
  timeout: 30_000,
  use: { baseURL, screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "reduced", use: { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" } },
  ],
});
