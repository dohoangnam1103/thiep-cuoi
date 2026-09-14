import assert from "node:assert/strict";
import test from "node:test";
import {
  getSignatureRenderer,
  SIGNATURE_RENDERER_SLUGS,
} from "./index";

test("the shared package exports exactly two Signature renderers", () => {
  assert.deepEqual([...SIGNATURE_RENDERER_SLUGS], [
    "jasmine-white",
    "silk-flora-brown",
  ]);
  assert.equal(typeof getSignatureRenderer("jasmine-white"), "function");
  assert.equal(getSignatureRenderer("song-hy-red"), undefined);
});
