import assert from "node:assert/strict";
import test from "node:test";

import { isEditorUploadPublicUrl } from "./editor-uploads";

const FILENAME = "5a2d16b3-99f0-439e-8463-79221ed0a96a.webp";

test("isEditorUploadPublicUrl accepts only generated editor-upload paths", () => {
  assert.equal(isEditorUploadPublicUrl(`/uploads/${FILENAME}`), true);
  assert.equal(isEditorUploadPublicUrl(`/uploads/${FILENAME}?v=1`), false);
  assert.equal(isEditorUploadPublicUrl("https://example.com/thumbnail.webp"), false);
  assert.equal(isEditorUploadPublicUrl("/uploads/../secret.webp"), false);
  assert.equal(isEditorUploadPublicUrl("/uploads/not-a-uuid.webp"), false);
});
