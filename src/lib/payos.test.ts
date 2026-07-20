import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildPayosSignatureData,
  signPayosData,
  verifyPayosDataSignature,
} from "./payos";

const WEBHOOK_DATA = {
  orderCode: 123,
  amount: 3000,
  description: "VQRIO123",
  accountNumber: "12345678",
  reference: "TF230204212323",
  transactionDateTime: "2023-02-04 18:25:00",
  currency: "VND",
  paymentLinkId: "124c33293c43417ab7879e14c8d9eb18",
  code: "00",
  desc: "Thành công",
  counterAccountBankId: "",
  counterAccountBankName: "",
  counterAccountName: "",
  counterAccountNumber: "",
  virtualAccountName: "",
  virtualAccountNumber: "",
};

test("builds payOS signature data with alphabetically sorted fields", () => {
  assert.equal(
    buildPayosSignatureData(WEBHOOK_DATA),
    "accountNumber=12345678&amount=3000&code=00&counterAccountBankId=&counterAccountBankName=&counterAccountName=&counterAccountNumber=&currency=VND&desc=Thành công&description=VQRIO123&orderCode=123&paymentLinkId=124c33293c43417ab7879e14c8d9eb18&reference=TF230204212323&transactionDateTime=2023-02-04 18:25:00&virtualAccountName=&virtualAccountNumber=",
  );
});

test("signs and verifies payOS webhook data with HMAC-SHA256", () => {
  const signature = signPayosData(WEBHOOK_DATA, "test-checksum-key");
  assert.equal(
    signature,
    "15cd38e52473536ad13caec70a9d5fd6446d63812d84e3ab2af193feb5dded64",
  );
  assert.equal(
    verifyPayosDataSignature(WEBHOOK_DATA, signature, "test-checksum-key"),
    true,
  );
  assert.equal(
    verifyPayosDataSignature(WEBHOOK_DATA, signature, "wrong-key"),
    false,
  );
});
