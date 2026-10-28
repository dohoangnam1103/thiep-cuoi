import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";
import path from "node:path";

const port = Number(process.env.E2E_PORT ?? 3117);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid editor2 E2E port");
const baseURL = `http://127.0.0.1:${port}`;
// Set before test modules load, so the shared fixtures and the server always
// refer to the same dedicated database even when another E2E suite is running.
process.env.E2E_PORT = String(port);
process.env.E2E_DATA_DIR = `tests/e2e/.data-editor2-${port}`;
const dataRoot = path.join(process.cwd(), process.env.E2E_DATA_DIR);
const webServer = baseConfig.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("Editor2 requires one test server");

// Keep SQLite integration tests serial. Each template still gets its own test,
// browser context, owner and invitation, rather than sharing one switched draft.
export default defineConfig({
  ...baseConfig,
  testMatch: ["editor2.spec.ts", "editor2-template-matrix.audit.ts", "editor2-bindings.edge.audit.ts"],
  retries: 0,
  timeout: 120_000,
  outputDir: `tests/e2e/.artifacts/editor2-${port}`,
  reporter: [
    ["list"],
    ["html", { outputFolder: `tests/e2e/.report/editor2-${port}`, open: "never" }],
    ["json", { outputFile: `tests/e2e/.artifacts/editor2-${port}-results.json` }],
  ],
  use: { ...baseConfig.use, baseURL, trace: "retain-on-failure" },
  webServer: {
    ...webServer,
    stdout: "pipe",
    url: baseURL,
    command: `npx tsx tests/e2e/prepare-db.ts && next build && next start -p ${port}`,
    reuseExistingServer: false,
    env: {
      ...webServer.env,
      E2E_DATA_DIR: process.env.E2E_DATA_DIR,
      E2E_NEXT_DIST_DIR: `.next-editor2-${port}`,
      DATABASE_URL: `file:${path.join(dataRoot, "test.db")}`,
      NEXT_PUBLIC_SITE_URL: baseURL,
      GUEST_MEDIA_ROOT: path.join(dataRoot, "guest-media"),
      EDITOR_UPLOAD_ROOT: path.join(dataRoot, "editor-uploads"),
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(process.env.EDITOR2_WEBKIT === "1"
      ? [{
        name: "webkit",
        // The original integration spec contains Chromium CDP touch gestures.
        // The cross-engine contract is the complete catalog plus edge suite.
        testMatch: ["editor2-template-matrix.audit.ts", "editor2-bindings.edge.audit.ts"],
        use: { ...devices["Desktop Safari"] },
      }] : []),
  ],
});
