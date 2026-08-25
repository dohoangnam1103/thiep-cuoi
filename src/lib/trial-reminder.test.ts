import assert from "node:assert/strict";
import test from "node:test";

import { FREE_TRIAL_MS } from "./trial";
import {
  buildCardName,
  EXPIRED_REMINDER_GRACE_MS,
  REMINDER_WINDOW_MS,
  shouldSendExpiredReminder,
  shouldSendReminder,
  type ReminderCandidate,
} from "./trial-reminder";

const now = new Date("2026-07-24T09:00:00.000Z");

function candidate(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  const publishedAt = new Date(now.getTime() + 12 * 60 * 60 * 1000 - FREE_TRIAL_MS);
  return {
    paid: false,
    complimentary: false,
    publishedAt,
    reminderSentAt: null,
    expiredReminderSentAt: null,
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

test("không gửi khi thiệp được tặng miễn phí", () => {
  assert.equal(shouldSendReminder(candidate({ complimentary: true }), now), false);
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

// ─── Mốc 2: nhắc bù sau khi thiệp đã hết hạn và bị tạm ẩn ──────────────────

/** Thiệp hết hạn cách đây `days` ngày. */
function expiredCandidate(days: number, overrides: Partial<ReminderCandidate> = {}) {
  return candidate({
    publishedAt: new Date(now.getTime() - FREE_TRIAL_MS - days * 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

test("nhắc bù gửi cho thiệp vừa hết hạn trong cửa sổ grace", () => {
  assert.equal(shouldSendExpiredReminder(expiredCandidate(0.1), now), true);
  assert.equal(shouldSendExpiredReminder(expiredCandidate(1), now), true);
  assert.equal(shouldSendExpiredReminder(expiredCandidate(2.9), now), true);
});

test("nhắc bù KHÔNG gửi cho thiệp hết hạn quá lâu", () => {
  // Đây là rào chặn quan trọng nhất: `expiredReminderSentAt` khởi đầu NULL cho
  // mọi thiệp, nên không có biên thì lượt cron đầu sau khi deploy sẽ bắn mail cho
  // toàn bộ thiệp từng hết hạn trong lịch sử database.
  assert.equal(shouldSendExpiredReminder(expiredCandidate(3.1), now), false);
  assert.equal(shouldSendExpiredReminder(expiredCandidate(30), now), false);
  assert.equal(shouldSendExpiredReminder(expiredCandidate(365), now), false);
});

test("cửa sổ grace của nhắc bù là 3 ngày", () => {
  assert.equal(EXPIRED_REMINDER_GRACE_MS, 3 * 24 * 60 * 60 * 1000);
});

test("nhắc bù không gửi cho thiệp CHƯA hết hạn", () => {
  // Thiệp còn 12h thuộc mốc 1, không phải mốc 2. Hai mốc phải loại trừ nhau,
  // nếu không khách sẽ nhận hai email cùng lúc với nội dung mâu thuẫn.
  assert.equal(shouldSendExpiredReminder(candidate(), now), false);
  assert.equal(shouldSendReminder(candidate(), now), true);
});

test("hai mốc loại trừ nhau ở mọi thời điểm quanh mốc hết hạn", () => {
  for (const days of [-2, -1, -0.5, 0.5, 1, 2, 5, 40]) {
    const c = candidate({
      publishedAt: new Date(now.getTime() - FREE_TRIAL_MS - days * 24 * 60 * 60 * 1000),
    });
    const both = shouldSendReminder(c, now) && shouldSendExpiredReminder(c, now);
    assert.equal(both, false, `cả hai mốc cùng đúng ở days=${days}`);
  }
});

test("nhắc bù không gửi lại khi đã gửi", () => {
  assert.equal(
    shouldSendExpiredReminder(expiredCandidate(1, { expiredReminderSentAt: new Date() }), now),
    false,
  );
});

test("thiệp lọt mốc 24h vẫn nhận được nhắc bù", () => {
  // Nhóm cần nhắc nhất: chưa từng được cảnh báo gì mà thiệp đã ẩn. Nên
  // shouldSendExpiredReminder cố ý KHÔNG xét reminderSentAt.
  assert.equal(
    shouldSendExpiredReminder(expiredCandidate(1, { reminderSentAt: null }), now),
    true,
  );
  // Và thiệp đã nhận mốc 1 rồi thì vẫn nhận mốc 2 — hai lần gửi khác nội dung.
  assert.equal(
    shouldSendExpiredReminder(expiredCandidate(1, { reminderSentAt: new Date() }), now),
    true,
  );
});

test("nhắc bù tôn trọng các điều kiện chung", () => {
  assert.equal(shouldSendExpiredReminder(expiredCandidate(1, { paid: true }), now), false);
  assert.equal(
    shouldSendExpiredReminder(expiredCandidate(1, { complimentary: true }), now),
    false,
  );
  assert.equal(shouldSendExpiredReminder(expiredCandidate(1, { email: null }), now), false);
  assert.equal(
    shouldSendExpiredReminder({ ...expiredCandidate(1), publishedAt: null }, now),
    false,
  );
});
