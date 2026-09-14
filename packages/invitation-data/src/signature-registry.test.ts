import assert from "node:assert/strict";
import test from "node:test";
import {
  SIGNATURE_TEMPLATE_SLUGS,
  isSignatureTemplate,
  isTemplateAvailable,
} from "./signature-registry.js";
import { TEMPLATE_CATALOG_SLUGS } from "./template-catalog.js";

test("site 2 exposes exactly the existing Signature category templates", () => {
  assert.deepEqual(SIGNATURE_TEMPLATE_SLUGS, [
    "jasmine-white",
    "silk-flora-brown",
  ]);
  assert.equal(isSignatureTemplate("jasmine-white"), true);
  assert.equal(isSignatureTemplate("song-hy-red"), false);
});

test("site 2 serves the full cloned catalog", () => {
  assert.ok(TEMPLATE_CATALOG_SLUGS.length > 100);
  assert.equal(isTemplateAvailable("site-2", "jasmine-white"), true);
  assert.equal(isTemplateAvailable("site-2", "song-hy-red"), true);
  assert.equal(isTemplateAvailable("site-2", "no-such-template"), false);
  assert.equal(isTemplateAvailable("master", "song-hy-red"), true);
});
