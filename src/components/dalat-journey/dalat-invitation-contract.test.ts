import assert from "node:assert/strict";
import test from "node:test";

import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";

import {
  DALAT_INVITATION_STOP_ROLES,
  buildDalatInvitationContract,
} from "./dalat-invitation-contract";

test("Dalat journey maps real invitation data onto the five feature stops", () => {
  const content = chungdoiDemoContent["qasr-green"];
  const contract = buildDalatInvitationContract(content);

  assert.deepEqual(contract.roles, DALAT_INVITATION_STOP_ROLES);
  assert.equal(contract.roles.join(","), "cover,album,schedule,map,wishes-gift");
  assert.equal(contract.receptionDate?.yearNumber, 2026);
  assert.equal(contract.receptionDate?.dayNumber, 2);
  assert.match(contract.mapQuery, /Đà Lạt/);
  assert.ok(contract.calendar);
  assert.equal(contract.giftBanks.length, 0);
  assert.match(contract.calendarUrl, /google\.com\/calendar/);
});

test("Dalat invitation exposes gift accounts only when the owner matches the couple", () => {
  const source = chungdoiDemoContent["qasr-green"];
  const content = {
    ...source,
    bank: {
      brideBankName: "BIDV",
      brideAccountNumber: "123456789",
      brideAccountName: "NGUYEN BAO TRAN",
      groomBankName: "Vietcombank",
      groomAccountNumber: "987654321",
      groomAccountName: "TRAN MINH QUAN",
    },
  };
  const contract = buildDalatInvitationContract(content);

  assert.equal(contract.giftBanks.length, 2);
  assert.deepEqual(
    contract.giftBanks.map(({ side }) => side),
    ["groom", "bride"],
  );
});

test("Dalat invitation contract omits unusable map and gift actions", () => {
  const source = chungdoiDemoContent["qasr-green"];
  const content = {
    ...source,
    venue: { ...source.venue, address: "", mapAddress: "" },
    bank: {
      brideBankName: "",
      brideAccountNumber: "",
      brideAccountName: "",
      groomBankName: "",
      groomAccountNumber: "",
      groomAccountName: "",
    },
  };
  const contract = buildDalatInvitationContract(content);

  assert.equal(contract.mapQuery, "");
  assert.deepEqual(contract.giftBanks, []);
});
