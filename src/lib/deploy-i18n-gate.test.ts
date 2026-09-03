import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import config from "../../playwright.i18n.config";

function runPipeline(failAt: string, skipBuild = "0", entry = "deploy-fast.sh") {
  const root = mkdtempSync(join(tmpdir(), "deploy-i18n-test-"));
  try {
    mkdirSync(join(root, "scripts/lib"), { recursive: true });
    mkdirSync(join(root, "bin"));
    for (const file of ["deploy-fast.sh", "deploy-vps.sh", "check-deploy-i18n.sh"]) {
      copyFileSync(join("scripts", file), join(root, "scripts", file));
    }
    // Stop at the first transport operation: no test can contact production.
    writeFileSync(join(root, "scripts/lib/ssh-transport.sh"), `transport_init() { echo transport >> "$GATE_LOG"; exit 90; }\n`);
    writeFileSync(join(root, "bin/npm"), `#!/bin/sh
printf '%s\\n' "$*" >> "$GATE_LOG"
if [ "$2" = "$FAIL_AT" ]; then exit 41; fi
`, { mode: 0o755 });
    // The VPS wrapper does read-only provisioning/capacity checks before the gate.
    writeFileSync(join(root, "bin/ssh"), `#!/bin/sh
case "$*" in *'df -Pk'*) echo 8388608 ;; esac
exit 0
`, { mode: 0o755 });
    const log = join(root, "events");
    writeFileSync(log, "");
    const result = spawnSync("bash", [join(root, "scripts", entry)], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, GATE_LOG: log, FAIL_AT: failAt, SKIP_BUILD: skipBuild },
      timeout: 10_000,
    });
    return { status: result.status, events: readFileSync(log, "utf8").trim().split("\n").filter(Boolean), output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const entry of ["deploy-fast.sh", "deploy-vps.sh"]) {
  test(`${entry}: failed catalog checks stop before E2E and remote deployment`, () => {
    const result = runPipeline("check:i18n", "0", entry);
    assert.equal(result.status, 41, result.output);
    assert.deepEqual(result.events, ["run check:i18n"]);
  });

  test(`${entry}: failed browser checks stop before remote deployment`, () => {
    const result = runPipeline("test:i18n:e2e", "0", entry);
    assert.equal(result.status, 41, result.output);
    assert.deepEqual(result.events, ["run check:i18n", "run test:i18n:e2e"]);
  });

  test(`${entry}: both checks must pass before transport is started`, () => {
    const result = runPipeline("", "0", entry);
    assert.equal(result.status, 90, result.output);
    assert.deepEqual(result.events, ["run check:i18n", "run test:i18n:e2e", "transport"]);
  });

  test(`${entry}: an old build cannot bypass the gate`, () => {
    const result = runPipeline("", "1", entry);
    assert.equal(result.status, 1, result.output);
    assert.deepEqual(result.events, []);
    assert.match(result.output, /SKIP_BUILD=1/);
  });
}

test("deploy browser checks cannot reuse a stale server or ignore focused tests", () => {
  assert.ok(config.webServer && !Array.isArray(config.webServer));
  assert.equal(config.webServer.reuseExistingServer, false);
  assert.equal(config.forbidOnly, true);
  assert.equal(config.retries, 0);
  assert.equal(config.testMatch, "i18n-coverage.spec.ts");
});
