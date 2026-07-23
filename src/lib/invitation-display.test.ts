import assert from "node:assert/strict";
import test from "node:test";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  DEFAULT_OPENING_MESSAGE,
  defaultCeremonyMessage,
  invitationCeremonies,
  invitationCeremonyMessage,
  orderByBrideFirst,
} from "./invitation-display";

function displayContent(
  ceremonies?: ChungDoiDemoContent["ceremonies"],
): ChungDoiDemoContent {
  return {
    slug: "song-hy-red",
    invitationId: "invitation-1",
    theme: {
      primaryColor: "#c8102e",
      fontFamily: null,
      assetFolder: null,
      assets: [],
    },
    couple: {
      brideFullName: "",
      groomFullName: "",
      brideShortName: "",
      groomShortName: "",
      brideFirst: true,
      date: "",
      time: "",
      ceremonyDate: "2026-08-28",
      ceremonyTime: "09:00",
      ceremonyHeader: "Lễ cũ",
    },
    families: {
      brideFather: "",
      brideMother: "",
      brideAddress: "",
      groomFather: "",
      groomMother: "",
      groomAddress: "",
      brideParentTitle: "",
      groomParentTitle: "",
    },
    venue: { address: "", mapAddress: "", banquetTime: "" },
    ceremonies,
    schedule: [],
    gallery: [],
    wishes: [],
    bank: {
      brideBankName: "",
      brideAccountNumber: "",
      brideAccountName: "",
      groomBankName: "",
      groomAccountNumber: "",
      groomAccountName: "",
    },
    music: null,
  };
}

test("default invitation messages match the editor defaults", () => {
  assert.equal(DEFAULT_OPENING_MESSAGE, "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.");
  assert.equal(defaultCeremonyMessage("thanh-hon"), "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA");
  assert.equal(defaultCeremonyMessage("vu-quy"), "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA");
});

test("orderByBrideFirst applies one display order everywhere", () => {
  assert.deepEqual(orderByBrideFirst("nhà gái", "nhà trai", true), ["nhà gái", "nhà trai"]);
  assert.deepEqual(orderByBrideFirst("nhà gái", "nhà trai", false), ["nhà trai", "nhà gái"]);
});

test("invitationCeremonies prefers the new ordered ceremony list", () => {
  const content = displayContent([
    { title: " Lễ vu quy ", date: "2026-08-28", time: "09:00" },
    { title: "Lễ thành hôn", date: "2026-08-29", time: "10:30" },
  ]);

  assert.deepEqual(invitationCeremonies(content), [
    { title: "Lễ vu quy", date: "2026-08-28", time: "09:00" },
    { title: "Lễ thành hôn", date: "2026-08-29", time: "10:30" },
  ]);
  assert.equal(invitationCeremonyMessage(content), "Lễ vu quy");
});

test("an explicit empty ceremony list does not restore the legacy ceremony", () => {
  const content = displayContent([]);
  assert.deepEqual(invitationCeremonies(content), []);
  assert.equal(invitationCeremonyMessage(content), "");
});
