import assert from "node:assert/strict";
import test from "node:test";

import {
  FREE_TRIAL_DAYS,
  FREE_TRIAL_MS,
  getTrialRemaining,
  trialExpiresAt,
} from "./trial";

test("trialExpiresAt starts the trial from the first publication time", () => {
  const publishedAt = new Date("2026-07-23T00:00:00.000Z");

  assert.equal(FREE_TRIAL_DAYS, 3);
  assert.equal(
    trialExpiresAt(publishedAt).toISOString(),
    "2026-07-26T00:00:00.000Z",
  );
  assert.equal(trialExpiresAt(publishedAt).getTime() - publishedAt.getTime(), FREE_TRIAL_MS);
});

test("getTrialRemaining rounds up partial minutes for a readable countdown", () => {
  const now = Date.parse("2026-07-23T00:00:00.000Z");
  const expiresAt = now + (26 * 60 + 3) * 60 * 1000 + 1;

  assert.deepEqual(getTrialRemaining(expiresAt, now), {
    expired: false,
    days: 1,
    hours: 2,
    minutes: 4,
  });
});

test("getTrialRemaining marks the trial expired at its deadline", () => {
  const deadline = Date.parse("2026-07-26T00:00:00.000Z");

  assert.deepEqual(getTrialRemaining(deadline, deadline), {
    expired: true,
    days: 0,
    hours: 0,
    minutes: 0,
  });
});
