import assert from "node:assert/strict";
import test from "node:test";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  DEFAULT_OPENING_MESSAGE,
  defaultCeremonyMessage,
  invitationCeremonies,
  invitationCeremonyMessage,
  invitationCouple,
  invitationGiftAccounts,
  invitationHeroPhotos,
  invitationHeroImage,
  orderByBrideFirst,
  orderedCouple,
  orderedHeroPhotos,
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

function heroContent(overrides: {
  heroImage?: string;
  heroImage2?: string;
  gallery?: string[];
  brideFirst?: boolean;
  showHeroImage?: boolean;
}): ChungDoiDemoContent {
  const content = displayContent();
  return {
    ...content,
    heroImage: overrides.heroImage,
    heroImage2: overrides.heroImage2,
    showHeroImage: overrides.showHeroImage,
    gallery: overrides.gallery ?? [],
    couple: {
      ...content.couple,
      brideFullName: "Quỳnh Anh",
      groomFullName: "Gia Khánh",
      brideFirst: overrides.brideFirst ?? true,
    },
  };
}

test("single opening photo follows album changes until a dedicated upload overrides it", () => {
  const content = heroContent({
    heroImage: "/chungdoi/images/gallery/minimalism-purple/photo-6.jpg",
    gallery: ["/uploads/new-first.webp", "/uploads/second.webp"],
  });
  assert.equal(invitationHeroImage(content), "/uploads/new-first.webp");
  content.gallery.reverse();
  assert.equal(invitationHeroImage(content), "/uploads/second.webp");
  content.heroImage = "/uploads/dedicated.webp";
  assert.equal(invitationHeroImage(content), "/uploads/dedicated.webp");
  content.heroImage = "";
  assert.equal(invitationHeroImage(content), "/uploads/second.webp");
  content.showHeroImage = false;
  assert.equal(invitationHeroImage(content), "");
});

test("two opening photos default to the live album without copying the template seed", () => {
  const content = heroContent({
    heroImage: "/chungdoi/images/gallery/minimalism-green/hero-bride.webp",
    heroImage2: "/chungdoi/images/gallery/minimalism-green/hero-groom.webp",
    gallery: ["/uploads/first.webp", "/uploads/second.webp"],
    brideFirst: false,
  });
  assert.deepEqual(orderedHeroPhotos(content), content.gallery);
  content.gallery.reverse();
  assert.deepEqual(orderedHeroPhotos(content), content.gallery);
  content.heroImage2 = "/uploads/groom.webp";
  assert.deepEqual(orderedHeroPhotos(content), ["/uploads/groom.webp", content.gallery[0]]);
  content.heroImage = "/uploads/bride.webp";
  assert.deepEqual(orderedHeroPhotos(content), ["/uploads/groom.webp", "/uploads/bride.webp"]);
});

test("empty and short albums do not invent opening photos", () => {
  assert.equal(invitationHeroImage(heroContent({ gallery: [] })), "");
  assert.deepEqual(orderedHeroPhotos(heroContent({ gallery: ["/one.webp"] })), ["/one.webp", ""]);
});

test("hero slots belong to a person, not a position", () => {
  const content = heroContent({ heroImage: "/bride.webp", heroImage2: "/groom.webp" });

  assert.deepEqual(invitationHeroPhotos(content), {
    bride: "/bride.webp",
    groom: "/groom.webp",
  });
});

test("hiding the header photos clears both people", () => {
  const content = heroContent({
    heroImage: "/bride.webp",
    heroImage2: "/groom.webp",
    showHeroImage: false,
  });

  assert.deepEqual(invitationHeroPhotos(content), { bride: "", groom: "" });
});

test("the groom photo stays with the groom when the groom's family comes first", () => {
  const brideFirst = heroContent({
    heroImage: "/bride.webp",
    heroImage2: "/groom.webp",
    brideFirst: true,
  });
  const groomFirst = heroContent({
    heroImage: "/bride.webp",
    heroImage2: "/groom.webp",
    brideFirst: false,
  });

  assert.deepEqual(orderedHeroPhotos(brideFirst), ["/bride.webp", "/groom.webp"]);
  assert.deepEqual(orderedHeroPhotos(groomFirst), ["/groom.webp", "/bride.webp"]);
});

test("each person in the display order carries their own header photo", () => {
  const content = heroContent({
    heroImage: "/bride.webp",
    heroImage2: "/groom.webp",
    brideFirst: false,
  });

  const [first, second] = orderedCouple(content);
  assert.equal(first.side, "groom");
  assert.equal(first.heroPhoto, "/groom.webp");
  assert.equal(second.side, "bride");
  assert.equal(second.heroPhoto, "/bride.webp");
});

test("invitationCouple keeps each side addressable for side-specific artwork", () => {
  const content = heroContent({
    heroImage: "/bride.webp",
    heroImage2: "/groom.webp",
    brideFirst: false,
  });

  const { bride, groom } = invitationCouple(content);
  assert.equal(bride.side, "bride");
  assert.equal(bride.fullName, "Quỳnh Anh");
  assert.equal(bride.heroPhoto, "/bride.webp");
  assert.equal(groom.side, "groom");
  assert.equal(groom.fullName, "Gia Khánh");
  assert.equal(groom.heroPhoto, "/groom.webp");
});

test("invitationCouple can fall back to the album per side", () => {
  const content = heroContent({
    heroImage2: "/groom.webp",
    gallery: ["/album-1.webp"],
    brideFirst: false,
  });

  const { bride, groom } = invitationCouple(content, { albumFallback: true });
  assert.equal(bride.heroPhoto, "/album-1.webp");
  assert.equal(groom.heroPhoto, "/groom.webp");
});

