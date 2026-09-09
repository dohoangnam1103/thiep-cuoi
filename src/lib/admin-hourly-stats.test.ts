import assert from "node:assert/strict";
import test from "node:test";

import { buildHourlyGrowth } from "./admin-hourly-stats";

const NOW = new Date("2026-08-24T12:30:00.000Z"); // 19:30 in Vietnam

test("buckets today by Vietnam hour and hides future hours", () => {
  const result = buildHourlyGrowth(
    [
      { at: new Date("2026-08-24T12:05:00.000Z") }, // 19h VN
      { at: new Date("2026-08-25T13:00:00.000Z") }, // future, ignored
      { at: new Date("2026-08-22T18:05:00.000Z") }, // prior Vietnam day
    ],
    [{ at: new Date("2026-08-24T11:10:00.000Z") }], // 18h VN
    1,
    NOW,
  );

  assert.equal(result.summary.todayUsers, 1);
  assert.equal(result.summary.todayInvitations, 1);
  assert.equal(result.summary.averageUsers, 1);
  assert.equal(result.summary.averageInvitations, 0);
  assert.equal(result.points[19]?.users, 1);
  assert.equal(result.points[20]?.users, null);
  assert.equal(result.points[1]?.averageUsers, 1);
});

test("includes quiet baseline days in the average", () => {
  const result = buildHourlyGrowth(
    [{ at: new Date("2026-08-22T18:05:00.000Z") }],
    [],
    2,
    NOW,
  );

  assert.equal(result.summary.averageUsers, 0.5);
  assert.equal(result.summary.userDeltaPct, -100);
  assert.equal(result.points[1]?.averageUsers, 0.5);
});

test("compares only the elapsed hours of the current day", () => {
  const result = buildHourlyGrowth(
    [
      { at: new Date("2026-08-23T18:05:00.000Z") }, // 01h VN, included
      { at: new Date("2026-08-23T18:05:00.000Z") },
      { at: new Date("2026-08-23T18:45:00.000Z") }, // 01:45 VN, after cutoff
      { at: new Date("2026-08-23T19:05:00.000Z") }, // 02h VN, future at 01:30
    ],
    [],
    1,
    new Date("2026-08-24T18:30:00.000Z"), // 01:30 VN: 02h is future
  );

  assert.equal(result.summary.averageUsers, 2);
});
