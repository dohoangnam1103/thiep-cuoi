import assert from "node:assert/strict";
import test from "node:test";

import { slideshowTemplateCatalog } from "./catalog";

test("slideshow template ids are unique and versioned", () => {
  const ids = slideshowTemplateCatalog.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const template of slideshowTemplateCatalog) {
    assert.ok(Number.isInteger(template.version));
    assert.ok(template.version > 0);
  }
});

test("every published slideshow template supports both product formats", () => {
  for (const template of slideshowTemplateCatalog) {
    assert.deepEqual([...template.capabilities.formats].sort(), ["phone", "tv"]);
    assert.ok(template.capabilities.minPhotos > 0);
    assert.ok(template.capabilities.maxPhotos >= template.capabilities.minPhotos);
    assert.ok(template.previewImages.tv.length > 0);
    assert.ok(template.previewImages.phone.length > 0);
  }
});
