import assert from "node:assert/strict";
import { test } from "node:test";

import { slugFromFormFields, slugifyInput, uniqueSlugFromFormFields } from "./slug";

test("slugFromFormFields builds a public slug from the current couple names", () => {
  assert.equal(
    slugFromFormFields({
      brideFullName: "Nguyễn Quỳnh Anh",
      groomFullName: "Trần Gia Khánh",
      brideShortName: "Quỳnh Anh",
      groomShortName: "Gia Khánh",
      brideFirst: true,
    }),
    "quynh-anh-gia-khanh",
  );
});

test("slugFromFormFields respects groom-first ordering", () => {
  assert.equal(
    slugFromFormFields({
      brideFullName: "Nguyễn Quỳnh Anh",
      groomFullName: "Trần Gia Khánh",
      brideShortName: "Quỳnh Anh",
      groomShortName: "Gia Khánh",
      brideFirst: false,
    }),
    "gia-khanh-quynh-anh",
  );
});

test("slugifyInput keeps a trailing hyphen while normalizing typed slugs", () => {
  assert.equal(slugifyInput("Quỳnh Anh & "), "quynh-anh-");
});

const couple = {
  brideFullName: "Nguyễn Quỳnh Anh",
  groomFullName: "Trần Gia Khánh",
  brideShortName: "Quỳnh Anh",
  groomShortName: "Gia Khánh",
  brideFirst: true,
  date: "2026-11-29",
};

test("uniqueSlugFromFormFields keeps the couple names when free", async () => {
  assert.equal(await uniqueSlugFromFormFields(couple, async () => false), "quynh-anh-gia-khanh");
});

test("uniqueSlugFromFormFields adds the wedding day when the names are taken", async () => {
  const taken = new Set(["quynh-anh-gia-khanh"]);
  assert.equal(await uniqueSlugFromFormFields(couple, async slug => taken.has(slug)), "quynh-anh-gia-khanh-29112026");
});

test("uniqueSlugFromFormFields falls back to the current date and time, then a counter", async () => {
  const taken = new Set(["quynh-anh-gia-khanh", "quynh-anh-gia-khanh-29112026", "quynh-anh-gia-khanh-29112026-143005"]);
  const now = new Date(2026, 10, 29, 14, 30, 5);
  assert.equal(await uniqueSlugFromFormFields(couple, async slug => taken.has(slug), now), "quynh-anh-gia-khanh-29112026-143005-1");
});

test("uniqueSlugFromFormFields fits the 180 character public slug limit", async () => {
  const long = { ...couple, brideFullName: "A".repeat(120), groomFullName: "B".repeat(120), brideShortName: "", groomShortName: "" };
  let checked = 0;
  const slug = await uniqueSlugFromFormFields(long, async () => checked++ < 2, new Date(2026, 10, 29, 14, 30, 5));
  assert.equal(slug.length, 180);
  assert.match(slug, /-29112026-143005$/);
});
