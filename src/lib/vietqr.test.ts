import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVietQrImageUrl,
  buildVietQrPayload,
  normalizeVietQrAccountNumber,
  resolveVietQrBankId,
} from "./vietqr";

test("resolves common Vietnamese bank names to NAPAS BIN codes", () => {
  assert.equal(resolveVietQrBankId("Vietcombank"), "970436");
  assert.equal(resolveVietQrBankId("MB Bank"), "970422");
  assert.equal(resolveVietQrBankId("Techcombank"), "970407");
});

test("recovers an unambiguous one-character typo in a bank name", () => {
  assert.equal(resolveVietQrBankId("techcombamk"), "970407");
});

test("does not guess short or ambiguous bank names", () => {
  assert.equal(resolveVietQrBankId("mmb"), null);
  assert.equal(
    resolveVietQrBankId("alpha", [
      { bin: "970001", code: "A1", shortName: "Alphaa", name: "Alpha One", transferSupported: 1 },
      { bin: "970002", code: "A2", shortName: "Alphab", name: "Alpha Two", transferSupported: 1 },
    ]),
    null,
  );
});

test("resolves full bank names from the current VietQR bank directory", () => {
  assert.equal(
    resolveVietQrBankId("Ngân hàng TMCP Ngoại Thương Việt Nam", [
      {
        bin: "970436",
        code: "VCB",
        shortName: "Vietcombank",
        name: "Ngân hàng TMCP Ngoại Thương Việt Nam",
        transferSupported: 1,
      },
    ]),
    "970436",
  );
});

test("builds a local VietQR image URL instead of a generic text QR", () => {
  assert.equal(
    buildVietQrImageUrl({ bank: "Vietcombank", accountNumber: "0123456789", accountName: "NGUYEN VAN A" }),
    "/api/vietqr?bank=Vietcombank&account=0123456789&name=NGUYEN+VAN+A",
  );
});

test("builds a static EMVCo/NAPAS payload identical to the reference VietQR", () => {
  assert.equal(normalizeVietQrAccountNumber("0123 456-789"), "0123456789");
  assert.equal(
    buildVietQrPayload({ bankId: "970407", accountNumber: "19037826671019" }),
    "00020101021138580010A000000727012800069704070114190378266710190208QRIBFTTA53037045802VN62130809Mung cuoi63046926",
  );
});

test("builds a dynamic amount payload identical to the reference VietQR", () => {
  assert.equal(
    buildVietQrPayload({ bankId: "970422", accountNumber: "0357596289", amount: 150000, addInfo: "CDABC234" }),
    "00020101021238540010A00000072701240006970422011003575962890208QRIBFTTA530370454061500005802VN62120808CDABC234630487E1",
  );
});
