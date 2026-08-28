import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultDayFilter,
  isAllowedCustomerEmail,
  parseAdminTemplateId,
  parseUserSearch,
} from "./admin-support-input";

test("user search is trimmed, lower-cased and bounded", () => {
  assert.equal(parseUserSearch("  USER@Example.COM  "), "user@example.com");
  assert.equal(parseUserSearch("x".repeat(121)), "x".repeat(120));
  assert.equal(parseUserSearch(undefined), "");
});

test("system customer is excluded without excluding anonymous users", () => {
  assert.equal(isAllowedCustomerEmail("system@demo.local"), false);
  assert.equal(isAllowedCustomerEmail("user@example.com"), true);
  assert.equal(isAllowedCustomerEmail(null), true);
});

test("admin template input uses the completed-template server allowlist", () => {
  assert.equal(parseAdminTemplateId("song-hy-red"), "song-hy-red");
  assert.equal(parseAdminTemplateId("not-a-real-template"), null);
  assert.equal(parseAdminTemplateId(null), null);
});

test("bộ lọc ngày mặc định về hôm nay khi URL chưa nói gì về ngày", () => {
  // 2026-08-28T20:00Z là 03:00 sáng 29/08 ở Việt Nam — mặc định phải là ngày
  // Việt Nam, không phải ngày UTC.
  const now = new Date("2026-08-28T20:00:00.000Z");
  assert.equal(defaultDayFilter(undefined, undefined, now), "2026-08-29");
});

test("bộ lọc ngày mặc định nhường chỗ cho ô ngày admin đã xoá", () => {
  const now = new Date("2026-08-28T03:00:00.000Z");
  // Form GET gửi `from=`/`to=` khi ô trống: đó là "xem tất cả thời gian", và
  // mặc định hôm nay không được đè lên nó, nếu không sẽ không có đường ra.
  assert.equal(defaultDayFilter("", "", now), null);
  assert.equal(defaultDayFilter("", undefined, now), null);
  assert.equal(defaultDayFilter(undefined, "", now), null);
});

test("bộ lọc ngày mặc định nhường chỗ cho ngày admin tự chọn", () => {
  const now = new Date("2026-08-28T03:00:00.000Z");
  assert.equal(defaultDayFilter("2026-01-01", undefined, now), null);
  assert.equal(defaultDayFilter(undefined, "2026-01-31", now), null);
  assert.equal(defaultDayFilter("2026-01-01", "2026-01-31", now), null);
});
