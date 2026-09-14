import assert from "node:assert/strict";
import test from "node:test";
import {
  SIGNATURE_TEMPLATE_SLUGS,
  isTemplateAvailable,
} from "./signature-registry.js";

test("site 2 exposes exactly the existing Signature category templates", () => {
  assert.deepEqual(SIGNATURE_TEMPLATE_SLUGS, [
    "jasmine-white",
    "silk-flora-brown",
  ]);
  assert.equal(isTemplateAvailable("site-2", "jasmine-white"), true);
  assert.equal(isTemplateAvailable("site-2", "song-hy-red"), false);
  assert.equal(isTemplateAvailable("master", "song-hy-red"), true);
});
