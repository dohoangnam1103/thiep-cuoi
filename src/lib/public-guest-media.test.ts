import assert from "node:assert/strict";
import test from "node:test";

import { guestMediaPreview } from "@/lib/public-guest-media";

test("guestMediaPreview shows four items and +2 for a six-item album", () => {
  const preview = guestMediaPreview(["1", "2", "3", "4", "5", "6"]);

  assert.deepEqual(preview.items, ["1", "2", "3", "4"]);
  assert.equal(preview.extraCount, 2);
});

test("guestMediaPreview does not report extras when the album has four items or fewer", () => {
  const preview = guestMediaPreview(["1", "2", "3"]);

  assert.deepEqual(preview.items, ["1", "2", "3"]);
  assert.equal(preview.extraCount, 0);
});
