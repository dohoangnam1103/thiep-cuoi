import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const webServer = baseConfig.webServer;
if (!webServer || Array.isArray(webServer)) {
  throw new Error("The ceremony audit requires one isolated test server");
}
const prepareCommand = "npx tsx tests/e2e/prepare-db.ts &&";
if (!webServer.command.startsWith(prepareCommand)) {
  throw new Error("The ceremony fixtures must be prepared before building the test server");
}

const baseURL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const dev = process.env.CEREMONY_AUDIT_DEV === "1";
const command = webServer.command.replace(prepareCommand, `${prepareCommand} npx tsx tests/e2e/prepare-ceremony-audit.ts &&`);

export default defineConfig({
  ...baseConfig,
  testMatch: "multiple-ceremonies.audit.ts",
  retries: 0,
  use: { ...baseConfig.use, baseURL },
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/research/multiple-ceremonies-audit/results.json" }],
  ],
  projects: baseConfig.projects?.filter((project) => project.name === "chromium").map((project) => ({
    ...project,
    use: { ...project.use, channel: process.env.CEREMONY_AUDIT_CHANNEL || undefined, launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] } },
  })),
  webServer: {
    ...webServer,
    url: baseURL,
    command: dev ? command.replace(/next build && next start -p (\d+)/, "next dev --webpack -p $1") : command,
    env: { ...webServer.env, NEXT_PUBLIC_SITE_URL: baseURL, ...(dev ? { NODE_ENV: "development" } : {}) },
    reuseExistingServer: false,
  },
});
