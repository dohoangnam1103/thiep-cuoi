import assert from "node:assert/strict";
import test from "node:test";

import { DIEGETIC_ANCHORS } from "./diegetic-anchors";

test("plate-first diegetic cards sit on the foreground surfaces in the lake and wish plates", () => {
  assert.ok(DIEGETIC_ANCHORS.lakePavilion.position[1] <= 0.8);
  assert.ok(DIEGETIC_ANCHORS.wishValley.position[1] <= 0.8);
});
