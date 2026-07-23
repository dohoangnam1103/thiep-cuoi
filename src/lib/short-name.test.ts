import assert from "node:assert/strict";
import test from "node:test";

import { shortNameFromFullName } from "./short-name";

test("uses the last two words as the default short name", () => {
  assert.equal(shortNameFromFullName("Nguyễn Quỳnh Anh"), "Quỳnh Anh");
  assert.equal(shortNameFromFullName("Trần Gia Khánh"), "Gia Khánh");
  assert.equal(shortNameFromFullName("An"), "An");
  assert.equal(shortNameFromFullName("  Nguyễn   Minh   Anh  "), "Minh Anh");
});
