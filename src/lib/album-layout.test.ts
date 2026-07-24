import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAlbumLayout } from "./album-layout";

test("normalizeAlbumLayout giữ giá trị hợp lệ", () => {
  assert.equal(normalizeAlbumLayout("grid"), "grid");
  assert.equal(normalizeAlbumLayout("mosaic"), "mosaic");
  assert.equal(normalizeAlbumLayout("coverflow"), "coverflow");
});

test("normalizeAlbumLayout fallback về grid khi sai/null", () => {
  assert.equal(normalizeAlbumLayout(""), "grid");
  assert.equal(normalizeAlbumLayout(null), "grid");
  assert.equal(normalizeAlbumLayout(undefined), "grid");
  assert.equal(normalizeAlbumLayout("3d"), "grid");
  assert.equal(normalizeAlbumLayout("GRID"), "grid");
});
