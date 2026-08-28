import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";
import { getDb, prismaNow } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, seededAdminId } from "./helpers/fixtures";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Thiệp hết hạn dùng thử sau ~20 giờ nữa.
 *
 * Chọn 20h để mọi lượt cron kế tiếp — kể cả lượt xa nhất là 09:00 sau khoảng
 * nghỉ đêm 12 tiếng — vẫn nằm trong cửa sổ "còn tối đa 24h" và chưa quá hạn, nên
 * kỳ vọng của test không phụ thuộc vào việc chạy test lúc mấy giờ.
 */
function publishedForTrialEndingSoon(): Date {
  return new Date(Date.now() - 52 * HOUR_MS);
}

/** User không có email — tài khoản kiểu này không thể nhận email nhắc. */
function createUserWithoutEmail(): { id: string } {
  const db = getDb();
  const userId = `u${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  db.prepare(`INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?, NULL, ?, ?)`).run(
    userId,
    "x",
    prismaNow(),
  );
  return { id: userId };
}

function setShortNames(invitationId: string, bride: string, groom: string): void {
  getDb()
    .prepare(
      `UPDATE InvitationContent SET brideShortName = ?, groomShortName = ? WHERE invitationId = ?`,
    )
    .run(bride, groom, invitationId);
}

test.describe("/admin/email-logs — bảng email sắp gửi", () => {
  test("liệt kê thiệp sắp tới hạn và bỏ qua thiệp không có email", async ({ page, context }) => {
    const withEmail = createUser();
    const withoutEmail = createUserWithoutEmail();

    const duePublished = publishedForTrialEndingSoon();
    const dueInvitation = createInvitation(withEmail.id, {
      status: "published",
      publishedAt: duePublished,
      templateId: "song-hy-red",
    });
    setShortNames(dueInvitation.id, "Lan", "Tuấn");

    const unreachableInvitation = createInvitation(withoutEmail.id, {
      status: "published",
      publishedAt: duePublished,
      templateId: "minimalism-red",
    });

    // Thiệp mới publish: còn 3 ngày mới hết hạn nên chưa được dự báo.
    const freshInvitation = createInvitation(withEmail.id, {
      status: "published",
      publishedAt: new Date(Date.now() - HOUR_MS),
      templateId: "royal-red",
    });

    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/email-logs");

      await expect(page.getByRole("heading", { name: /Email sắp gửi/ })).toBeVisible();

      // Thiệp sắp hết hạn: có mặt, đúng email người nhận và đúng loại email.
      //
      // Lọc thêm theo nhãn loại email: cùng một thiệp có thể xuất hiện hai dòng
      // trong tầm dự báo — mốc "còn 24h" rồi mốc "đã hết hạn" ở lượt sau — nên
      // chỉ khoá theo link thiệp thì số dòng phụ thuộc giờ chạy test.
      const dueRow = page
        .locator("tr")
        .filter({ has: page.locator(`a[href="/admin/invitations/${dueInvitation.id}/edit"]`) })
        .filter({ hasText: "Nhắc còn 24 giờ" });
      await expect(dueRow).toHaveCount(1);
      await expect(dueRow).toContainText(withEmail.email);
      await expect(dueRow).toContainText("Lan & Tuấn");

      // Không có email thì cron không gửi được, dự báo cũng không được hứa.
      await expect(
        page.locator(`a[href="/admin/invitations/${unreachableInvitation.id}/edit"]`),
      ).toHaveCount(0);

      // Còn quá xa hạn thì chưa lên danh sách.
      await expect(
        page.locator(`a[href="/admin/invitations/${freshInvitation.id}/edit"]`),
      ).toHaveCount(0);
    } finally {
      cleanupUser(withEmail.id);
      cleanupUser(withoutEmail.id);
    }
  });

  test("thiệp đã thanh toán rơi khỏi danh sách dự báo", async ({ page, context }) => {
    const user = createUser();
    const invitation = createInvitation(user.id, {
      status: "published",
      publishedAt: publishedForTrialEndingSoon(),
    });

    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/email-logs");
      // Không khoá số dòng: tuỳ giờ chạy test, thiệp có thể được dự báo một hoặc
      // hai mốc. Điều cần chứng minh là "có mặt" rồi "biến mất hoàn toàn".
      const link = page.locator(`a[href="/admin/invitations/${invitation.id}/edit"]`);
      await expect(link.first()).toBeVisible();

      getDb().prepare(`UPDATE Invitation SET paid = 1 WHERE id = ?`).run(invitation.id);
      await page.reload();

      await expect(link).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });
});
