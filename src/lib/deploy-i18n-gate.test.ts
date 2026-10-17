import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import config from "../../playwright.i18n.config";

type PipelineOptions = {
  failAt?: string;
  skipBuild?: string;
  entry?: string;
  prepareOnly?: boolean;
  deploymentId?: string;
};

type PipelineFixture = {
  root: string;
  receipts: (kind: "gate" | "build") => string[];
  run: (options?: PipelineOptions) => {
    status: number | null;
    events: string[];
    output: string;
  };
};

const prerequisites = ["preflight", "thumbnails", "run prisma:generate", "db-hash"];
const mandatoryChecks = ["run check:i18n", "run test:i18n:e2e"];

function withPipeline<T>(callback: (fixture: PipelineFixture) => T): T {
  const root = mkdtempSync(join(tmpdir(), "deploy-i18n-test-"));
  try {
    mkdirSync(join(root, "scripts/lib"), { recursive: true });
    mkdirSync(join(root, "bin"));
    for (const file of [
      "deploy-fast.sh",
      "deploy-sync-source.sh",
      "deploy-vps.sh",
      "prepare-deploy.sh",
      "deploy-cache.py",
      "check-deploy-i18n.sh",
      "check-deploy-inputs.mjs",
      "run-in-local-build-context.sh",
      "validate-standalone-artifact.sh",
    ]) {
      copyFileSync(join("scripts", file), join(root, "scripts", file));
    }
    // Use the real cache helper against a small complete input tree. The app's
    // build/preflight commands are boundaries; their own tests cover internals.
    const inputs: Record<string, string> = {
      "package.json": JSON.stringify({ name: "deploy-test", version: "1.0.0", scripts: {
        build: "next build", "prisma:generate": "prisma generate",
        "check:i18n": "check-catalogs", "test:i18n:e2e": "playwright test",
      } }),
      "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
      "pnpm-workspace.yaml": "packages:\n  - \"packages/*\"\n",
      "node_modules/.modules.yaml": "{}\n",
      "next.config.ts": "export default {};\n",
      "tsconfig.json": "{}",
      "playwright.config.ts": "export default {};\n",
      "playwright.i18n.config.ts": "export default {};\n",
      "messages/vi.json": "{}",
      "prisma/schema.prisma": "// fixture schema\n",
      "src/app/page.ts": "export default function Page() { return 'fixture'; }\n",
      "public/example.txt": "fixture asset\n",
      "tests/e2e/prepare-db.ts": "// fixture database setup\n",
    };
    for (const [file, contents] of Object.entries(inputs)) {
      mkdirSync(join(root, file, ".."), { recursive: true });
      writeFileSync(join(root, file), contents);
    }
    // Stop at the first deployment transport operation: no fixture can mutate
    // or contact production. The VPS wrapper's read-only probes are also stubbed.
    writeFileSync(join(root, "scripts/lib/ssh-transport.sh"), `transport_init() { echo transport >> "$GATE_LOG"; exit 90; }\n`);
    writeFileSync(join(root, "bin/npm"), `#!/bin/sh
printf '%s\\n' "$*" >> "$GATE_LOG"
if [ "$2" = "$FAIL_AT" ]; then exit 41; fi
if [ "$2" = build ]; then
  mkdir -p .next/standalone/.next/server .next/static
  printf 'fixture server %s\\n' "$NEXT_DEPLOYMENT_ID" > .next/standalone/server.js
  printf 'server page\\n' > .next/standalone/.next/server/page.js
  printf 'client chunk\\n' > .next/static/chunk.js
fi
`, { mode: 0o755 });
    writeFileSync(join(root, "bin/node"), `#!/bin/sh
case "$1" in
  scripts/check-deploy-inputs.mjs)
    if [ "$2" = --db-hash ]; then
      echo db-hash >> "$GATE_LOG"
      printf '%064d\\n' 1
    else
      echo preflight >> "$GATE_LOG"
      if [ "$FAIL_AT" = preflight ]; then exit 40; fi
    fi
    ;;
  scripts/prepare-listing-thumbnails.mjs) echo thumbnails >> "$GATE_LOG" ;;
  *) exec "$REAL_NODE" "$@" ;;
esac
`, { mode: 0o755 });
    writeFileSync(join(root, "bin/ssh"), `#!/bin/sh
case "$*" in *'df -Pk'*) echo 8388608 ;; esac
exit 0
`, { mode: 0o755 });
    const log = join(root, "events");
    const cache = join(root, ".deploy-cache");
    return callback({
      root,
      receipts(kind) {
        try {
          return readdirSync(join(cache, kind)).filter((name) => /^[a-f0-9]{64}$/.test(name));
        } catch {
          return [];
        }
      },
      run({ failAt = "", skipBuild = "0", entry = "deploy-fast.sh", prepareOnly = false, deploymentId = "fixture-release-1" } = {}) {
        writeFileSync(log, "");
        const result = spawnSync("bash", [join(root, "scripts", entry)], {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${join(root, "bin")}:${process.env.PATH}`,
            REAL_NODE: process.execPath,
            GATE_LOG: log,
            FAIL_AT: failAt,
            SKIP_BUILD: skipBuild,
            DEPLOY_CACHE_DIR: cache,
            // These boundary tests exercise the real gate/cache inside an
            // already isolated fixture. Context freezing has separate tests.
            DEPLOY_LOCAL_BUILD_CONTEXT: "1",
            DEPLOY_PREPARE_ONLY: prepareOnly ? "1" : "0",
            DEPLOYMENT_ID: deploymentId,
            PUBLIC_URL: "https://thiepmungonline.com",
          },
          timeout: 20_000,
        });
        return {
          status: result.status,
          events: readFileSync(log, "utf8").trim().split("\n").filter(Boolean),
          output: result.stdout + result.stderr,
        };
      },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const entry of ["deploy-fast.sh", "deploy-vps.sh"]) {
  test(`${entry}: missing build prerequisites stop before tests and remote deployment`, () => {
    withPipeline((fixture) => {
      const result = fixture.run({ failAt: "preflight", entry });
      assert.equal(result.status, 40, result.output);
      assert.deepEqual(result.events, ["preflight"]);
      assert.deepEqual(fixture.receipts("gate"), []);
    });
  });

  test(`${entry}: failed catalog checks stop before E2E and remote deployment without a receipt`, () => {
    withPipeline((fixture) => {
      const result = fixture.run({ failAt: "check:i18n", entry });
      assert.equal(result.status, 41, result.output);
      assert.deepEqual(result.events, [...prerequisites, mandatoryChecks[0]]);
      assert.deepEqual(fixture.receipts("gate"), []);
    });
  });

  test(`${entry}: failed browser checks stop before remote deployment without a receipt`, () => {
    withPipeline((fixture) => {
      const result = fixture.run({ failAt: "test:i18n:e2e", entry });
      assert.equal(result.status, 41, result.output);
      assert.deepEqual(result.events, [...prerequisites, ...mandatoryChecks]);
      assert.deepEqual(fixture.receipts("gate"), []);
    });
  });

  test(`${entry}: both checks must pass before deployment transport is started`, () => {
    withPipeline((fixture) => {
      const result = fixture.run({ entry });
      assert.equal(result.status, 90, result.output);
      assert.deepEqual(result.events, [...prerequisites, ...mandatoryChecks, "transport"]);
      assert.equal(fixture.receipts("gate").length, 1);
    });
  });

  test(`${entry}: an old build cannot bypass the gate`, () => {
    withPipeline((fixture) => {
      const result = fixture.run({ skipBuild: "1", entry });
      assert.equal(result.status, 1, result.output);
      assert.deepEqual(result.events, []);
      assert.match(result.output, /SKIP_BUILD=1/);
    });
  });
}

test("unchanged prepared inputs reuse the gate and verified artifact without another build", () => {
  withPipeline((fixture) => {
    const first = fixture.run({ prepareOnly: true });
    assert.equal(first.status, 0, first.output);
    assert.deepEqual(first.events, [...prerequisites, ...mandatoryChecks, "run build", "db-hash"]);
    assert.equal(fixture.receipts("build").length, 1);
    const retry = fixture.run({ prepareOnly: true, deploymentId: "unused-retry-id" });
    assert.equal(retry.status, 0, retry.output);
    assert.deepEqual(retry.events, prerequisites);
    assert.match(retry.output, /gate_cache=hit/);
    assert.match(retry.output, /build_cache=hit.*fixture-release-1/);
  });
});

test("failed production build keeps only the successful gate receipt and retries the build", () => {
  withPipeline((fixture) => {
    const failed = fixture.run({ prepareOnly: true, failAt: "build" });
    assert.equal(failed.status, 41, failed.output);
    assert.equal(fixture.receipts("gate").length, 1);
    assert.deepEqual(fixture.receipts("build"), []);
    const retry = fixture.run({ prepareOnly: true });
    assert.equal(retry.status, 0, retry.output);
    assert.deepEqual(retry.events, [...prerequisites, "run build", "db-hash"]);
  });
});

test("an application edit invalidates both receipts and reruns the mandatory gate and build", () => {
  withPipeline((fixture) => {
    const first = fixture.run({ prepareOnly: true });
    assert.equal(first.status, 0, first.output);
    writeFileSync(join(fixture.root, "src/app/page.ts"), "export default function Page() { return 'edited'; }\n");
    const changed = fixture.run({ prepareOnly: true });
    assert.equal(changed.status, 0, changed.output);
    assert.deepEqual(changed.events, [...prerequisites, ...mandatoryChecks, "run build", "db-hash"]);
    assert.match(changed.output, /gate_cache=miss/);
    assert.match(changed.output, /build_cache=miss/);
  });
});

test("a damaged cached artifact triggers rebuild while the unchanged gate stays reusable", () => {
  withPipeline((fixture) => {
    const first = fixture.run({ prepareOnly: true });
    assert.equal(first.status, 0, first.output);
    const [key] = fixture.receipts("build");
    writeFileSync(join(fixture.root, ".deploy-cache/build", key, "artifact/server.js"), "damaged\n");
    const retry = fixture.run({ prepareOnly: true });
    assert.equal(retry.status, 0, retry.output);
    assert.deepEqual(retry.events, [...prerequisites, "run build", "db-hash"]);
    assert.match(retry.output, /gate_cache=hit/);
    assert.match(retry.output, /build_cache=miss/);
  });
});

test("deploy browser checks cannot reuse a stale server or ignore focused tests", () => {
  assert.ok(config.webServer && !Array.isArray(config.webServer));
  assert.equal(config.webServer.reuseExistingServer, false);
  assert.equal(config.forbidOnly, true);
  assert.equal(config.retries, 0);
  assert.equal(config.testMatch, "i18n-coverage.spec.ts");
});
