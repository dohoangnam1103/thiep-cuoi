#!/usr/bin/env node
// Cheap, read-only checks before the i18n gate or production build starts.
import { accessSync, constants, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_FILES = [
  "package.json",
  "package-lock.json",
  "prisma/schema.prisma",
  "prisma.config.ts",
  "messages/vi.json",
  "src/lib/invitation-template-i18n.test.ts",
  "tests/e2e/prepare-db.ts",
  "tests/e2e/i18n-coverage.spec.ts",
  "tests/e2e/helpers/auth.ts",
  "tests/e2e/helpers/db.ts",
  "tests/e2e/helpers/fixtures.ts",
  "playwright.config.ts",
  "playwright.i18n.config.ts",
  "scripts/check-deploy-i18n.sh",
];
export const REQUIRED_CLI = ["next", "tsx", "prisma", "playwright"];
export const REQUIRED_TABLES = ["TemplateHeroTypography", "TemplateRouteAlias"];

function loadBuildEnvironment(root, requireModule) {
  const { loadEnvConfig } = requireModule("@next/env");
  let loadFailed = false;
  const logger = { info() {}, error() { loadFailed = true; } };
  const { combinedEnv } = loadEnvConfig(root, false, logger, true);
  if (loadFailed) throw new Error("An environment file could not be loaded.");
  return combinedEnv;
}

// serialize() reads a consistent SQLite snapshot, including committed WAL pages.
// Hashing the .db file alone would miss recent writes that have not checkpointed.
export function buildDatabaseHash({ root = process.cwd(), environment, requireModule = createRequire(path.join(root, "package.json")) } = {}) {
  const effectiveEnvironment = environment ?? loadBuildEnvironment(root, requireModule);
  const filename = sqliteFile(effectiveEnvironment.DATABASE_URL ?? "file:./dev.db", root);
  const Database = requireModule("better-sqlite3");
  const database = new Database(filename, { readonly: true, fileMustExist: true, timeout: 1_000 });
  try {
    return createHash("sha256").update(database.serialize()).digest("hex");
  } finally {
    database.close();
  }
}

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

export function sqliteFile(databaseUrl, root) {
  if (typeof databaseUrl !== "string" || !databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must select a local SQLite file.");
  }
  const suffix = databaseUrl.slice(5);
  if (!suffix || suffix === ":memory:" || suffix.includes("?") || suffix.includes("#")) {
    throw new Error("DATABASE_URL must select an existing local SQLite file without query or fragment.");
  }
  return suffix.startsWith("//")
    ? fileURLToPath(databaseUrl)
    : path.resolve(root, suffix);
}

export function publicOrigin(environment) {
  const value = environment.PUBLIC_URL || environment.NEXT_PUBLIC_SITE_URL || "https://thiepmungonline.com";
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || host === "localhost" || host.endsWith(".localhost") ||
      host === "::1" || host === "0.0.0.0" || /^127\./.test(host)) {
    throw new Error("Set PUBLIC_URL to the real HTTPS production origin (without credentials, path, query or fragment).");
  }
  return url.origin;
}

