import assert from "node:assert/strict";
import test from "node:test";

import {
  createVietnamDateFormatter,
  formatVietnamDate,
  formatVietnamDateTime,
  formatVietnamDateTimeShort,
  VIETNAM_TIME_ZONE,
  vietnamStartOfDay,
} from "./datetime";

/**
 * 18:57 UTC on 23 Aug is already 01:57 on 24 Aug in Vietnam. This is the exact
 * instant that surfaced the bug: the admin payments table showed `18:57 23/8/26`
 * for a payment made at 01:57 on the 24th.
 */
const LATE_NIGHT_IN_VIETNAM = new Date("2026-08-23T18:57:00.000Z");

test("timestamps format in Vietnam time, not the runtime timezone", () => {
  // vi-VN renders time before date and does not zero-pad the month, which is
  // why the admin table reads `01:57 24/8/26`.
  const short = formatVietnamDateTimeShort(LATE_NIGHT_IN_VIETNAM);
  assert.ok(short.includes("24/8/26"), `mong đợi ngày 24/8/26, nhận được: ${short}`);
  assert.ok(short.includes("01:57"), `mong đợi giờ 01:57, nhận được: ${short}`);
  assert.ok(!short.includes("23/8/26"), `vẫn còn ngày UTC: ${short}`);
  assert.ok(!short.includes("18:57"), `vẫn còn giờ UTC: ${short}`);
});

test("medium formatters keep the same instant on the Vietnamese calendar day", () => {
  assert.ok(formatVietnamDateTime(LATE_NIGHT_IN_VIETNAM).includes("24"));
  assert.ok(formatVietnamDateTime(LATE_NIGHT_IN_VIETNAM).includes("01:57"));
  assert.ok(formatVietnamDate(LATE_NIGHT_IN_VIETNAM).includes("24"));
});

/**
 * ICU canonicalises `Asia/Ho_Chi_Minh` to the older `Asia/Saigon` alias in some
 * Node builds. Both name the same zone, so accept either rather than pinning the
 * test to one ICU version.
 */
const VIETNAM_ZONE_ALIASES = new Set([VIETNAM_TIME_ZONE, "Asia/Saigon"]);

test("the factory pins the timezone and honours the requested locale", () => {
  const formatter = createVietnamDateFormatter({ dateStyle: "short" }, "en-GB");
  assert.ok(VIETNAM_ZONE_ALIASES.has(formatter.resolvedOptions().timeZone));
  assert.equal(formatter.resolvedOptions().locale, "en-GB");
  assert.ok(formatter.format(LATE_NIGHT_IN_VIETNAM).includes("24"));
});

test("a caller-supplied timezone cannot override Vietnam", () => {
  const formatter = createVietnamDateFormatter({
    dateStyle: "short",
    timeZone: "America/New_York",
  });
  assert.ok(VIETNAM_ZONE_ALIASES.has(formatter.resolvedOptions().timeZone));
  // New York would still be on 23 Aug at this instant.
  assert.ok(formatter.format(LATE_NIGHT_IN_VIETNAM).includes("24"));
});

test("date-input values anchor to Vietnam midnight, seven hours before UTC midnight", () => {
  assert.equal(
    vietnamStartOfDay("2026-08-24")?.toISOString(),
    "2026-08-23T17:00:00.000Z",
  );
});

test("a range built from Vietnam midnight brackets exactly one displayed day", () => {
  const start = vietnamStartOfDay("2026-08-24");
  assert.ok(start);
  const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  // The payment sits inside 24 Aug as shown in the table, so a filter on that
  // day has to include it. Anchoring at UTC midnight would have excluded it.
  assert.ok(LATE_NIGHT_IN_VIETNAM >= start);
  assert.ok(LATE_NIGHT_IN_VIETNAM < nextDay);

  const utcMidnight = new Date("2026-08-24T00:00:00.000Z");
  assert.ok(LATE_NIGHT_IN_VIETNAM < utcMidnight);
});

test("unparseable date inputs return null rather than an Invalid Date", () => {
  assert.equal(vietnamStartOfDay(undefined), null);
  assert.equal(vietnamStartOfDay(""), null);
  assert.equal(vietnamStartOfDay("24/08/2026"), null);
  assert.equal(vietnamStartOfDay("2026-8-4"), null);
  assert.equal(vietnamStartOfDay("not-a-date"), null);
});
