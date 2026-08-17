import assert from "node:assert/strict";
import test from "node:test";

import { parseAuditDetailsForDisplay } from "./admin-audit-view";

test("audit display parser returns only allowed price metadata", () => {
  assert.deepEqual(
    parseAuditDetailsForDisplay(JSON.stringify({
      before: { adminPriceOverride: null, complimentary: false, passwordHash: "secret" },
      after: { adminPriceOverride: 79_000, complimentary: false, bankAccount: "123" },
      supersededPaymentCount: 2,
      sessionToken: "secret",
    })),
    {
      beforePrice: null,
      afterPrice: 79_000,
      beforeComplimentary: false,
      afterComplimentary: false,
      supersededPaymentCount: 2,
    },
  );
});

test("malformed or wrong-shaped audit details are ignored", () => {
  assert.equal(parseAuditDetailsForDisplay("not-json"), null);
  assert.equal(parseAuditDetailsForDisplay(JSON.stringify(["raw"])), null);
  assert.equal(parseAuditDetailsForDisplay(null), null);
});
