import assert from "node:assert/strict";
import test from "node:test";

import { contentSchema } from "./content-schema";

test("contentSchema preserves false values from hidden form fields", () => {
  const result = contentSchema.parse({
    templateId: "song-hy-red",
    brideFirst: "false",
    showHeroImage: "false",
  });

  assert.equal(result.brideFirst, false);
  assert.equal(result.showHeroImage, false);
});

test("contentSchema keeps the selected ceremony type", () => {
  const result = contentSchema.parse({
    templateId: "song-hy-red",
    ceremonyType: "vu-quy",
  });

  assert.equal(result.ceremonyType, "vu-quy");
});
