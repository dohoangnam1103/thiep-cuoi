import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * Trang quản trị là dynamic (đọc cookie qua `verifyAdmin`), nên `next build`
 * không render nó. Một key i18n thiếu vì thế không lộ ra lúc build mà chỉ nổ khi
 * admin mở trang trên production. Test này đọc source và kiểm mọi key literal
 * thật sự tồn tại trong catalog.
 */
const pageSource = readFileSync(
  path.join(process.cwd(), "src/app/admin/email-logs/page.tsx"),
  "utf8",
);

const adminSupport = (
  JSON.parse(readFileSync(path.join(process.cwd(), "messages", "vi.json"), "utf8")) as {
    adminSupport: Record<string, unknown>;
  }
).adminSupport;

function resolveKey(key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      adminSupport,
    );
}

test("mọi key i18n literal của trang lịch sử email đều có trong catalog", () => {
  const keys = [...pageSource.matchAll(/\bt\(\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(keys.length > 0, "không tìm thấy lệnh gọi t(\"...\") nào, regex có thể đã lỗi thời");

  const missing = keys.filter((key) => typeof resolveKey(key) !== "string");
  assert.deepEqual(missing, [], `adminSupport thiếu key: ${missing.join(", ")}`);
});

test("các nhánh emailRunStatus mà runStatusKey trả về đều có bản dịch", () => {
  for (const status of ["running", "completed", "completed-with-errors", "failed"]) {
    assert.equal(
      typeof resolveKey(`emailRunStatus.${status}`),
      "string",
      `thiếu emailRunStatus.${status}`,
    );
  }
});

test("bảng email sắp gửi dùng dự báo dùng chung, không tự viết lại điều kiện nhắc", () => {
  // Nếu ai đó inline lại điều kiện ở page thì dự báo sẽ lệch khỏi hành vi cron.
  assert.match(pageSource, /from "@\/lib\/reminder-forecast"/);
  assert.match(pageSource, /forecastReminders\(/);
  assert.doesNotMatch(pageSource, /FREE_TRIAL_MS|REMINDER_WINDOW_MS|EXPIRED_REMINDER_GRACE_MS/);
});
