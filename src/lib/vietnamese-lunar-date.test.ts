import assert from "node:assert/strict";
import test from "node:test";

import { formatVietnameseLunarDate, toVietnameseLunarDate } from "./vietnamese-lunar-date";

test("converts known Vietnamese Tet dates", () => {
  assert.deepEqual(toVietnameseLunarDate("2024-02-10"), { day: 1, month: 1, year: 2024, leap: false });
  assert.deepEqual(toVietnameseLunarDate("2025-01-29"), { day: 1, month: 1, year: 2025, leap: false });
  assert.deepEqual(toVietnameseLunarDate("2026-02-17"), { day: 1, month: 1, year: 2026, leap: false });
  assert.equal(formatVietnameseLunarDate("2026-02-17"), "(Tức ngày 01/01 năm Bính Ngọ âm lịch)");
});

test("rejects invalid ISO dates", () => {
  assert.equal(toVietnameseLunarDate("2026-02-30"), null);
  assert.equal(formatVietnameseLunarDate(""), "");
});
