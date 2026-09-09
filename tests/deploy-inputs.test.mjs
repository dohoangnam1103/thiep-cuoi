import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildDatabaseHash, checkDeployInputs, formatResult, publicOrigin, REQUIRED_CLI, REQUIRED_FILES, sqliteFile } from "../scripts/check-deploy-inputs.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "deploy-inputs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [...REQUIRED_FILES, "src/i18n/coverage.test.ts", "node_modules/cli", "browser"]) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), "");
  }
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ engines: { node: ">=24" } }));
  chmodSync(path.join(root, "node_modules/cli"), 0o755);
  chmodSync(path.join(root, "browser"), 0o755);
  mkdirSync(path.join(root, "node_modules/.bin"));
  for (const name of REQUIRED_CLI) symlinkSync("../cli", path.join(root, "node_modules/.bin", name));
  const db = new Database(path.join(root, "dev.db"));
  db.exec("CREATE TABLE TemplateHeroTypography(id TEXT); CREATE TABLE TemplateRouteAlias(id TEXT);");
  db.close();
  const options = {
    root,
    environment: { SESSION_SECRET: "private-test-secret", PUBLIC_URL: "https://thiepmungonline.com", DATABASE_URL: "file:./dev.db" },
    nodeVersion: "24.13.0",
    requireModule(name) {
      if (name === "@playwright/test") return { chromium: { executablePath: () => path.join(root, "browser") } };
      return require(name);
    },
  };
  return options;
}

test("complete inputs pass with valid CLI symlinks and a read-only SQLite check", (t) => {
  const options = fixture(t);
  const actualRequire = options.requireModule;
  let openedReadOnly = false;
  options.requireModule = (name) => name === "better-sqlite3" ? function (...args) {
    assert.deepEqual(args[1], { readonly: true, fileMustExist: true, timeout: 1_000 });
    openedReadOnly = true;
    return new Database(...args);
  } : actualRequire(name);
  const result = checkDeployInputs(options);
  assert.equal(result.ok, true, formatResult(result));
  assert.equal(openedReadOnly, true);
  assert.doesNotMatch(formatResult(result), /private-test-secret|file:\.\/dev\.db/);
});

test("missing tests, unsupported Node, broken CLI, browser, env and database failures are grouped", (t) => {
  const options = fixture(t);
  rmSync(path.join(options.root, "tests/e2e/prepare-db.ts"));
  rmSync(path.join(options.root, "src/i18n"), { recursive: true });
  rmSync(path.join(options.root, "node_modules/cli"));
  rmSync(path.join(options.root, "browser"));
  rmSync(path.join(options.root, "dev.db"));
  options.nodeVersion = "22.0.0";
  options.environment.SESSION_SECRET = " ";
  options.environment.PUBLIC_URL = "http://localhost:3000";
  const result = checkDeployInputs(options);
  assert.equal(result.ok, false);
  assert.deepEqual(new Set(result.issues.map((issue) => issue.group)), new Set(["Source", "Runtime", "Dependencies", "Browser", "Environment", "Database"]));
  assert.match(formatResult(result), /prepare-db.ts/);
  assert.match(formatResult(result), /node_modules\/\.bin\/next/);
});

test("missing local database is never created", (t) => {
  const options = fixture(t);
  options.environment.DATABASE_URL = "file:./absent.db";
  const result = checkDeployInputs(options);
  assert.equal(result.ok, false);
  assert.equal(existsSync(path.join(options.root, "absent.db")), false);
  const db = new Database(path.join(options.root, "dev.db"));
  db.exec("DROP TABLE TemplateHeroTypography");
  db.close();
  options.environment.DATABASE_URL = "file:./dev.db";
  assert.match(formatResult(checkDeployInputs(options)), /missing TemplateHeroTypography/);
});

test("database corruption fails early without echoing private values", (t) => {
  const options = fixture(t);
  writeFileSync(path.join(options.root, "dev.db"), "not a sqlite database");
  const report = formatResult(checkDeployInputs(options));
  assert.match(report, /Cannot open the local build database read-only/);
  assert.doesNotMatch(report, /private-test-secret|not a sqlite database/);
});

test("production env files are loaded through @next/env without forwarding secrets in errors", (t) => {
  const options = fixture(t);
  const environment = options.environment;
  delete options.environment;
  const actualRequire = options.requireModule;
  let loaded = false;
  options.requireModule = (name) => name === "@next/env" ? {
    loadEnvConfig(root, dev, logger, forceReload) {
      assert.equal(root, options.root);
      assert.equal(dev, false);
      assert.equal(forceReload, true);
      logger.info("private-test-secret");
      loaded = true;
      return { combinedEnv: environment };
    },
  } : actualRequire(name);
  assert.equal(checkDeployInputs(options).ok, true);
  assert.equal(loaded, true);
});

test("PUBLIC_URL overrides the development site URL for production builds", () => {
  assert.equal(publicOrigin({ PUBLIC_URL: "https://thiepmungonline.com/", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), "https://thiepmungonline.com");
  assert.equal(publicOrigin({ NEXT_PUBLIC_SITE_URL: "https://example.com" }), "https://example.com");
  for (const value of ["http://example.com", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://secret@example.com", "https://example.com/path", "https://example.com?token=secret"]) {
    assert.throws(() => publicOrigin({ PUBLIC_URL: value }));
  }
});

test("SQLite URLs resolve like the local Prisma adapter without accepting network databases", () => {
  assert.equal(sqliteFile("file:./dev.db", "/build"), "/build/dev.db");
  assert.equal(sqliteFile("file:/data/dev.db", "/build"), "/data/dev.db");
  assert.equal(sqliteFile("file:///data/dev.db", "/build"), "/data/dev.db");
  for (const value of ["postgres://private", "file:", "file::memory:", "file:./dev.db?mode=ro"]) assert.throws(() => sqliteFile(value, "/build"));
});

test("database hash includes committed WAL writes and is stable without database changes", (t) => {
  const options = fixture(t);
  const writer = new Database(path.join(options.root, "dev.db"));
  t.after(() => writer.close());
  writer.pragma("journal_mode = WAL");
  const before = buildDatabaseHash(options);
  assert.match(before, /^[a-f0-9]{64}$/);
  assert.equal(buildDatabaseHash(options), before);
  writer.exec("INSERT INTO TemplateRouteAlias (id) VALUES ('renamed-demo')");
  assert.notEqual(buildDatabaseHash(options), before);
});
