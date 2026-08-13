import assert from "node:assert/strict";
import test from "node:test";

import {
  adminFinalPriceSchema,
  MAX_ADMIN_FINAL_PRICE,
  resolveEffectiveInvitationPrice,
  resolveSystemInvitationPrice,
} from "@/lib/invitation-pricing";

test("the first paid invitation uses the product price", () => {
  assert.equal(resolveSystemInvitationPrice(150_000, 99_000, 0), 150_000);
});

test("a repeat purchase uses the repeat-customer price", () => {
  assert.equal(resolveSystemInvitationPrice(150_000, 99_000, 1), 99_000);
  assert.equal(resolveSystemInvitationPrice(150_000, 99_000, 5), 99_000);
});

test("an admin final price overrides the system price, including zero", () => {
  assert.equal(resolveEffectiveInvitationPrice(79_000, 150_000), 79_000);
  assert.equal(resolveEffectiveInvitationPrice(0, 150_000), 0);
  assert.equal(resolveEffectiveInvitationPrice(null, 150_000), 150_000);
});

test("the maximum admin final price is 100,000,000 VND", () => {
  assert.equal(MAX_ADMIN_FINAL_PRICE, 100_000_000);
});

test("the admin final price schema accepts only nonempty digit integers in range", () => {
  assert.equal(adminFinalPriceSchema.parse("0"), 0);
  assert.equal(adminFinalPriceSchema.parse(" 79000 "), 79_000);
  assert.equal(
    adminFinalPriceSchema.parse(String(MAX_ADMIN_FINAL_PRICE)),
    MAX_ADMIN_FINAL_PRICE,
  );

  for (const value of [
    "",
    " ",
    "-1",
    "1.5",
    String(MAX_ADMIN_FINAL_PRICE + 1),
  ]) {
    assert.equal(adminFinalPriceSchema.safeParse(value).success, false, value);
  }
});
