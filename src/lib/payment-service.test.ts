import assert from "node:assert/strict";
import test from "node:test";

import type { Payment } from "@/generated/prisma/client";
import {
  cancelPayosPayment,
  PAYOS_CANCELLATION_REASONS,
  type PayosCancellationReason,
} from "@/lib/payment-service";

const cancellationReasons: readonly PayosCancellationReason[] =
  PAYOS_CANCELLATION_REASONS;
const cancelContract: (
  payment: Payment,
  reason?: PayosCancellationReason,
) => Promise<void> = cancelPayosPayment;

test("payOS cancellation reasons are a closed typed contract", () => {
  assert.deepEqual(cancellationReasons, [
    "voucher_changed",
    "provider_create_failed",
    "admin_price_changed",
  ]);
  assert.equal(cancelContract, cancelPayosPayment);
});
