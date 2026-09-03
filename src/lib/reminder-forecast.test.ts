import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  FORECAST_RUN_COUNT,
  REMINDER_CRON_HOURS,
  forecastReminders,
  upcomingCronRuns,
  type ForecastCandidate,
} from "./reminder-forecast";
import { shouldSendExpiredReminder, shouldSendReminder } from "./trial-reminder";
import { FREE_TRIAL_MS } from "./trial";

const HOUR_MS = 60 * 60 * 1000;

/** Giờ Việt Nam của một instant, đọc qua Intl để không phụ thuộc TZ máy chạy test. */
function vietnamHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

function candidate(overrides: Partial<ForecastCandidate> = {}): ForecastCandidate {
  return {
    invitationId: "inv-1",
    paid: false,
    complimentary: false,
    publishedAt: new Date("2026-08-26T03:15:00.000Z"),
    reminderSentAt: null,
    expiredReminderSentAt: null,
    email: "an@example.com",
    ...overrides,
  };
}

// ─── Lịch cron ──────────────────────────────────────────────────────────────

test("hằng số giờ cron khớp crontab trong scripts/deploy-fast.sh", () => {
  const script = readFileSync(path.join(process.cwd(), "scripts", "deploy-fast.sh"), "utf8");
  const match = /^reminder_job="(\S+)\s+(\S+)\s+\S+\s+\S+\s+\S+\s/m.exec(script);
  assert.ok(match, "không tìm thấy dòng reminder_job trong deploy-fast.sh");

  const timer = readFileSync(path.join(process.cwd(), "scripts/vps/thiepmungonline-trial-reminders.timer"), "utf8");
  const calendar = /^OnCalendar=\*-\*-\* ([\d,]+):00:00 Asia\/Ho_Chi_Minh$/m.exec(timer);
  assert.ok(calendar, "timer phải chạy phút 0 theo giờ Việt Nam");
  assert.deepEqual(calendar[1].split(",").map(Number), [...REMINDER_CRON_HOURS]);
  assert.match(timer, /^Persistent=false$/m);

  const [, minuteField, hourField] = match;
  assert.equal(minuteField, "0", "cron phải chạy đúng phút 0, nếu không dự báo lệch");
  assert.deepEqual(
    hourField.split(",").map(Number),
    [...REMINDER_CRON_HOURS],
    `crontab chạy giờ ${hourField} nhưng REMINDER_CRON_HOURS là ${REMINDER_CRON_HOURS.join(",")}`,
  );
});

test("upcomingCronRuns trả đúng số lượt, tăng dần và đều ở tương lai", () => {
  const now = new Date("2026-08-28T04:00:00.000Z"); // 11:00 +07
  const runs = upcomingCronRuns(now);

  assert.equal(runs.length, FORECAST_RUN_COUNT);
  for (const run of runs) assert.ok(run.getTime() > now.getTime(), `${run.toISOString()} phải ở tương lai`);
  for (let i = 1; i < runs.length; i += 1) {
    assert.ok(runs[i].getTime() > runs[i - 1].getTime(), "phải tăng dần");
  }
  assert.deepEqual(runs.map(vietnamHour), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 9, 10, 11]);
});

test("upcomingCronRuns bỏ qua các lượt đã trôi qua trong ngày", () => {
  const now = new Date("2026-08-28T14:30:00.000Z"); // 21:30 +07, đã qua lượt cuối
  assert.deepEqual(upcomingCronRuns(now, 2).map(vietnamHour), [9, 10]);
});

