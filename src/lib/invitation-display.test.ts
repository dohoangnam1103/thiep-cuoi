import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_OPENING_MESSAGE, defaultCeremonyMessage, orderByBrideFirst } from "./invitation-display";

test("default invitation messages match the editor defaults", () => {
  assert.equal(DEFAULT_OPENING_MESSAGE, "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.");
  assert.equal(defaultCeremonyMessage("thanh-hon"), "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA");
  assert.equal(defaultCeremonyMessage("vu-quy"), "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA");
});

test("orderByBrideFirst applies one display order everywhere", () => {
  assert.deepEqual(orderByBrideFirst("nhà gái", "nhà trai", true), ["nhà gái", "nhà trai"]);
  assert.deepEqual(orderByBrideFirst("nhà gái", "nhà trai", false), ["nhà trai", "nhà gái"]);
});
