import assert from "node:assert/strict";
import test from "node:test";

import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import ko from "../../messages/ko.json";
import vi from "../../messages/vi.json";
import zh from "../../messages/zh.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("admin support copy has the same shape in every locale", () => {
  const expected = keyPaths(vi.adminSupport).sort();
  for (const catalog of [en, ko, ja, zh]) {
    assert.deepEqual(keyPaths(catalog.adminSupport).sort(), expected);
  }
});

test("activation copy exists for dashboard, payment and editor", () => {
  for (const catalog of [vi, en, ko, ja, zh]) {
    assert.equal(typeof catalog.dashboardActivation.complimentary, "string");
    assert.equal(typeof catalog.paymentActivation.priceChanged, "string");
    assert.equal(
      typeof catalog.paymentActivation.errors.customPriceVoucherBlocked,
      "string",
    );
    assert.equal(typeof catalog.editor.support.banner, "string");
    assert.equal(typeof catalog.editor.errors.invitationNotFound, "string");
    assert.equal(typeof catalog.adminSupport.errors.invalidPrice, "string");
  }
});
