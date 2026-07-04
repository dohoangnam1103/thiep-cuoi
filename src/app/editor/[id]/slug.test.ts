import assert from "node:assert/strict";
import { test } from "node:test";

import { slugFromFormFields, slugifyInput } from "./slug";

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