export function checkDeployInputs({
  root = process.cwd(),
  environment,
  nodeVersion = process.versions.node,
  requireModule = createRequire(path.join(root, "package.json")),
} = {}) {
  const issues = [];
  const passed = [];
  const add = (group, message) => issues.push({ group, message });

  for (const file of REQUIRED_FILES) {
    if (!isFile(path.join(root, file))) {
      add("Source", `Missing ${file}; restore the complete deployment source, including tests.`);
    }
  }
  try {
    if (!readdirSync(path.join(root, "src/i18n")).some((file) => file.endsWith(".test.ts"))) {
      add("Source", "Missing src/i18n/*.test.ts; restore the i18n unit tests.");
    }
  } catch {
    add("Source", "Missing src/i18n/; restore the complete deployment source.");
  }

  try {
    const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const range = manifest.engines?.node;
    const semver = requireModule("next/dist/compiled/semver");
    if (!range || !semver.validRange(range) || !semver.satisfies(nodeVersion, range)) {
      add("Runtime", "Node does not satisfy package.json engines.node; install and select the required Node version, then run npm ci.");
    } else {
      passed.push(`Node ${nodeVersion} satisfies engines.node`);
    }
  } catch {
    add("Runtime", "Cannot validate Node against package.json; restore the manifest and run npm ci to install Next.js dependencies.");
  }

  for (const name of REQUIRED_CLI) {
    const cli = path.join(root, "node_modules/.bin", name);
    try {
      if (!statSync(cli).isFile()) throw new Error("Not a file");
      accessSync(cli, constants.X_OK);
    } catch {
      add("Dependencies", `node_modules/.bin/${name} is missing, broken or not executable; run npm ci in this build directory and preserve symlinks when copying dependencies.`);
    }
  }

  try {
    const { chromium } = requireModule("@playwright/test");
    const executable = chromium.executablePath();
    if (!isFile(executable)) throw new Error("Missing Chromium");
    accessSync(executable, constants.X_OK);
    passed.push("Playwright Chromium is installed");
  } catch {
    add("Browser", "Playwright Chromium is unavailable; run npx playwright install chromium in this build directory.");
  }

  let effectiveEnvironment = environment;
  if (!effectiveEnvironment) {
    try {
      // Match next build: .env.production.local, .env.local, .env.production, .env.
      effectiveEnvironment = loadBuildEnvironment(root, requireModule);
    } catch {
      add("Environment", "Cannot load build environment; run npm ci and check the local .env file permissions.");
    }
  }

  if (effectiveEnvironment) {
    if (!effectiveEnvironment.SESSION_SECRET?.trim()) {
      add("Environment", "SESSION_SECRET is missing or blank; configure it locally before building. Its value is never printed by this check.");
    }
    try {
      passed.push(`Production origin: ${publicOrigin(effectiveEnvironment)}`);
    } catch {
      add("Environment", "PUBLIC_URL/NEXT_PUBLIC_SITE_URL must be the real HTTPS production origin, without credentials, path, query or fragment.");
    }

    let database;
    try {
      const filename = sqliteFile(effectiveEnvironment.DATABASE_URL ?? "file:./dev.db", root);
      if (!isFile(filename)) {
        add("Database", "The build SQLite database does not exist; sync a current production snapshot to the local DATABASE_URL before deploying.");
      } else {
        const Database = requireModule("better-sqlite3");
        database = new Database(filename, { readonly: true, fileMustExist: true, timeout: 1_000 });
        const integrity = database.pragma("quick_check(1)", { simple: true });
        if (integrity !== "ok") {
          add("Database", "SQLite quick_check failed; replace the local database with a verified backup before building.");
        }
        const tables = new Set(database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all().map((row) => row.name));
        const missing = REQUIRED_TABLES.filter((name) => !tables.has(name));
        if (missing.length) {
          add("Database", `Build database schema is stale: missing ${missing.join(", ")}; sync a current snapshot and apply pending migrations to the local database.`);
        } else if (integrity === "ok") {
          passed.push("Local SQLite quick_check and required schema passed (opened read-only)");
        }
      }
    } catch {
      add("Database", "Cannot open the local build database read-only; check DATABASE_URL, file permissions and better-sqlite3 compatibility with this Node version.");
    } finally {
      database?.close();
    }
  }

  return { ok: issues.length === 0, issues, passed };
}

export function formatResult(result) {
  const lines = [];
  if (result.ok) {
    lines.push("Deploy input preflight passed.", ...result.passed.map((message) => `  ${message}`));
  } else {
    lines.push("Deploy blocked before tests/build: fix these inputs and rerun.");
    for (const group of [...new Set(result.issues.map((issue) => issue.group))]) {
      lines.push(`${group}:`, ...result.issues.filter((issue) => issue.group === group).map((issue) => `  - ${issue.message}`));
    }
  }
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--db-hash") {
    try {
      console.log(buildDatabaseHash());
    } catch {
      console.error("Cannot hash the local build database; run the deploy input preflight to check environment and SQLite access.");
      process.exitCode = 1;
    }
  } else if (process.argv.length > 2) {
    console.error("Usage: node scripts/check-deploy-inputs.mjs [--db-hash]");
    process.exitCode = 1;
  } else {
    const result = checkDeployInputs();
    console[result.ok ? "log" : "error"](formatResult(result));
    if (!result.ok) process.exitCode = 1;
  }
}
