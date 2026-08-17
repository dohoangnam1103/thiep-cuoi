import assert from "node:assert/strict";
import test from "node:test";

import {
  isAllowedCustomerEmail,
  parseAdminTemplateId,
  parseUserSearch,
} from "./admin-support-input";

test("user search is trimmed, lower-cased and bounded", () => {
  assert.equal(parseUserSearch("  USER@Example.COM  "), "user@example.com");
  assert.equal(parseUserSearch("x".repeat(121)), "x".repeat(120));
  assert.equal(parseUserSearch(undefined), "");
});

test("system customer is excluded without excluding anonymous users", () => {
  assert.equal(isAllowedCustomerEmail("system@demo.local"), false);
  assert.equal(isAllowedCustomerEmail("user@example.com"), true);
  assert.equal(isAllowedCustomerEmail(null), true);
});

test("admin template input uses the completed-template server allowlist", () => {
  assert.equal(parseAdminTemplateId("song-hy-red"), "song-hy-red");
  assert.equal(parseAdminTemplateId("not-a-real-template"), null);
  assert.equal(parseAdminTemplateId(null), null);
});
