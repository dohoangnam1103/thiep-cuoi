import assert from "node:assert/strict";
import test from "node:test";

import {
  checkSite2Imports,
  deployTargets,
} from "../scripts/check-app-boundaries.mjs";
import {
  assertDistinctSiteOrigins,
  publicOrigin,
} from "../scripts/check-deploy-inputs.mjs";

test("apps/site-2 cannot import root master modules", () => {
  const { scanned, violations } = checkSite2Imports();
  assert.ok(scanned > 10, `expected site-2 sources to be scanned, got ${scanned}`);
  assert.deepEqual(violations, []);
});

test("NEXT_PUBLIC_SITE_URL=master is rejected by the site-2 production preflight", async () => {
  const { checkSite2OriginPreflight } = await import(
    "../scripts/check-app-boundaries.mjs"
  );
  assert.doesNotThrow(() => checkSite2OriginPreflight());
  assert.throws(() =>
    publicOrigin({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
  );
  assert.equal(
    publicOrigin({ NEXT_PUBLIC_SITE_URL: "https://thiepmungonline.com" }),
    "https://thiepmungonline.com",
  );
  assert.throws(() =>
    assertDistinctSiteOrigins(
      "https://thiepmungonline.com",
      "https://thiepmungonline.com",
    ),
  );
  assert.deepEqual(
    assertDistinctSiteOrigins(
      "https://thiepmungonline.com",
      "https://site2.example",
    ),
    { master: "https://thiepmungonline.com", site2: "https://site2.example" },
  );
});

test("shared package changes select both build targets", () => {
  assert.deepEqual(
    deployTargets(["packages/invitation-core/src/signature/index.ts"]),
    ["master", "site-2"],
  );
  assert.deepEqual(
    deployTargets(["packages/invitation-data/src/signature-registry.ts"]),
    ["master", "site-2"],
  );
});

test("site-2-only changes do not select the master deploy", () => {
  assert.deepEqual(deployTargets(["apps/site-2/src/app/page.tsx"]), ["site-2"]);
});

test("master changes do not select the site-2 deploy", () => {
  assert.deepEqual(deployTargets(["src/components/chungdoi-demo.tsx"]), [
    "master",
  ]);
});
