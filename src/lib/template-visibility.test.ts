import assert from "node:assert/strict";
import test from "node:test";

import { isTemplateVisible } from "./template-visibility";

test("template visibility defaults to visible without an override", () => {
  assert.equal(isTemplateVisible({}, "new-template"), true);
});

test("template visibility honors explicit on and off overrides", () => {
  assert.equal(isTemplateVisible({ hidden: false }, "hidden"), false);
  assert.equal(isTemplateVisible({ visible: true }, "visible"), true);
});
