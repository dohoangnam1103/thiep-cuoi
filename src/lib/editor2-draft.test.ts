import assert from "node:assert/strict";
import test from "node:test";
import { contentSchema, parseCeremonies, parseGallery, parseSchedule } from "@/app/editor/[id]/content-schema";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { editor2FormData, editor2MissingSections, editor2Preview, editor2Seed, editor2UploadedPhotos, withEditor2FullName } from "./editor2-draft";

const base: ChungDoiDemoContent = {
  slug: "song-hy-red", invitationId: "private-test",
  theme: { primaryColor: "#c8102e", fontFamily: null, userFontFamily: null, assetFolder: null, assets: [] },
  couple: { brideFullName: "", groomFullName: "", brideShortName: "", groomShortName: "", brideFirst: true, date: "2026-11-29", time: "", ceremonyDate: "", ceremonyTime: "", ceremonyHeader: "" },
  families: { brideFather: "", brideMother: "", brideAddress: "", groomFather: "", groomMother: "", groomAddress: "", brideParentTitle: "", groomParentTitle: "" },
  venue: { address: "", mapAddress: "", banquetTime: "" },
  schedule: [], gallery: [], wishes: [],
  bank: { brideBankName: "", brideAccountNumber: "", brideAccountName: "", groomBankName: "", groomAccountNumber: "", groomAccountName: "" }, music: null,
};

test("sample photos remain on the card while uploads replace samples and legacy hero defaults stay out of the form", () => {
  const samples = ["/chungdoi/images/gallery/song-hy-red/photo-1.jpg", "/chungdoi/images/gallery/song-hy-red/photo-2.jpg"];
  const initial = editor2Seed("song-hy-red", { heroImage: samples[0], heroImage2: samples[1] }, { ...base, gallery: samples });
  assert.deepEqual(editor2UploadedPhotos(initial.gallery), []);
  assert.deepEqual(editor2Preview(initial, base).gallery, samples);
  assert.equal(initial.fields.heroImage, ""); assert.equal(initial.fields.heroImage2, "");
  assert.deepEqual(parseGallery(editor2FormData(initial)), samples);
  const uploaded = ["/uploads/couple.webp", "https://photos.example/wedding.webp", "/chungdoi/uploads/user-portrait.jpg"];
  const mixed = editor2Seed("song-hy-red", { heroImage: uploaded[0] }, { ...base, gallery: [samples[0], uploaded[0], samples[1], ...uploaded.slice(1)] });
  assert.deepEqual(mixed.gallery, uploaded);
  assert.deepEqual(parseGallery(editor2FormData(mixed)), uploaded);
  assert.equal(editor2Preview(mixed, base, { heroImage: samples[0] }).heroImage, uploaded[0]);
});

test("an empty album projects template sample photos until uploads replace them", () => {
  const samples = ["/chungdoi/images/gallery/song-hy-red/photo-1.jpg", "/chungdoi/images/gallery/song-hy-red/photo-2.jpg"];
  const draft = editor2Seed("song-hy-red", {}, base);
  assert.deepEqual(editor2Preview(draft, base, { gallery: samples }).gallery, samples);
  assert.deepEqual(editor2FormData(draft).getAll("galleryUrl"), []);
  const uploaded = editor2Seed("song-hy-red", {}, { ...base, gallery: ["/uploads/couple.webp"] });
  assert.deepEqual(editor2Preview(uploaded, base, { gallery: samples }).gallery, ["/uploads/couple.webp"]);
  const hidden = { ...draft, fields: { ...draft.fields, showAlbum: false } };
  assert.deepEqual(editor2Preview(hidden, base, { gallery: samples }).gallery, []);
  assert.ok(editor2MissingSections(hidden).includes("album"));
});

test("seeding an existing draft fills missing short names from the stored full names", () => {
  const draft = editor2Seed("song-hy-red", { brideFullName: "Nguyễn Quỳnh Anh", groomFullName: "Trần Gia Khánh" }, base);
  assert.equal(draft.fields.brideShortName, "Quỳnh Anh");
  assert.equal(draft.fields.groomShortName, "Gia Khánh");
  assert.equal(editor2FormData(draft).get("brideShortName"), "Quỳnh Anh");
});

test("full name edits derive short names until the user writes an explicit one", () => {
  const initial = editor2Seed("song-hy-red", {}, base).fields;
  const derived = withEditor2FullName(initial, "brideFullName", "Nguyễn Lan Anh");
  assert.equal(derived.brideShortName, "Lan Anh");
  const explicit = { ...derived, brideShortName: "Quỳnh Anh 2" };
  const retitled = withEditor2FullName(explicit, "brideFullName", "Nguyễn Quỳnh Anh 3");
  assert.equal(retitled.brideShortName, "Quỳnh Anh 2");
  assert.equal(withEditor2FullName(retitled, "groomFullName", "Trần Gia Khánh").groomShortName, "Gia Khánh");
});