test("upcomingCronRuns cho ra cùng giờ Việt Nam bất kể TZ của process", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const original = process.env.TZ;
  const seen: number[][] = [];
  try {
    for (const tz of ["UTC", "America/New_York", "Asia/Ho_Chi_Minh"]) {
      process.env.TZ = tz;
      seen.push(upcomingCronRuns(now, 3).map(vietnamHour));
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
  assert.deepEqual(seen[1], seen[0]);
  assert.deepEqual(seen[2], seen[0]);
});

// ─── Dự báo ─────────────────────────────────────────────────────────────────

test("dự báo mốc còn 24h ở lượt cron đầu tiên nằm trong cửa sổ", () => {
  const now = new Date("2026-08-28T04:00:00.000Z"); // 11:00 +07
  const runs = upcomingCronRuns(now);
  // Hết hạn 29/08 10:15 +07 -> lượt 12:00 hôm nay còn cách 22.25h, đã vào cửa sổ.
  const forecast = forecastReminders([candidate()], runs.filter((run) => run < new Date("2026-08-29T03:15:00.000Z")));

  assert.equal(forecast.length, 1);
  assert.equal(forecast[0].kind, "trial-ending");
  assert.equal(vietnamHour(forecast[0].scheduledAt), 12);
  assert.equal(
    forecast[0].expiresAt.getTime(),
    new Date("2026-08-26T03:15:00.000Z").getTime() + FREE_TRIAL_MS,
  );
});

test("dự báo khớp đúng quyết định thật của cron tại thời điểm đó", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const runs = upcomingCronRuns(now, 8);
  const input = candidate();

  for (const entry of forecastReminders([input], runs)) {
    const atRun = shouldSendReminder(input, entry.scheduledAt)
      ? "trial-ending"
      : shouldSendExpiredReminder(input, entry.scheduledAt)
        ? "expired"
        : null;
    // Mốc đầu tiên phải trùng; mốc sau phụ thuộc marker do lượt trước đặt.
    if (entry.kind === "trial-ending") assert.equal(atRun, "trial-ending");
  }
});

test("một thiệp nhận cả hai mốc trong tầm dự báo, không trùng mốc", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const forecast = forecastReminders([candidate()], upcomingCronRuns(now, 26));
  const kinds = forecast.map((entry) => entry.kind);

  assert.deepEqual(kinds, ["trial-ending", "expired"], `nhận được ${kinds.join(", ")}`);
  assert.ok(
    forecast[1].scheduledAt.getTime() > forecast[0].scheduledAt.getTime(),
    "mốc đã hết hạn phải sau mốc còn 24h",
  );
});

test("không dự báo thiệp đã gửi mốc đó rồi", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const runs = upcomingCronRuns(now);
  const sent = candidate({ reminderSentAt: new Date("2026-08-28T03:15:00.000Z") });
  assert.deepEqual(forecastReminders([sent], runs).map((entry) => entry.kind), ["expired"]);
});

test("không dự báo thiệp đã thanh toán, được tặng, chưa publish hoặc thiếu email", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const runs = upcomingCronRuns(now);
  for (const overrides of [
    { paid: true },
    { complimentary: true },
    { publishedAt: null },
    { email: null },
    { email: "" },
  ] satisfies Partial<ForecastCandidate>[]) {
    assert.deepEqual(
      forecastReminders([candidate(overrides)], runs),
      [],
      `phải bỏ qua khi ${JSON.stringify(overrides)}`,
    );
  }
});

test("thiệp còn quá xa hạn thì chưa xuất hiện trong dự báo", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const runs = upcomingCronRuns(now);
  // Vừa publish -> hết hạn sau 3 ngày, ngoài tầm 5 lượt cron.
  const fresh = candidate({ publishedAt: new Date(now.getTime() - HOUR_MS) });
  assert.deepEqual(forecastReminders([fresh], runs), []);
});

test("dự báo giữ thứ tự theo lượt cron và không sửa dữ liệu đầu vào", () => {
  const now = new Date("2026-08-28T04:00:00.000Z");
  const runs = upcomingCronRuns(now, 26);
  const input = candidate();
  const before = { ...input };

  const forecast = forecastReminders([input], runs);
  for (let i = 1; i < forecast.length; i += 1) {
    assert.ok(forecast[i].scheduledAt.getTime() >= forecast[i - 1].scheduledAt.getTime());
  }
  assert.deepEqual(input, before, "không được mutate candidate của caller");
});
