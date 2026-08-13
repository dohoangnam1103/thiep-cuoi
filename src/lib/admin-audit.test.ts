import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_AUDIT_ACTIONS,
  serializeAuditDetails,
} from "./admin-audit";

test("audit action names are stable", () => {
  assert.equal(ADMIN_AUDIT_ACTIONS.invitationCreated, "INVITATION_CREATED_FOR_USER");
  assert.equal(ADMIN_AUDIT_ACTIONS.complimentaryGranted, "COMPLIMENTARY_GRANTED");
  assert.equal(ADMIN_AUDIT_ACTIONS.priceOverrideCleared, "PRICE_OVERRIDE_CLEARED");
});

test("audit details serialize only the supplied safe metadata", () => {
  const serialized = serializeAuditDetails({
    before: { adminPriceOverride: null, complimentary: false },
    after: { adminPriceOverride: 0, complimentary: true },
    supersededPaymentCount: 2,
  });
  assert.deepEqual(JSON.parse(serialized), {
    before: { adminPriceOverride: null, complimentary: false },
    after: { adminPriceOverride: 0, complimentary: true },
    supersededPaymentCount: 2,
  });
  assert.doesNotMatch(serialized, /password|session|accountNumber/i);
});