test("visual draft preserves every schema field and ordered related rows when serialized", () => {
  const fields = contentSchema.parse({ templateId: "song-hy-red", brideFullName: "Nguyễn Lan Anh", groomFullName: "Trần Minh Đức", brideFirst: false, showHeroImage: false,
    brideFather: "Nguyễn Văn An", groomBankName: "ACB", groomAccountNumber: "01234567", groomAccountName: "Trần Minh Đức", music: "/own.mp3", fontFamily: "Fz Aghita", date: "2026-11-29", banquetTime: "19:30", dressCodeColors: "#eeeeee,#444444", heroImage2: "/chungdoi/test.webp",
    venueName: "Nhà hàng Hoa Mai", address: "123 Nguyễn Huệ, TP. Hồ Chí Minh", mapAddress: "https://www.google.com/maps?q=10.7,106.6" });
  const draft = { fields, ceremonies: [{ title: "Lễ vu quy", date: "2026-11-28", time: "08:00" }, { title: "Lễ thành hôn", date: "2026-11-29", time: "09:30" }], schedule: [{ time: "18:00", label: "Đón khách" }], gallery: ["/own-2.webp", "/own-1.webp"] };
  const form = editor2FormData(draft);
  assert.deepEqual(contentSchema.parse(Object.fromEntries(form)), fields);
  assert.deepEqual(parseCeremonies(form), draft.ceremonies);
  assert.deepEqual(parseSchedule(form), draft.schedule);
  assert.deepEqual(parseGallery(form), draft.gallery);
  assert.equal(editor2Preview(draft, base).venue.address, "Nhà hàng Hoa Mai\n123 Nguyễn Huệ, TP. Hồ Chí Minh");
  const autoMap = { ...draft, fields: { ...draft.fields, mapAddress: "" } };
  assert.equal(editor2Preview(autoMap, base).venue.mapAddress, "123 Nguyễn Huệ, TP. Hồ Chí Minh");
  assert.equal(editor2FormData(autoMap).get("mapAddress"), "");
});

test("sample projections cannot replace cleared text or become stored bank or gallery data", () => {
  const draft = editor2Seed("song-hy-red", { brideFullName: "Lan Anh", groomFullName: "Minh Đức", date: "2026-11-29" }, base);
  const before = JSON.stringify(draft);
  const preview = editor2Preview(draft, base, { heroImage: "/sample.webp" });
  assert.equal(preview.families.brideFather, "");
  assert.equal(preview.couple.time, "");
  assert.equal(preview.venue.address, "");
  assert.equal(preview.heroImage, "/sample.webp");
  assert.equal(JSON.stringify(draft), before);
  const stored = contentSchema.parse(Object.fromEntries(editor2FormData(draft)));
  assert.equal(stored.brideFather, ""); assert.equal(stored.time, ""); assert.equal(stored.address, ""); assert.equal(stored.heroImage, "");
  assert.deepEqual(preview.bank, base.bank);
  const guest = editor2Preview(draft, base);
  assert.equal(guest.families.brideFather, ""); assert.equal(guest.venue.address, ""); assert.equal(guest.heroImage, "");
  assert.equal(guest.couple.time, ""); assert.deepEqual(guest.ceremonies, []);
});

test("legacy ceremonies hydrate and empty sections are explicitly discoverable", () => {
  const legacy = { ...base, couple: { ...base.couple, ceremonyHeader: "Lễ vu quy", ceremonyDate: "2026-11-28", ceremonyTime: "07:00" } };
  const draft = editor2Seed("song-hy-red", { showHeroImage: false }, legacy);
  assert.deepEqual(draft.ceremonies, [{ title: "Lễ vu quy", date: "2026-11-28", time: "07:00" }]);
  assert.deepEqual(editor2MissingSections(draft), ["music", "gift", "schedule", "photos"]);
  const hidden = { ...draft, ceremonies: [] };
  const preview = editor2Preview(hidden, legacy);
  assert.deepEqual(preview.ceremonies, []);
  assert.equal(preview.couple.ceremonyHeader, ""); assert.equal(preview.couple.ceremonyDate, "");
});


test("music is suggested until a track is chosen and its config round-trips", () => {
  const draft = editor2Seed("song-hy-red", {}, base);
  assert.ok(editor2MissingSections(draft).includes("music"));
  const configured = { ...draft, fields: { ...draft.fields, music: "/chungdoi/music/song-hy-red.mp3", musicTitle: "Song Hỷ", musicArtist: "Nhạc nền", musicStartAt: 12, musicEnabled: false } };
  assert.ok(!editor2MissingSections(configured).includes("music"));
  const preview = editor2Preview(configured, base);
  assert.equal(preview.music, "/chungdoi/music/song-hy-red.mp3");
  assert.equal(preview.musicTitle, "Song Hỷ");
  assert.equal(preview.musicStartAt, 12);
  assert.equal(preview.musicEnabled, false);
  assert.equal(editor2FormData(configured).get("musicStartAt"), "12");
});

test("a partially entered gift stays suggested while its real values are preserved", () => {
  const draft = editor2Seed("song-hy-red", { brideBankName: "ACB", brideAccountNumber: "12" }, base);
  assert.ok(editor2MissingSections(draft).includes("gift"));
  assert.equal(editor2FormData(draft).get("brideAccountNumber"), "12");
  const valid = { ...draft, fields: { ...draft.fields, brideAccountNumber: "123456789" } };
  assert.ok(!editor2MissingSections(valid).includes("gift"));
});

test("templates without opening portraits do not suggest adding an unsupported photo section", () => {
  const noPhotos = editor2Seed("spring-garden-green", { showHeroImage: false }, base);
  assert.ok(!editor2MissingSections(noPhotos).includes("photos"));
  const onePhoto = { ...noPhotos, fields: { ...noPhotos.fields, templateId: "song-hy-red" } };
  assert.ok(editor2MissingSections(onePhoto).includes("photos"));
  const twoPhotos = { ...noPhotos, fields: { ...noPhotos.fields, templateId: "double-dragon-red" } };
  assert.ok(editor2MissingSections(twoPhotos).includes("photos"));
});
