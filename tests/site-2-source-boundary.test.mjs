import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";

import { assertSite2Path } from "../apps/site-2/src/lib/site2-boundary.ts";

test("site 2 UI changes never target site 1 source", () => {
  const base = process.env.SITE2_BOUNDARY_BASE;
  assert.ok(base, "SITE2_BOUNDARY_BASE is required");
  const committed = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
    encoding: "utf8",
  });
  const working = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  });
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );
  const files = [
    ...new Set(
      `${committed}\n${working}\n${untracked}`.split("\n").filter(Boolean),
    ),
  ];
  assert.doesNotThrow(() => files.forEach(assertSite2Path));
});
