import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDailySeries,
  dailyWindowStart,
  DEFAULT_DAILY_RANGE,
  parseDailyRange,
  sumDailyValues,
} from "./admin-daily-stats";

/**
 * 18:57 UTC on 23 Aug is already 01:57 on 24 Aug in Vietnam — the same instant
 * that surfaced the timezone bug in the admin payments table. Every assertion
 * below is about which calendar day this lands on.
 */
const LATE_NIGHT_IN_VIETNAM = new Date("2026-08-23T18:57:00.000Z");

test("the window covers whole Vietnamese days and ends on today", () => {
  const series = buildDailySeries([], 30, LATE_NIGHT_IN_VIETNAM);

  assert.equal(series.length, 30);
  assert.equal(series[0]?.day, "2026-07-26");
  assert.equal(series.at(-1)?.day, "2026-08-24");
  assert.equal(
    dailyWindowStart(30, LATE_NIGHT_IN_VIETNAM).toISOString(),
    "2026-07-25T17:00:00.000Z",
  );
});

test("days with no rows stay in the series as zeroes", () => {
  const series = buildDailySeries([{ at: LATE_NIGHT_IN_VIETNAM }], 7, LATE_NIGHT_IN_VIETNAM);

  assert.equal(series.length, 7);
  assert.deepEqual(
    series.map((point) => point.value),
    [0, 0, 0, 0, 0, 0, 1],
  );
});

test("an event is filed under its Vietnamese day, not its UTC day", () => {
  const series = buildDailySeries([{ at: LATE_NIGHT_IN_VIETNAM }], 7, LATE_NIGHT_IN_VIETNAM);
  const filled = series.filter((point) => point.value > 0);

  assert.equal(filled.length, 1);
  assert.equal(filled[0]?.day, "2026-08-24", "UTC bucketing would say 2026-08-23");
  assert.equal(filled[0]?.label, "24/08");
  assert.equal(filled[0]?.fullLabel, "24/08/2026");
});

test("the first bucket keeps the whole Vietnamese day, including its UTC-previous hours", () => {
  // 17:30 UTC on 25 Jul is 00:30 on 26 Jul in Vietnam: the very first minutes of
  // the window's opening day. Anchoring the window at UTC midnight would drop it.
  const firstMinutesOfWindow = new Date("2026-07-25T17:30:00.000Z");
  const series = buildDailySeries([{ at: firstMinutesOfWindow }], 30, LATE_NIGHT_IN_VIETNAM);

  assert.equal(series[0]?.day, "2026-07-26");
  assert.equal(series[0]?.value, 1);
});

test("rows outside the window are ignored rather than folded into an edge day", () => {
  const beforeWindow = new Date("2026-07-01T00:00:00.000Z");
  const afterToday = new Date("2026-09-01T00:00:00.000Z");
  const series = buildDailySeries(
    [{ at: beforeWindow }, { at: afterToday }, { at: LATE_NIGHT_IN_VIETNAM }],
    30,
    LATE_NIGHT_IN_VIETNAM,
  );

  assert.equal(sumDailyValues(series), 1);
});

test("a null instant is skipped, so a pending payment never lands on today", () => {
  const series = buildDailySeries(
    [{ at: null, amount: 150_000 }, { at: LATE_NIGHT_IN_VIETNAM, amount: 99_000 }],
    7,
    LATE_NIGHT_IN_VIETNAM,
  );

  assert.equal(sumDailyValues(series), 99_000);
});

test("amounts sum per day while rows without an amount are counted", () => {
  const sameDay = new Date("2026-08-23T20:00:00.000Z");

  const revenue = buildDailySeries(
    [
      { at: LATE_NIGHT_IN_VIETNAM, amount: 150_000 },
      { at: sameDay, amount: 99_000 },
    ],
    7,
    LATE_NIGHT_IN_VIETNAM,
  );
  assert.equal(revenue.at(-1)?.value, 249_000);

  const counts = buildDailySeries(
    [{ at: LATE_NIGHT_IN_VIETNAM }, { at: sameDay }],
    7,
    LATE_NIGHT_IN_VIETNAM,
  );
  assert.equal(counts.at(-1)?.value, 2);
});

test("a zero-amount voucher payment adds nothing to revenue", () => {
  const series = buildDailySeries([{ at: LATE_NIGHT_IN_VIETNAM, amount: 0 }], 7, LATE_NIGHT_IN_VIETNAM);
  assert.equal(sumDailyValues(series), 0);
});

test("reminder emails count by send date across Vietnam midnight, skipping unsent rows", () => {
  const deliveries = [
    { sentAt: new Date("2026-08-23T16:59:59.000Z") },
    { sentAt: new Date("2026-08-23T17:00:00.000Z") },
    { sentAt: LATE_NIGHT_IN_VIETNAM },
    { sentAt: null },
  ];
  for (const range of [7, 30, 90]) {
    const series = buildDailySeries(
      deliveries.map((delivery) => ({ at: delivery.sentAt })),
      range,
      LATE_NIGHT_IN_VIETNAM,
    );
    assert.equal(series.length, range);
    assert.equal(series.at(-2)?.value, 1);
    assert.equal(series.at(-1)?.value, 2);
    assert.equal(sumDailyValues(series), 3);
  }
});

test("only the offered ranges survive the URL", () => {
  assert.equal(parseDailyRange("7"), 7);
  assert.equal(parseDailyRange("90"), 90);
  assert.equal(parseDailyRange(undefined), DEFAULT_DAILY_RANGE);
  assert.equal(parseDailyRange(""), DEFAULT_DAILY_RANGE);
  assert.equal(parseDailyRange("365"), DEFAULT_DAILY_RANGE);
  assert.equal(parseDailyRange("-7"), DEFAULT_DAILY_RANGE);
  assert.equal(parseDailyRange("drop table"), DEFAULT_DAILY_RANGE);
});
