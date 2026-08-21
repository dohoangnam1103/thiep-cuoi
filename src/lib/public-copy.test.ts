import assert from "node:assert/strict";
import test from "node:test";

import vi from "../../messages/vi.json";

test("public message catalog does not expose historical clone disclosures", () => {
  const cloneDisclosure = /bản clone|UI clone|\bclone\b/i;

  assert.equal("cloneNote1" in vi.blog, false);
  assert.equal("cloneNote2" in vi.blog, false);
  assert.doesNotMatch(JSON.stringify(vi), cloneDisclosure);
});
