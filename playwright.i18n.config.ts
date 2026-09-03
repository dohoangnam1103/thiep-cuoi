import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const webServer = baseConfig.webServer;
if (!webServer || Array.isArray(webServer)) {
  throw new Error("The i18n deploy gate requires one explicit E2E web server");
}

// Deployment must test the current source, never a previously running server.
// The normal production build runs AFTER this gate to replace the E2E artifact.
export default defineConfig({
  ...baseConfig,
  testMatch: "i18n-coverage.spec.ts",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  projects: baseConfig.projects?.filter((project) => project.name === "chromium"),
  webServer: {
    ...webServer,
    reuseExistingServer: false,
  },
});
