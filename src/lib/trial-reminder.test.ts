import assert from "node:assert/strict";
import test from "node:test";

import { FREE_TRIAL_MS } from "./trial";
import { buildCardName, shouldSendReminder, REMINDER_WINDOW_MS, type ReminderCandidate } from "./trial-reminder";

const now = new Date("2026-07-24T09:00:00.000Z");

function candidate(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  const publishedAt = new Date(now.getTime() + 12 * 60 * 60 * 1000 - FREE_TRIAL_MS);
  return {
    paid: false,
    publishedAt,
    reminderSentAt: null,
    email: "user@example.com",
    ...overrides,
  };
}

test("gửi khi còn trong 24h cuối, chưa trả tiền, chưa gửi, có email", () => {
  assert.equal(shouldSendReminder(candidate(), now), true);
});

test("REMINDER_WINDOW_MS là 24 giờ", () => {
  assert.equal(REMINDER_WINDOW_MS, 24 * 60 * 60 * 1000);
});

test("không gửi khi đã thanh toán", () => {
  assert.equal(shouldSendReminder(candidate({ paid: true }), now), false);
});

test("không gửi khi chưa publish", () => {
  assert.equal(shouldSendReminder(candidate({ publishedAt: null }), now), false);
});

test("không gửi khi đã gửi rồi", () => {
  assert.equal(shouldSendReminder(candidate({ reminderSentAt: new Date() }), now), false);
});

test("không gửi khi không có email", () => {
  assert.equal(shouldSendReminder(candidate({ email: null }), now), false);
  assert.equal(shouldSendReminder(candidate({ email: "" }), now), false);
});

test("không gửi khi đã hết hạn (quá cửa sổ)", () => {
  const publishedAt = new Date(now.getTime() - FREE_TRIAL_MS - 60_000);
  assert.equal(shouldSendReminder(candidate({ publishedAt }), now), false);
});

test("không gửi khi còn quá xa (hơn 24h nữa mới hết hạn)", () => {
  const publishedAt = new Date(now.getTime() + 25 * 60 * 60 * 1000 - FREE_TRIAL_MS);
  assert.equal(shouldSendReminder(candidate({ publishedAt }), now), false);
});

test("buildCardName ghép hai tên ngắn", () => {
  assert.equal(
    buildCardName({ brideShortName: "Jade", groomShortName: "Thạch" }),
    "Jade & Thạch",
  );
});

test("buildCardName chỉ có một tên", () => {
  assert.equal(buildCardName({ brideShortName: "Jade", groomShortName: "" }), "Jade");
});

test("buildCardName fallback khi thiếu cả hai", () => {
  assert.equal(buildCardName({ brideShortName: "", groomShortName: "" }), "Thiệp cưới của bạn");
  assert.equal(buildCardName(null), "Thiệp cưới của bạn");
});
