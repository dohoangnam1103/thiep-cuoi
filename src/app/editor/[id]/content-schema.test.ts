import assert from "node:assert/strict";
import test from "node:test";

import { contentSchema, parseCeremonies } from "./content-schema";

test("contentSchema preserves false values from hidden form fields", () => {
  const result = contentSchema.parse({
    templateId: "song-hy-red",
    brideFirst: "false",
    showHeroImage: "false",
  });

  assert.equal(result.brideFirst, false);
  assert.equal(result.showHeroImage, false);
});

test("contentSchema keeps the selected ceremony type", () => {
  const result = contentSchema.parse({
    templateId: "song-hy-red",
    ceremonyType: "vu-quy",
  });

  assert.equal(result.ceremonyType, "vu-quy");
});

test("contentSchema keeps the selected album layout", () => {
  const selected = contentSchema.parse({
    templateId: "song-hy-red",
    albumLayout: "coverflow",
  });
  const omitted = contentSchema.parse({ templateId: "song-hy-red" });

  assert.equal(selected.albumLayout, "coverflow");
  assert.equal(omitted.albumLayout, "grid");
});

test("parseCeremonies keeps aligned ceremony rows and skips fully empty rows", () => {
  const formData = new FormData();
  formData.append("ceremonyItemTitle", " Lễ vu quy ");
  formData.append("ceremonyItemDate", "2026-08-28");
  formData.append("ceremonyItemTime", "09:00");
  formData.append("ceremonyItemTitle", "");
  formData.append("ceremonyItemDate", "");
  formData.append("ceremonyItemTime", "");
  formData.append("ceremonyItemTitle", "Lễ thành hôn");
  formData.append("ceremonyItemDate", "2026-08-29");
  formData.append("ceremonyItemTime", "10:30");

  assert.deepEqual(parseCeremonies(formData), [
    { title: "Lễ vu quy", date: "2026-08-28", time: "09:00" },
    { title: "Lễ thành hôn", date: "2026-08-29", time: "10:30" },
  ]);
});

test("contentSchema accepts persisted zodiac IDs and keeps the selected pair", () => {
  const result = contentSchema.parse({
    templateId: "song-hy-red",
    brideZodiac: "meo",
    groomZodiac: "rong",
  });

  assert.equal(result.brideZodiac, "meo");
  assert.equal(result.groomZodiac, "rong");
});

test("contentSchema accepts empty or omitted zodiac fields", () => {
  const empty = contentSchema.parse({
    templateId: "song-hy-red",
    brideZodiac: "",
    groomZodiac: "",
  });
  const omitted = contentSchema.parse({ templateId: "song-hy-red" });

  assert.equal(empty.brideZodiac, "");
  assert.equal(empty.groomZodiac, "");
  assert.equal(omitted.brideZodiac, "");
  assert.equal(omitted.groomZodiac, "");
});

test("contentSchema rejects zodiac values outside the twelve-ID whitelist", () => {
  const result = contentSchema.safeParse({
    templateId: "song-hy-red",
    brideZodiac: "../../rong",
    groomZodiac: "dragon",
  });

  assert.equal(result.success, false);
});
