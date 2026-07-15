import assert from "node:assert/strict";
import test from "node:test";

import { guestsToCsv, parseGuestCsv } from "@/lib/guest-csv";

test("parseGuestCsv supports Vietnamese headers and quoted commas", () => {
  const result = parseGuestCsv(
    'Họ và tên,Vai trò,Nhà,Nhóm khách,Ghi chú\n"Nguyễn, Minh Anh",Anh,Nhà trai,Bạn đại học,"Ăn chay, không cay"',
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0]?.name, "Nguyễn, Minh Anh");
  assert.equal(result.rows[0]?.side, "Nhà trai");
  assert.equal(result.rows[0]?.note, "Ăn chay, không cay");
});

test("guestsToCsv round-trips guest data", () => {
  const csv = guestsToCsv([
    {
      name: "Trần Thu Hà",
      side: "Nhà gái",
      role: "Chị",
      groupName: "Đồng nghiệp",
      tableName: "Bàn 08",
      phone: "0911222333",
      email: "ha@example.com",
      greeting: "Thân mời chị Hà",
      maxGuests: 2,
      giftAmount: 500000,
      note: "",
    },
  ]);

  const parsed = parseGuestCsv(csv);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.email, "ha@example.com");
  assert.equal(parsed.rows[0]?.giftAmount, 500000);
});

test("parseGuestCsv reports a missing name column", () => {
  const result = parseGuestCsv("Email,Nhà\nminh@example.com,Nhà trai");
  assert.deepEqual(result.rows, []);
  assert.deepEqual(result.errors, ["missingNameColumn"]);
});
