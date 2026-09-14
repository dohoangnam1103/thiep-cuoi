#!/usr/bin/env node
// Two-app boundary gates: import isolation, production origin preflight, and
// deterministic path-to-deploy-target selection. Read-only, never mutates
// production or the master app.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE2_SRC = path.join(ROOT, "apps", "site-2", "src");

export function deployTargets(changedPaths) {
  if (changedPaths.some((p) => p.startsWith("packages/invitation-"))) {
    return ["master", "site-2"];
  }
  const targets = [];
  if (changedPaths.some((p) => !p.startsWith("apps/site-2/"))) {
    targets.push("master");
  }
  if (changedPaths.some((p) => p.startsWith("apps/site-2/"))) {
    targets.push("site-2");
  }
  return targets;
}

function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Site 2 must never import root master modules: no `@/` alias (which maps to
 * the master `src/`), no relative escape above `apps/site-2/`, and no master
 * hostname except inside the guard that rejects it.
 */
export function checkSite2Imports() {
  const violations = [];
  let scanned = 0;
  for (const file of listSourceFiles(SITE2_SRC)) {
    scanned += 1;
    const text = readFileSync(file, "utf8");
    const dir = path.dirname(file);
    for (const match of text.matchAll(/from\s+(['"])([^'"]+)\1/g)) {
      const spec = match[2];
      if (spec.startsWith("@/")) {
        violations.push(`${file}: master alias import ${spec}`);
      } else if (spec.startsWith(".")) {
        const base = spec.split("?")[0].split("#")[0];
        const resolved = path.resolve(dir, base);
        const rel = path.relative(path.join(ROOT, "apps", "site-2"), resolved);
        if (rel === ".." || rel.startsWith(`..${path.sep}`)) {
          violations.push(`${file}: import escapes apps/site-2 (${spec})`);
        }
      }
    }
    if (
      text.includes("thiepmungonline.com") &&
      !/^site-url(\.test)?\.ts$/.test(path.basename(file))
    ) {
      violations.push(`${file}: references the master hostname`);
    }
  }
  return { scanned, violations };
}

/** Behavioral production preflight for the site-2 origin (via tsx, no build). */
export function checkSite2OriginPreflight() {
  const moduleUrl = pathToFileURL(
    path.join(SITE2_SRC, "lib", "site-url.ts"),
  ).href;
  const probe = `
    import(${JSON.stringify(moduleUrl)}).then((m) => {
      let masterRejected = false;
      try {
        m.resolveSite2Url("https://thiepmungonline.com", "production");
      } catch { masterRejected = true; }
      if (!masterRejected) throw new Error("master origin was accepted");
      const own = m.resolveSite2Url("https://site2.example", "production");
      if (own !== "https://site2.example") throw new Error("own origin rejected");
      console.log("site-2 origin preflight ok");
    }).catch((error) => { console.error(error.message); process.exit(1); });
  `;
  execFileSync("npx", ["tsx", "--eval", probe], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { scanned, violations } = checkSite2Imports();
  if (violations.length > 0) {
    console.error(`App boundary violations (${scanned} files scanned):`);
    for (const v of violations) console.error(`  - ${v}`);
    process.exitCode = 1;
  } else {
    console.log(`App boundary imports ok (${scanned} site-2 files scanned).`);
  }
  if (process.exitCode == null || process.exitCode === 0) {
    try {
      checkSite2OriginPreflight();
    } catch (error) {
      console.error(`Site-2 origin preflight failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (process.argv.includes("--targets")) {
    const idx = process.argv.indexOf("--targets");
    const changed = process.argv.slice(idx + 1);
    console.log(JSON.stringify(deployTargets(changed)));
  }
}
