import assert from "node:assert/strict";
import test from "node:test";

import { resolveCoupleNames, resolveOgDate, resolveOgFont } from "@/lib/og-image";

test("resolveCoupleNames dùng shortName, thứ tự theo brideFirst", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "Nam",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: false,
    }),
    "Nam & Linh",
  );
});

test("resolveCoupleNames fallback fullName khi thiếu shortName", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "",
      groomShortName: "",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: true,
    }),
    "Nguyễn Thùy Linh & Trần Hoài Nam",
  );
});

test("resolveCoupleNames bỏ vế trống, không để '& '", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "",
      brideFullName: "",
      groomFullName: "",
      brideFirst: true,
    }),
    "Linh",
  );
});

test("resolveOgDate trả nguyên chuỗi user nhập, trim", () => {
  assert.equal(resolveOgDate("  20.12.2026  "), "20.12.2026");
});

test("resolveOgDate trả chuỗi rỗng khi trống", () => {
  assert.equal(resolveOgDate(""), "");
  assert.equal(resolveOgDate("   "), "");
});

test("resolveOgFont map template có font riêng (song-hy-green → Fz Aghita)", () => {
  const f = resolveOgFont("song-hy-green");
  assert.equal(f.family, "Fz Aghita");
  assert.equal(f.file, "FzAghita.ttf");
});

test("resolveOgFont fallback Lora khi template không tồn tại", () => {
  const f = resolveOgFont("khong-co-template-nay");
  assert.equal(f.family, "Lora");
  assert.equal(f.file, "Lora-Regular.ttf");
});
