import assert from "node:assert/strict";
import test from "node:test";

import vi from "../../messages/vi.json";

test("activation copy exists for dashboard, payment and editor", () => {
  assert.equal(typeof vi.dashboardActivation.complimentary, "string");
  assert.equal(typeof vi.paymentActivation.priceChanged, "string");
  assert.equal(
    typeof vi.paymentActivation.errors.customPriceVoucherBlocked,
    "string",
  );
  assert.equal(typeof vi.editor.support.banner, "string");
  assert.equal(typeof vi.editor.errors.invitationNotFound, "string");
  assert.equal(typeof vi.adminSupport.errors.invalidPrice, "string");
});
