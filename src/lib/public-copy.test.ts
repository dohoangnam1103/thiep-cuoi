import assert from "node:assert/strict";
import test from "node:test";

import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import ko from "../../messages/ko.json";
import vi from "../../messages/vi.json";
import zh from "../../messages/zh.json";

test("public message catalogs do not expose historical clone disclosures", () => {
  const catalogs = [vi, en, ko, ja, zh];
  const cloneDisclosure = /bản clone|UI clone|\bclone\b|클론|クローン|克隆/i;

  for (const catalog of catalogs) {
    assert.equal("cloneNote1" in catalog.blog, false);
    assert.equal("cloneNote2" in catalog.blog, false);
    assert.doesNotMatch(JSON.stringify(catalog), cloneDisclosure);
  }
});
