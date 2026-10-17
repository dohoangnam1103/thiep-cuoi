import assert from "node:assert/strict";
import test from "node:test";
import {
  SIGNATURE_TEMPLATE_SLUGS,
  isSignatureTemplate,
  isTemplateAvailable,
} from "./signature-registry.js";
test("production exposes exactly the existing Signature category templates", () => {
  assert.deepEqual(SIGNATURE_TEMPLATE_SLUGS, [
    "jasmine-white",
    "silk-flora-brown",
  ]);
  assert.equal(isSignatureTemplate("jasmine-white"), true);
  assert.equal(isSignatureTemplate("song-hy-red"), false);
});

test("production template availability accepts the master catalog", () => {
  assert.equal(isTemplateAvailable("master", "song-hy-red"), true);
  assert.equal(isTemplateAvailable("master", "no-such-template"), true);
});
