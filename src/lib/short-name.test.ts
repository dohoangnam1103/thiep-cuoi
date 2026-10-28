import assert from "node:assert/strict";
import test from "node:test";

import { displayShortName, shortNameFromFullName } from "./short-name";

test("uses the last two words as the default short name", () => {
  assert.equal(shortNameFromFullName("Nguyễn Quỳnh Anh"), "Quỳnh Anh");
  assert.equal(shortNameFromFullName("Trần Gia Khánh"), "Gia Khánh");
  assert.equal(shortNameFromFullName("An"), "An");
  assert.equal(shortNameFromFullName("  Nguyễn   Minh   Anh  "), "Minh Anh");
});

test("explicit short names override derived names without truncating them", () => {
  assert.equal(displayShortName("Nguyễn Quỳnh Anh 1", "Quỳnh Anh 2"), "Quỳnh Anh 2");
  assert.equal(displayShortName("Trần Gia Khánh", "  Gia Khánh Yêu  "), "Gia Khánh Yêu");
  assert.equal(displayShortName("Nguyễn Tên Mới", "Quỳnh Anh 2"), "Quỳnh Anh 2");
});

test("only empty short names fall back to the last two words", () => {
  for (const empty of [undefined, null, "", "   "]) {
    assert.equal(displayShortName("Nguyễn Quỳnh Anh 1", empty), "Anh 1");
  }
});