test("an empty hero slot falls back to that person's album photo", () => {
  const content = heroContent({ gallery: ["/album-1.webp", "/album-2.webp"] });

  assert.deepEqual(invitationHeroPhotos(content, { albumFallback: true }), {
    bride: "/album-1.webp",
    groom: "/album-2.webp",
  });
});

test("the album fallback follows the display order, not the bride slot", () => {
  const content = heroContent({
    gallery: ["/album-1.webp", "/album-2.webp"],
    brideFirst: false,
  });

  // Nobody uploaded a photo yet, so the album fills the visible positions in
  // order: the first album photo stays in the first frame either way.
  assert.deepEqual(orderedHeroPhotos(content, { albumFallback: true }), [
    "/album-1.webp",
    "/album-2.webp",
  ]);
  assert.deepEqual(invitationHeroPhotos(content, { albumFallback: true }), {
    bride: "/album-2.webp",
    groom: "/album-1.webp",
  });
});

test("templates with side-locked frames fill the album from the bride's frame", () => {
  const content = heroContent({
    gallery: ["/album-1.webp", "/album-2.webp"],
    brideFirst: false,
  });

  // A bride frame stays a bride frame, so its slot is the first one on the card
  // no matter which family is announced first.
  const { bride, groom } = invitationCouple(content, {
    albumFallback: true,
    fixedSides: true,
  });
  assert.equal(bride.heroPhoto, "/album-1.webp");
  assert.equal(groom.heroPhoto, "/album-2.webp");
});

test("the album fallback fills only the slot the user left empty", () => {
  const content = heroContent({
    heroImage2: "/groom.webp",
    gallery: ["/album-1.webp", "/album-2.webp"],
  });

  assert.deepEqual(invitationHeroPhotos(content, { albumFallback: true }), {
    bride: "/album-1.webp",
    groom: "/groom.webp",
  });
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

function giftContent(bank: Partial<ChungDoiDemoContent["bank"]>, brideFirst = true): ChungDoiDemoContent {
  const base = displayContent();
  return {
    ...base,
    couple: {
      ...base.couple,
      brideFirst,
      brideFullName: "Lê Vân Khánh",
      brideShortName: "Vân Khánh",
      groomFullName: "Trần Hải Đăng",
      groomShortName: "Hải Đăng",
    },
    bank: { ...base.bank, ...bank },
  };
}

test("invitationGiftAccounts keeps only accounts that can produce a QR", () => {
  const accounts = invitationGiftAccounts(
    giftContent({
      brideBankName: "Vietcombank",
      brideAccountNumber: "1026888899",
      brideAccountName: "Le Van Khanh",
      groomBankName: "Techcombank",
      groomAccountNumber: "1903888899",
      groomAccountName: "Tran Hai Dang",
    }),
  );

  assert.deepEqual(
    accounts.map((account) => [account.side, account.bank, account.num]),
    [
      ["bride", "Vietcombank", "1026888899"],
      ["groom", "Techcombank", "1903888899"],
    ],
  );
});

test("invitationGiftAccounts drops a bank picked without an account number", () => {
  // The editor's bank combobox makes this the most likely half-filled state:
  // one click sets the bank, the account number stays empty.
  const accounts = invitationGiftAccounts(
    giftContent({
      brideBankName: "Vietcombank",
      brideAccountNumber: "",
      brideAccountName: "",
      groomBankName: "Techcombank",
      groomAccountNumber: "1903888899",
      groomAccountName: "Tran Hai Dang",
    }),
  );

  assert.deepEqual(accounts.map((account) => account.side), ["groom"]);
});

test("invitationGiftAccounts drops an account number too short for VietQR", () => {
  const accounts = invitationGiftAccounts(
    giftContent({ brideBankName: "Vietcombank", brideAccountNumber: "123" }),
  );

  assert.deepEqual(accounts, []);
});

test("invitationGiftAccounts drops an account holder name with no bank or number", () => {
  const accounts = invitationGiftAccounts(
    giftContent({ brideAccountName: "Le Van Khanh", groomAccountName: "Tran Hai Dang" }),
  );

  assert.deepEqual(accounts, []);
});

test("invitationGiftAccounts ignores whitespace-only bank details", () => {
  const accounts = invitationGiftAccounts(
    giftContent({ brideBankName: "   ", brideAccountNumber: "   " }),
  );

  assert.deepEqual(accounts, []);
});

test("invitationGiftAccounts returns accounts in display order", () => {
  const bank = {
    brideBankName: "Vietcombank",
    brideAccountNumber: "1026888899",
    brideAccountName: "Le Van Khanh",
    groomBankName: "Techcombank",
    groomAccountNumber: "1903888899",
    groomAccountName: "Tran Hai Dang",
  };

  assert.deepEqual(
    invitationGiftAccounts(giftContent(bank, true)).map((account) => account.side),
    ["bride", "groom"],
  );
  assert.deepEqual(
    invitationGiftAccounts(giftContent(bank, false)).map((account) => account.side),
    ["groom", "bride"],
  );
});

test("invitationGiftAccounts carries the captions templates build labels from", () => {
  const [account] = invitationGiftAccounts(
    giftContent({
      brideBankName: "Vietcombank",
      brideAccountNumber: "1026888899",
      brideAccountName: "Le Van Khanh",
    }),
  );

  assert.equal(account.birthOrder, "Út Nữ");
  assert.equal(account.fullName, "Lê Vân Khánh");
  assert.equal(account.shortName, "Vân Khánh");
  assert.equal(account.name, "Le Van Khanh");
});
