# Admin User Invitation Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho mọi Admin xem, tạo, chỉnh sửa và xuất bản thiệp thay người dùng, đặt giá cuối cùng hoặc tặng miễn phí theo từng thiệp, đồng thời lưu audit log xác định chính xác Admin thực hiện.

**Architecture:** Thêm entitlement `complimentary` tách biệt với payment thật, một price override nullable trên từng thiệp và audit log bất biến theo snapshot. Admin thao tác qua route/action hỗ trợ riêng có `verifyAdmin()` ở mọi mutation; editor chỉ tái sử dụng UI và dịch vụ persistence, không tái sử dụng session hoặc quyền sở hữu của người dùng. Payment pending/cancelled cũ bị chuyển sang `superseded` trong cùng transaction khi giá đổi, và webhook chỉ claim trạng thái settleable hiện hành (`pending` hoặc legacy voucher `cancelled`), tuyệt đối không claim `superseded`.

**Tech Stack:** Next.js 16.2 App Router, React 19 server actions, TypeScript strict, Prisma 7 + SQLite, next-intl, Tailwind CSS v4, Node test runner qua `tsx`, Playwright.

---

## Điều kiện thực thi

- Đọc lại `AGENTS.md`, `docs/research/INSPECTION_GUIDE.md` và spec tại `docs/superpowers/specs/2026-08-13-admin-user-invitation-support-design.md` trước khi sửa code.
- Next.js 16 dùng `params` và `searchParams` dạng Promise. Các page động trong plan phải khai báo `params: Promise<{ id: string }>` và `await params`.
- Mỗi server action là endpoint POST có thể bị gọi trực tiếp. Mọi action phải tự gọi `verifyAdmin()` hoặc `verifySession()`, parse input và truy vấn lại ownership từ database.
- Execution worktree đã được tách tại `/Users/namdo/.config/superpowers/worktrees/clone/admin-invitation-support`, branch `codex/admin-invitation-support`. Feature base cố định là `d46e89ac6f0d606951fcc02c220ad764e7c79dd4`; không tính lại base từ remote branch và không thao tác lên worktree gốc đang dirty.
- Checkpoint hiện tại: Task 1 (`424a61b`), Task 6 (`8784359`) và Task 2 (`c5051ab`) đã hoàn tất tại `HEAD c5051ab`. Giữ nguyên các bước/checklist của ba task làm hồ sơ TDD và review contract; khi tiếp tục implementation, xác minh ba commit rồi bắt đầu Task 3, không viết lại lịch sử hoặc triển khai lại lát cắt đã hoàn tất.
- `src/generated/prisma/` bị gitignore. Chạy `npm run prisma:generate` để kiểm tra/typecheck nhưng không stage generated client.
- Chỉ deploy khi người dùng yêu cầu riêng sau khi toàn bộ gate hoàn tất.

### Thứ tự thực thi bắt buộc

Thực thi theo thứ tự `Task 1 → Task 6 → Task 2 → Task 3 → Task 4 → Task 5 → Task 7 → Task 8 → Task 9 → Task 10 → Task 11`. Task 6 được đặt sớm hơn trong dependency order vì các client component ở Task 2–5 phải có message key và `NextIntlClientProvider` trước khi typecheck/runtime gate chạy; số task được giữ theo lát cắt thiết kế để liên kết spec dễ đọc.

## Bản đồ file

### File mới

- `prisma/migrations/20260813090000_add_admin_invitation_support/migration.sql` — migration entitlement, giá riêng và audit.
- `src/lib/admin-support-schema.test.ts` — contract test schema/migration của Task 1.
- `src/lib/invitation-entitlement.ts` — nguồn quyết định duy nhất cho trạng thái paid/complimentary/trial và expiry.
- `src/lib/invitation-entitlement.test.ts` — unit test entitlement.
- `src/lib/invitation-pricing.ts` — hàm thuần resolve giá hệ thống/override và validation giới hạn giá.
- `src/lib/invitation-pricing.test.ts` — unit test pricing.
- `src/lib/payment-settlement.ts` — quyết định settlement thuần, tập trạng thái settleable và metadata reconciliation an toàn.
- `src/lib/payment-settlement.test.ts` — unit test mọi nhánh settle/ignore/reconcile.
- `src/lib/admin-support-input.ts` — normalize search, chặn user hệ thống và allowlist template dùng chung cho page/action.
- `src/lib/admin-support-input.test.ts` — unit test validation search/template/user đích.
- `src/lib/admin-support-copy.test.ts` — contract test key shape cho năm catalog.
- `src/lib/admin-audit.ts` — action constants, serialization details và hàm ghi audit trong transaction.
- `src/lib/admin-audit.test.ts` — unit test audit detail.
- `src/lib/invitation-editor-audit.ts` — canonicalize dữ liệu editor trước/sau và chỉ trả tên field/group đã đổi.
- `src/lib/invitation-editor-audit.test.ts` — unit test canonicalization, legacy ceremony fallback và không rò giá trị nhạy cảm.
- `src/lib/admin-audit-view.ts` — parser allowlist cho metadata audit hiển thị trong Admin UI.
- `src/lib/admin-audit-view.test.ts` — unit test malformed/nhạy cảm audit details không bị render.
- `src/lib/invitation-editor-rules.ts` — pure publication/slug rules có thể unit test.
- `src/lib/invitation-editor-store.ts` — parse/prepare/write nội dung editor dùng chung, không chứa auth nhưng có server-only dependencies.
- `src/app/admin/users/[id]/actions.ts` — tạo thiệp, đặt/reset giá cho user đích.
- `src/app/admin/users/[id]/page.tsx` — hồ sơ hỗ trợ người dùng.
- `src/app/admin/users/[id]/AdminCreateInvitationButton.tsx` — bộ chọn mẫu Admin.
- `src/app/admin/users/[id]/InvitationPriceDialog.tsx` — dialog giá cuối cùng/miễn phí.
- `src/app/admin/invitations/[id]/edit/page.tsx` — editor hỗ trợ.
- `src/app/admin/invitations/[id]/edit/actions.ts` — save/publish/check-slug/resolve-map dành riêng cho Admin.
- `tests/e2e/admin-invitation-support.spec.ts` — golden path và permission tests của tính năng.

### File sửa chính

- `prisma/schema.prisma` — fields/relations/model audit.
- `src/lib/admin-dal.ts` — trả cả email snapshot của Admin đã xác thực.
- `src/lib/payment-config.ts` — resolve giá theo thiệp trong cùng transaction.
- `src/lib/payment-service.ts` — conditional claim đúng `pending` và legacy voucher `cancelled`, không claim `superseded`.
- `src/lib/trial-reminder.ts`, `scripts/send-trial-reminders.ts`, `src/app/api/cron/trial-reminders/route.ts` — bỏ qua thiệp complimentary.
- `src/app/api/casso/webhook/route.ts`, `src/app/api/payos/webhook/route.ts` — settlement tập trung và chặn payment superseded.
- `src/app/api/payment/[code]/status/route.ts` — polling trả nguyên trạng thái `superseded` cho đúng chủ thiệp.
- `src/app/dashboard/[id]/thanh-toan/actions.ts`, `page.tsx`, `PaymentPanel.tsx` — dùng override, chặn checkout activated và xử lý superseded.
- `src/app/dashboard/page.tsx`, `DashboardInvitationCard.tsx` — hiển thị complimentary, không hiện trial/payment CTA.
- `src/app/thiep/[slug]/page.tsx` — complimentary không hết hạn.
- `src/app/editor/[id]/actions.ts`, `EditorForm.tsx`, `page.tsx`, `PublishSuccessDialog.tsx` — persistence dùng chung, entitlement và ba editor mode.
- `src/app/editor/[id]/content-schema.ts` — `EditorState` dùng error code ổn định; UI dịch code qua `editor.errors`.
- `src/app/admin/demos/actions.ts`, `src/app/admin/demos/[id]/page.tsx` — giữ auth demo, chuyển state sang error code và mode `demo-admin`.
- `src/hooks/use-form-draft.ts` — vô hiệu hóa mọi localStorage write/clear ngoài owner mode mà vẫn serialize form submit.
- `src/app/admin/users/page.tsx` — tìm kiếm và liên kết hồ sơ.
- `src/app/admin/layout.tsx` — cung cấp message `adminSupport` cho client component Admin.
- `src/app/dashboard/layout.tsx` — cung cấp message activation/payment cho dashboard client component.
- `messages/{vi,en,ko,ja,zh}.json` — copy mới theo namespace `adminSupport`, `dashboardActivation`, `paymentActivation`, `editor.support` và `editor.errors`.
- `src/lib/trial-reminder.test.ts`, `src/lib/to-demo-content.test.ts` — regression unit/typed fixtures của entitlement.
- `tests/e2e/helpers/fixtures.ts`, `tests/e2e/thiep.spec.ts`, `tests/e2e/dashboard.spec.ts`, `tests/e2e/dashboard-manage.spec.ts`, `tests/e2e/editor.spec.ts`, `tests/e2e/payment-webhook.spec.ts`, `tests/e2e/payos-webhook.spec.ts` — fixtures và consumer regression cho entitlement, editor, checkout và settlement.

---

### Task 1: Thêm schema entitlement, giá riêng và audit

**Files:**
- Create: `src/lib/admin-support-schema.test.ts`
- Create: `prisma/migrations/20260813090000_add_admin_invitation_support/migration.sql`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Viết schema contract test đang đỏ**

Tạo `src/lib/admin-support-schema.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");

test("Invitation separates complimentary activation from paid payments", () => {
  assert.match(schema, /adminPriceOverride\s+Int\?/);
  assert.match(schema, /complimentary\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /complimentaryAt\s+DateTime\?/);
});

test("AdminAuditLog preserves actor and target snapshots", () => {
  assert.match(schema, /model AdminAuditLog\s*\{/);
  assert.match(schema, /adminEmail\s+String/);
  assert.match(schema, /targetUserEmail\s+String\?/);
  assert.match(schema, /onDelete:\s*SetNull/);
  assert.match(schema, /@@index\(\[targetUserId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[invitationId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[adminId, createdAt\]\)/);
});
```

- [ ] **Step 2: Chạy test để xác nhận đỏ**

Run:

```bash
npx tsx --test src/lib/admin-support-schema.test.ts
```

Expected: FAIL tại matcher `adminPriceOverride` hoặc `AdminAuditLog`.

- [ ] **Step 3: Sửa Prisma schema**

Thêm relation arrays vào các model hiện có và fields vào `Invitation`:

```prisma
model User {
  id                  String               @id @default(cuid())
  email               String?              @unique
  passwordHash        String?
  createdAt           DateTime             @default(now())
  invitations         Invitation[]
  templateSuggestions TemplateSuggestion[]
  adminAuditLogs      AdminAuditLog[]      @relation("AuditTargetUser")
}

model Admin {
  id           String          @id @default(cuid())
  email        String          @unique
  passwordHash String
  isSuperAdmin Boolean         @default(false)
  createdAt    DateTime        @default(now())
  auditLogs    AdminAuditLog[]
}
```

Trong `Invitation`, thêm:

```prisma
  adminPriceOverride Int?
  complimentary      Boolean   @default(false)
  complimentaryAt    DateTime?

  adminAuditLogs AdminAuditLog[] @relation("AuditInvitation")
```

Thêm model:

```prisma
model AdminAuditLog {
  id              String   @id @default(cuid())
  adminId         String?
  adminEmail      String
  targetUserId    String?
  targetUserEmail String?
  invitationId    String?
  action          String
  details         String?
  createdAt       DateTime @default(now())

  admin      Admin?      @relation(fields: [adminId], references: [id], onDelete: SetNull)
  targetUser User?       @relation("AuditTargetUser", fields: [targetUserId], references: [id], onDelete: SetNull)
  invitation Invitation? @relation("AuditInvitation", fields: [invitationId], references: [id], onDelete: SetNull)

  @@index([targetUserId, createdAt])
  @@index([invitationId, createdAt])
  @@index([adminId, createdAt])
}
```

- [ ] **Step 4: Viết migration SQL tương ứng**

Tạo `prisma/migrations/20260813090000_add_admin_invitation_support/migration.sql`:

```sql
ALTER TABLE "Invitation" ADD COLUMN "adminPriceOverride" INTEGER;
ALTER TABLE "Invitation" ADD COLUMN "complimentary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invitation" ADD COLUMN "complimentaryAt" DATETIME;

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "adminEmail" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT,
    "invitationId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdminAuditLog_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");
CREATE INDEX "AdminAuditLog_invitationId_createdAt_idx" ON "AdminAuditLog"("invitationId", "createdAt");
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
```

- [ ] **Step 5: Validate schema, generate client và chạy contract test**

Run:

```bash
npx prisma validate
npm run prisma:generate
npx tsx --test src/lib/admin-support-schema.test.ts
```

Expected: cả ba lệnh exit 0; 2 tests PASS.

- [ ] **Step 6: Kiểm tra migration trên database tạm**

Rehearse theo hai pha để chứng minh migration mới áp lên baseline cũ có dữ liệu:

```bash
support_dir=$(mktemp -d /tmp/chungdoi-admin-support.XXXXXX)
mkdir -p "$support_dir/prisma"
support_db="$support_dir/support.db"
cp prisma/schema.prisma "$support_dir/prisma/schema.prisma"
cp -R prisma/migrations "$support_dir/prisma/migrations"
rm -rf "$support_dir/prisma/migrations/20260813090000_add_admin_invitation_support"

DATABASE_URL="file:$support_db" RUST_LOG=info \
  npx prisma migrate deploy --schema="$support_dir/prisma/schema.prisma"
python3 - "$support_db" <<'PY'
import sqlite3
import sys

connection = sqlite3.connect(sys.argv[1])
connection.execute(
    'INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    ('legacy-user', 'legacy@example.com', None),
)
connection.execute(
    '''INSERT INTO Invitation
       (id, userId, slug, templateId, status, paid, isDemo, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)''',
    ('legacy-invitation', 'legacy-user', None, 'song-hy-red', 'draft', 0, 0),
)
connection.commit()
PY

cp -R prisma/migrations/20260813090000_add_admin_invitation_support \
  "$support_dir/prisma/migrations/"
DATABASE_URL="file:$support_db" RUST_LOG=info \
  npx prisma migrate deploy --schema="$support_dir/prisma/schema.prisma"
python3 - "$support_db" <<'PY'
import sqlite3
import sys

connection = sqlite3.connect(sys.argv[1])
foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
quick_check = connection.execute("PRAGMA quick_check").fetchone()[0]
legacy = connection.execute(
    '''SELECT adminPriceOverride, complimentary, complimentaryAt
       FROM Invitation WHERE id = 'legacy-invitation' ''',
).fetchone()
assert foreign_keys == [], foreign_keys
assert quick_check == "ok", quick_check
assert legacy == (None, 0, None), legacy
print("quick_check=ok")
PY
```

Expected: `quick_check` in `ok`, không có dòng foreign-key error.

- [ ] **Step 7: Commit schema slice**

```bash
git add prisma/schema.prisma prisma/migrations/20260813090000_add_admin_invitation_support/migration.sql src/lib/admin-support-schema.test.ts
git commit -m "feat(admin): add invitation support data model"
```

---

### Task 2: Tạo entitlement duy nhất và cập nhật mọi luồng trial

**Files:**
- Create: `src/lib/invitation-entitlement.ts`
- Create: `src/lib/invitation-entitlement.test.ts`
- Modify: `src/lib/trial-reminder.ts`
- Modify: `src/lib/trial-reminder.test.ts`
- Modify: `scripts/send-trial-reminders.ts`
- Modify: `src/app/api/cron/trial-reminders/route.ts`
- Modify: `src/app/thiep/[slug]/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/DashboardInvitationCard.tsx`
- Modify: `src/app/editor/[id]/page.tsx`
- Modify: `src/app/editor/[id]/EditorForm.tsx`
- Modify: `src/app/editor/[id]/PublishSuccessDialog.tsx`
- Modify: `src/app/admin/demos/[id]/page.tsx`
- Modify: `src/lib/to-demo-content.test.ts`
- Modify: `tests/e2e/helpers/fixtures.ts`
- Modify: `tests/e2e/thiep.spec.ts`
- Modify: `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Viết unit tests entitlement đang đỏ**

Tạo `src/lib/invitation-entitlement.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvitationActivation,
  isInvitationActivated,
  isInvitationExpired,
} from "./invitation-entitlement";
import { FREE_TRIAL_MS } from "./trial";

test("paid takes precedence over complimentary", () => {
  assert.equal(getInvitationActivation({ paid: true, complimentary: true }), "paid");
});

test("complimentary activates without claiming payment", () => {
  assert.equal(getInvitationActivation({ paid: false, complimentary: true }), "complimentary");
  assert.equal(isInvitationActivated({ paid: false, complimentary: true }), true);
});

test("unpaid non-complimentary invitation remains trial", () => {
  assert.equal(getInvitationActivation({ paid: false, complimentary: false }), "trial");
});

test("complimentary invitation never expires", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  const publishedAt = new Date(now.getTime() - FREE_TRIAL_MS - 1);
  assert.equal(isInvitationExpired({ paid: false, complimentary: true, publishedAt }, now), false);
});

test("trial expires after the configured window", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  const publishedAt = new Date(now.getTime() - FREE_TRIAL_MS);
  assert.equal(isInvitationExpired({ paid: false, complimentary: false, publishedAt }, now), true);
});
```

Trong `src/lib/trial-reminder.test.ts`, thêm `complimentary: false` vào fixture mặc định và test:

```ts
test("không gửi khi thiệp được tặng miễn phí", () => {
  assert.equal(shouldSendReminder(candidate({ complimentary: true }), now), false);
});
```

- [ ] **Step 2: Chạy tests để xác nhận đỏ**

```bash
npx tsx --test src/lib/invitation-entitlement.test.ts src/lib/trial-reminder.test.ts
```

Expected: FAIL vì module/hàm entitlement chưa tồn tại hoặc `complimentary` chưa nằm trong `ReminderCandidate`.

- [ ] **Step 3: Viết helper entitlement**

Tạo `src/lib/invitation-entitlement.ts`:

```ts
import { trialExpiresAt } from "@/lib/trial";

export type InvitationActivation = "paid" | "complimentary" | "trial";

export type InvitationActivationFields = {
  paid: boolean;
  complimentary: boolean;
};

export function getInvitationActivation(
  invitation: InvitationActivationFields,
): InvitationActivation {
  if (invitation.paid) return "paid";
  if (invitation.complimentary) return "complimentary";
  return "trial";
}

export function isInvitationActivated(invitation: InvitationActivationFields): boolean {
  return getInvitationActivation(invitation) !== "trial";
}

export function isInvitationExpired(
  invitation: InvitationActivationFields & { publishedAt: Date | null },
  now = new Date(),
): boolean {
  if (isInvitationActivated(invitation) || !invitation.publishedAt) return false;
  return now.getTime() >= trialExpiresAt(invitation.publishedAt).getTime();
}
```

- [ ] **Step 4: Cập nhật reminder candidate và query**

Sửa `ReminderCandidate` và guard trong `src/lib/trial-reminder.ts`:

```ts
export type ReminderCandidate = {
  paid: boolean;
  complimentary: boolean;
  publishedAt: Date | null;
  reminderSentAt: Date | null;
  email: string | null;
};

export function shouldSendReminder(c: ReminderCandidate, now: Date): boolean {
  if (isInvitationActivated(c)) return false;
  if (!c.publishedAt || c.reminderSentAt || !c.email) return false;
  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt > nowMs && expiresAt <= nowMs + REMINDER_WINDOW_MS;
}
```

Import `isInvitationActivated` từ `@/lib/invitation-entitlement`. Đây là nguồn quyết định duy nhất; không lặp lại biểu thức `paid || complimentary` ở reminder.

Trong cả script và cron route, đổi filter/candidate chính xác thành:

```ts
where: {
  paid: false,
  complimentary: false,
  publishedAt: { not: null },
  reminderSentAt: null,
},
```

và:

```ts
const candidate: ReminderCandidate = {
  paid: inv.paid,
  complimentary: inv.complimentary,
  publishedAt: inv.publishedAt,
  reminderSentAt: inv.reminderSentAt,
  email,
};
```

- [ ] **Step 5: Viết consumer E2E đang đỏ cho thiệp complimentary cũ**

Mở rộng `createInvitation` trong `tests/e2e/helpers/fixtures.ts` để nhận `complimentary: boolean` và INSERT cột `complimentary`. Trong `tests/e2e/thiep.spec.ts`, seed thiệp đã publish lâu hơn `FREE_TRIAL_MS`, có `paid=false`, `complimentary=true`, rồi assert nội dung public vẫn hiện, màn “hết 3 ngày dùng thử” không hiện và không có CTA thanh toán:

```ts
test("an old complimentary invitation remains publicly available", async ({ page }) => {
  const user = createUser();
  const slug = `complimentary-${randomUUID().slice(0, 8)}`;
  const invitation = createInvitation(user.id, {
    status: "published",
    slug,
    paid: false,
    complimentary: true,
    publishedAt: new Date(Date.now() - FREE_TRIAL_MS - 60_000),
  });
  try {
    setInvitationContent(invitation.id, {
      brideFullName: "Nguyễn Mai",
      groomFullName: "Trần Nam",
    });
    await page.goto(`/thiep/${slug}`);
    await expect(page.getByText("Nguyễn Mai")).toBeVisible();
    await expect(page.getByText(/đã hết 3 ngày dùng thử/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /thanh toán/i })).toHaveCount(0);
  } finally {
    cleanupUser(user.id);
  }
});
```

Trong `tests/e2e/dashboard.spec.ts`, seed cùng trạng thái và assert card hiện bản dịch `dashboardActivation.complimentary`, không có trial countdown và không có CTA thanh toán:

```ts
test("complimentary invitation shows its badge without a trial countdown", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id, {
    status: "published",
    slug: `complimentary-${randomUUID().slice(0, 8)}`,
    complimentary: true,
    publishedAt: new Date(Date.now() - FREE_TRIAL_MS - 60_000),
  });
  try {
    await loginAsUser(context, user.id);
    await page.goto("/dashboard");
    const card = page.locator(`[data-invitation-id="${invitation.id}"]`);
    await expect(card.getByText("Được tặng miễn phí")).toBeVisible();
    await expect(card.getByText(/còn lại|đã hết/i)).toHaveCount(0);
    await expect(card.getByRole("link", { name: /thanh toán/i })).toHaveCount(0);
  } finally {
    cleanupUser(user.id);
  }
});
```

Chạy trước khi đổi consumer:

```bash
npx playwright test tests/e2e/thiep.spec.ts tests/e2e/dashboard.spec.ts --project=chromium --grep 'old complimentary|complimentary invitation shows'
```

Expected: FAIL vì public route coi thiệp cũ là expired và dashboard chưa render badge/ẩn countdown.

- [ ] **Step 6: Thay mọi expiry/payment CTA trực tiếp theo `paid` bằng activation**

Áp dụng các thay đổi sau:

```ts
// src/app/thiep/[slug]/page.tsx
import { isInvitationExpired } from "@/lib/invitation-entitlement";

const expired = isInvitationExpired(invitation);
if (expired) {
  return <ExpiredInvitationView invitationId={invitation.id} />;
}
```

Không cần tạo component mới nếu giữ markup inline; xóa hàm local `isExpired(paid, publishedAt)` và thay đúng điều kiện cũ bằng `isInvitationExpired(invitation)`.

```ts
// src/app/dashboard/page.tsx
import { getInvitationActivation } from "@/lib/invitation-entitlement";

<DashboardInvitationCard
  id={inv.id}
  templateId={inv.templateId}
  templateName={templateName}
  title={names || templateName}
  hasNames={Boolean(names)}
  status={inv.status}
  slug={inv.slug}
  activation={getInvitationActivation(inv)}
  publishedAt={inv.publishedAt?.toISOString() ?? null}
  rsvpCount={inv._count.rsvps}
  wishCount={inv._count.wishes}
/>
```

Đổi prop của `DashboardInvitationCard` từ `paid: boolean` sang:

```ts
import type { InvitationActivation } from "@/lib/invitation-entitlement";

activation: InvitationActivation;
```

và quyết định UI bằng:

```ts
const showTrialBanner = Boolean(published && activation === "trial" && publishedAt);
```

Badge activation phải có ba nhánh độc lập: `paid`, `complimentary`, và không có badge vĩnh viễn đối với `trial`. Copy được lấy từ `dashboardActivation` ở Task 6.

`DashboardInvitationCard` gọi `useTranslations("dashboardActivation")` ngay trong Task 2 và render `paid`/`complimentary` bằng key catalog, không để việc dịch badge lại Task 10. `src/app/dashboard/layout.tsx` đã expose namespace này ở Task 6.

- [ ] **Step 7: Chuyển editor và publish dialog sang activation**

Trong `EditorFormProps`, thay `paid` bằng:

```ts
activation: InvitationActivation;
```

Tạo biến:

```ts
const activated = activation !== "trial";
```

Trial banner chỉ hiện khi `activation === "trial"`. `PublishSuccessDialog` đổi prop `paid` thành `activated` và điều kiện payment link thành `!activated`. `src/app/editor/[id]/page.tsx` truyền `getInvitationActivation(invitation)`. Trang demo truyền `activation={getInvitationActivation(invitation)}`.

Trong fixture typed `invitationRow` của `src/lib/to-demo-content.test.ts`, thêm đúng ba field mới để Prisma payload type tiếp tục khớp:

```ts
adminPriceOverride: null,
complimentary: false,
complimentaryAt: null,
```

- [ ] **Step 8: Chạy unit, consumer regression và typecheck**

```bash
npx tsx --test src/lib/invitation-entitlement.test.ts src/lib/trial-reminder.test.ts
npm run typecheck
npx playwright test tests/e2e/thiep.spec.ts tests/e2e/dashboard.spec.ts --project=chromium --grep 'old complimentary|complimentary invitation shows'
```

Expected: unit và hai consumer E2E PASS; typecheck exit 0 và không còn lỗi prop `paid` tại các call site của `EditorForm`/`DashboardInvitationCard`.

- [ ] **Step 9: Commit entitlement slice**

```bash
git add src/lib/invitation-entitlement.ts src/lib/invitation-entitlement.test.ts src/lib/trial-reminder.ts src/lib/trial-reminder.test.ts src/lib/to-demo-content.test.ts scripts/send-trial-reminders.ts src/app/api/cron/trial-reminders/route.ts 'src/app/thiep/[slug]/page.tsx' src/app/dashboard/page.tsx src/app/dashboard/DashboardInvitationCard.tsx 'src/app/editor/[id]/page.tsx' 'src/app/editor/[id]/EditorForm.tsx' 'src/app/editor/[id]/PublishSuccessDialog.tsx' 'src/app/admin/demos/[id]/page.tsx' tests/e2e/helpers/fixtures.ts tests/e2e/thiep.spec.ts tests/e2e/dashboard.spec.ts
git commit -m "feat(invitation): support complimentary activation"
```

---

### Task 3: Resolve giá cuối cùng và bảo vệ checkout

**Files:**
- Create: `src/lib/invitation-pricing.ts`
- Create: `src/lib/invitation-pricing.test.ts`
- Modify: `src/lib/payment-config.ts`
- Modify: `src/lib/payment-service.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/actions.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/page.tsx`
- Modify: `src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx`
- Modify: `tests/e2e/helpers/fixtures.ts`
- Modify: `tests/e2e/dashboard-manage.spec.ts`

- [ ] **Step 1: Viết pricing unit tests đang đỏ**

Tạo `src/lib/invitation-pricing.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  adminFinalPriceSchema,
  MAX_ADMIN_FINAL_PRICE,
  resolveEffectiveInvitationPrice,
  resolveSystemInvitationPrice,
} from "./invitation-pricing";

test("first paid purchase uses product price", () => {
  assert.equal(resolveSystemInvitationPrice(150_000, 99_000, 0), 150_000);
});

test("repeat customer uses repeat price", () => {
  assert.equal(resolveSystemInvitationPrice(150_000, 99_000, 1), 99_000);
});

test("admin override is the authoritative final price", () => {
  assert.equal(resolveEffectiveInvitationPrice(79_000, 150_000), 79_000);
  assert.equal(resolveEffectiveInvitationPrice(0, 150_000), 0);
  assert.equal(resolveEffectiveInvitationPrice(null, 150_000), 150_000);
});

test("maximum admin final price is bounded", () => {
  assert.equal(MAX_ADMIN_FINAL_PRICE, 100_000_000);
});

test("admin final price accepts only a non-empty integer VND string", () => {
  assert.equal(adminFinalPriceSchema.safeParse("79000").success, true);
  assert.equal(adminFinalPriceSchema.safeParse("0").success, true);
  assert.equal(adminFinalPriceSchema.safeParse("").success, false);
  assert.equal(adminFinalPriceSchema.safeParse("   ").success, false);
  assert.equal(adminFinalPriceSchema.safeParse("-1").success, false);
  assert.equal(adminFinalPriceSchema.safeParse("1.5").success, false);
  assert.equal(adminFinalPriceSchema.safeParse("100000001").success, false);
});
```

- [ ] **Step 2: Chạy test để xác nhận đỏ**

```bash
npx tsx --test src/lib/invitation-pricing.test.ts
```

Expected: FAIL vì module chưa tồn tại.

- [ ] **Step 3: Viết pure pricing helper**

Tạo `src/lib/invitation-pricing.ts`:

```ts
import { z } from "zod";

export const MAX_ADMIN_FINAL_PRICE = 100_000_000;

export const adminFinalPriceSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(MAX_ADMIN_FINAL_PRICE));

export function resolveSystemInvitationPrice(
  productPrice: number,
  repeatCustomerPrice: number,
  previousPaidCount: number,
): number {
  return previousPaidCount > 0 ? repeatCustomerPrice : productPrice;
}

export function resolveEffectiveInvitationPrice(
  adminPriceOverride: number | null,
  systemPrice: number,
): number {
  return adminPriceOverride ?? systemPrice;
}
```

- [ ] **Step 4: Cho payment-config nhận transaction client**

Trong `src/lib/payment-config.ts`, thêm hàm có chữ ký chính xác:

```ts
import type { Prisma } from "@/generated/prisma/client";
import { resolveEffectiveInvitationPrice, resolveSystemInvitationPrice } from "@/lib/invitation-pricing";

type PaymentPriceClient = Pick<
  Prisma.TransactionClient,
  "appConfig" | "invitation" | "payment"
>;

export async function getPriceForInvitation(
  db: PaymentPriceClient,
  userId: string,
  invitationId: string,
): Promise<number> {
  const [config, invitation, paidCount] = await Promise.all([
    db.appConfig.findUnique({
      where: { id: APP_CONFIG_ID },
      select: { productPrice: true, repeatCustomerPrice: true },
    }),
    db.invitation.findFirst({
      where: { id: invitationId, userId },
      select: { adminPriceOverride: true },
    }),
    db.payment.count({
      where: {
        status: "paid",
        invitationId: { not: invitationId },
        invitation: { userId },
      },
    }),
  ]);
  if (!invitation) throw new Error("Không tìm thấy thiệp");

  const productPrice = config?.productPrice ?? DEFAULT_PRODUCT_PRICE;
  const repeatCustomerPrice = config?.repeatCustomerPrice ?? DEFAULT_REPEAT_CUSTOMER_PRICE;
  const systemPrice = resolveSystemInvitationPrice(
    productPrice,
    repeatCustomerPrice,
    paidCount,
  );
  return resolveEffectiveInvitationPrice(invitation.adminPriceOverride, systemPrice);
}

export async function getPriceForUser(
  userId: string,
  currentInvitationId: string,
): Promise<number> {
  return getPriceForInvitation(prisma, userId, currentInvitationId);
}
```

- [ ] **Step 5: Viết checkout/voucher E2E đang đỏ trước implementation**

Trong `tests/e2e/helpers/fixtures.ts`, mở rộng overrides:

```ts
adminPriceOverride: number | null;
complimentary: boolean;
```

và thêm các cột này vào câu INSERT Invitation. Trong `tests/e2e/dashboard-manage.spec.ts`, thêm hai test:

```ts
test("admin final price is used for the next payment", async ({ page, context }) => {
  const user = createUser();
  const inv = createInvitation(user.id, { adminPriceOverride: 79_000 });
  try {
    await loginAsUser(context, user.id);
    await page.goto(`/dashboard/${inv.id}/thanh-toan`);
    await expect(page.getByText("79.000đ")).toBeVisible();
    expect(paymentsOf(inv.id)[0]?.amount).toBe(79_000);
    await expect(page.getByPlaceholder("Mã giảm giá")).toHaveCount(0);
  } finally {
    cleanup(user.id);
  }
});

test("complimentary invitation creates no payment", async ({ page, context }) => {
  const user = createUser();
  const inv = createInvitation(user.id, {
    adminPriceOverride: 0,
    complimentary: true,
  });
  try {
    await loginAsUser(context, user.id);
    await page.goto(`/dashboard/${inv.id}/thanh-toan`);
    await expect(page.getByText("Được tặng miễn phí")).toBeVisible();
    expect(paymentsOf(inv.id)).toHaveLength(0);
  } finally {
    cleanup(user.id);
  }
});
```

Trong cùng suite, thêm characterization cho voucher thường và regression stale UI. Thêm ba helper local typed, dùng `randomUUID()`/`prismaNow()` và SQL thật:

```ts
function createVoucher(input: { amountOff: number; active: boolean }): { id: string; code: string } {
  const id = `v-${randomUUID()}`;
  const code = `VC${randomUUID().slice(0, 8).toUpperCase()}`;
  getDb().prepare(`
    INSERT INTO Voucher (id, code, amountOff, active, usedCount, createdAt)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, code, input.amountOff, input.active ? 1 : 0, prismaNow());
  return { id, code };
}

function cleanupVoucher(code: string): void {
  getDb().prepare("DELETE FROM Voucher WHERE code = ?").run(code);
}

function latestPaymentOf(invitationId: string): {
  id: string;
  amount: number;
  voucherCode: string | null;
  status: string;
} {
  return getDb().prepare(`
    SELECT id, amount, voucherCode, status FROM Payment
    WHERE invitationId = ? ORDER BY createdAt DESC, id DESC LIMIT 1
  `).get(invitationId) as {
    id: string;
    amount: number;
    voucherCode: string | null;
    status: string;
  };
}
```

Test thứ hai phải mở trang trước để lấy payment/voucher form, rồi mới update override trực tiếp nhằm mô phỏng Admin đổi giá trong lúc form cũ đang mở:

```ts
test("a regular voucher still applies and returns updated payment info", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const voucher = createVoucher({ amountOff: 20_000, active: true });
  try {
    await loginAsUser(context, user.id);
    await page.goto(`/dashboard/${invitation.id}/thanh-toan`);
    await page.getByPlaceholder("Mã giảm giá").fill(voucher.code);
    await page.getByRole("button", { name: "Áp dụng" }).click();
    await expect(page.getByText("130.000đ")).toBeVisible();
    const latest = latestPaymentOf(invitation.id);
    expect(latest).toMatchObject({ amount: 130_000, voucherCode: voucher.code });
  } finally {
    cleanupVoucher(voucher.code);
    cleanup(user.id);
  }
});

test("a stale voucher form rejects an admin final price without mutating payment", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const voucher = createVoucher({ amountOff: 20_000, active: true });
  try {
    await loginAsUser(context, user.id);
    await page.goto(`/dashboard/${invitation.id}/thanh-toan`);
    const before = latestPaymentOf(invitation.id);
    getDb().prepare(
      "UPDATE Invitation SET adminPriceOverride = 79000, updatedAt = ? WHERE id = ?",
    ).run(prismaNow(), invitation.id);

    await page.getByPlaceholder("Mã giảm giá").fill(voucher.code);
    await page.getByRole("button", { name: "Áp dụng" }).click();
    await expect(page.getByText("Thiệp đã có giá ưu đãi riêng.")).toBeVisible();
    expect(latestPaymentOf(invitation.id)).toMatchObject({
      id: before.id,
      amount: before.amount,
      voucherCode: null,
      status: "pending",
    });
  } finally {
    cleanupVoucher(voucher.code);
    cleanup(user.id);
  }
});
```

Chạy trước khi sửa action:

```bash
npx playwright test tests/e2e/dashboard-manage.spec.ts --project=chromium --grep 'final price|complimentary invitation|regular voucher|stale voucher'
```

Expected: FAIL vì override chưa điều khiển amount/visibility, activated invitation vẫn tạo payment hoặc stale voucher vẫn ghi đè giá.

- [ ] **Step 6: Làm checkout transaction-safe và định nghĩa result union đầy đủ**

Trong actions thanh toán, định nghĩa internal/public result riêng:

```ts
type CheckoutTxResult =
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "payment"; payment: Payment; voucherAllowed: boolean };

export type CheckoutPreparation =
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "payment"; payment: PaymentInfo };
```

Thêm `voucherAllowed: boolean` vào `PaymentInfo` và đổi helper thành chữ ký bắt buộc:

```ts
function paymentInfo(payment: Payment, voucherAllowed: boolean): PaymentInfo {
  return {
    paymentId: payment.id,
    code: payment.code,
    amount: payment.amount,
    voucherCode: payment.voucherCode,
    status: payment.status,
    expiresAt: paymentExpiresAt(payment.createdAt),
    provider: payment.provider === "payos" ? "payos" : "casso",
    checkoutUrl: payment.providerCheckoutUrl,
    bankBin: payment.providerBankBin ?? BANK.bin,
    bankAccount: payment.providerBankAccount ?? BANK.account,
    bankAccountName: payment.providerBankAccountName ?? BANK.name,
    voucherAllowed,
  };
}
```

`createOrGetPayment` dùng implementation đầy đủ sau. Không lặp lại `paid || complimentary`, không dùng `getPriceForUser` trong transaction:

```ts
export async function createOrGetPayment(
  invitationId: string,
): Promise<CheckoutPreparation> {
  const { userId } = await verifySession();
  const provider = getPaymentProvider();
  const result = await prisma.$transaction(async (db): Promise<CheckoutTxResult> => {
    const invitation = await db.invitation.findFirst({
      where: { id: invitationId, userId },
      select: { paid: true, complimentary: true, adminPriceOverride: true },
    });
    if (!invitation) throw new Error("INVITATION_NOT_FOUND");

    const activation = getInvitationActivation(invitation);
    if (activation !== "trial") return { kind: "activated", activation };

    const voucherAllowed = invitation.adminPriceOverride === null;
    const existing = await db.payment.findFirst({
      where: { invitationId, status: "pending", provider },
      orderBy: { createdAt: "desc" },
    });
    if (existing && !isPendingPaymentExpired(existing.createdAt)) {
      return { kind: "payment", payment: existing, voucherAllowed };
    }

    const amount = await getPriceForInvitation(db, userId, invitationId);
    if (amount <= 0) throw new Error("INVALID_COMPLIMENTARY_STATE");
    const payment = await db.payment.create({
      data: {
        invitationId,
        code: genOrderCode(),
        amount,
        provider,
        providerOrderCode: provider === "payos" ? genPayosOrderCode() : null,
      },
    });
    return { kind: "payment", payment, voucherAllowed };
  });

  if (result.kind === "activated") return result;
  const prepared = await preparePayment(result.payment);
  return {
    kind: "payment",
    payment: paymentInfo(prepared, result.voucherAllowed),
  };
}
```

Nếu giá resolve `<= 0` trong một trial record, throw domain error `INVALID_COMPLIMENTARY_STATE`; không tạo payment 0 thay cho Admin entitlement. Sau commit, gọi `preparePayment`, rồi `paymentInfo(prepared, result.voucherAllowed)`. Page thanh toán bỏ query/guard `invitation.paid` riêng, gọi `createOrGetPayment(id)` đúng một lần, render activated state theo union và không mount `PaymentPanel` ở nhánh activated.

- [ ] **Step 7: Viết voucher transaction tương tác, không nested transaction**

Đổi result sang error code ổn định:

```ts
export type VoucherErrorCode =
  | "voucherRequired"
  | "paymentNotFound"
  | "forbidden"
  | "paymentProcessed"
  | "voucherAlreadyApplied"
  | "paymentExpired"
  | "voucherInvalid"
  | "voucherExpired"
  | "voucherExhausted"
  | "paymentProviderFailed"
  | "customPriceVoucherBlocked";

export type VoucherResult =
  | { ok: true; payment: PaymentInfo }
  | { ok: false; errorCode: VoucherErrorCode };

type VoucherTxResult = {
  payment: Payment;
  voucherAllowed: true;
  oldPayosToCancel: Payment | null;
  needsPayosRequest: boolean;
};
```

Định nghĩa error nội bộ để callback transaction có thể abort mà outer action chỉ map đúng domain lỗi:

```ts
class VoucherMutationError extends Error {
  constructor(readonly code: Exclude<VoucherErrorCode, "voucherRequired" | "paymentProviderFailed">) {
    super(code);
  }
}

function voucherFailure(error: unknown): VoucherResult {
  if (error instanceof VoucherMutationError) {
    return { ok: false, errorCode: error.code };
  }
  throw error;
}
```

`verifySession()` và guard code rỗng chạy trước transaction. Mọi guard/data mutation còn lại chạy trong **một** `prisma.$transaction(async (db) => ...)`, theo đúng thứ tự sau; mỗi nhánh lỗi throw `VoucherMutationError(code)` để rollback:

1. `db.payment.findUnique({ where: { id: paymentId }, include: { invitation: { select: { userId: true, adminPriceOverride: true } } } })`; null → `paymentNotFound`.
2. So `invitation.userId` với session user → `forbidden`; `status !== "pending"` → `paymentProcessed`; đã có `voucherCode` → `voucherAlreadyApplied`; expired → `paymentExpired`.
3. Kiểm tra lại `invitation.adminPriceOverride`; khác `null` → `customPriceVoucherBlocked`. Đây là guard stale UI bắt buộc.
4. `db.voucher.findUnique({ where: { code } })`; lần lượt map inactive/null → `voucherInvalid`, quá hạn → `voucherExpired`, hết lượt → `voucherExhausted`.
5. Tính `amount = applyVoucher(payment.amount, voucher.amountOff)`.
6. Với Casso, dùng `payment.updateMany({ where: { id: payment.id, status: "pending", voucherCode: null }, ... })`. `amount > 0` ghi `amount/voucherCode`; `amount === 0` ghi thêm `status:"paid", paidAt:now`, update `Invitation.paid=true` và increment voucher ngay trong transaction. Nếu `count !== 1`, throw typed `paymentProcessed` để rollback.
7. Với payOS, conditional update payment cũ `pending → cancelled` trước; `count !== 1` rollback `paymentProcessed`. Tạo replacement với `voucherCode`, provider/order code mới và `status: amount === 0 ? "paid" : "pending"`. Nếu zero, update invitation paid và increment voucher trong cùng transaction; nếu dương, chưa increment voucher vì `markPaymentPaid` sẽ increment khi settlement thật.
8. Return `VoucherTxResult`; Casso trả payment đã re-read, `oldPayosToCancel:null`, `needsPayosRequest:false`; payOS trả replacement, payment cũ trong `oldPayosToCancel`, và `needsPayosRequest = amount > 0`. Outer `try/catch` gọi `voucherFailure`; lỗi lạ rethrow và không chạy provider I/O.

Tuyệt đối không gọi `markPaymentPaid` từ callback transaction vì helper đó mở transaction riêng. Zero-amount activation, `paidAt`, invitation `paid` và voucher increment phải commit/rollback cùng nhau như bước 6–7.

Sau commit mới chạy provider I/O theo thứ tự:

```ts
if (result.oldPayosToCancel) {
  await cancelPayosPayment(result.oldPayosToCancel, "voucher_changed");
}
let payment = result.payment;
if (result.needsPayosRequest) {
  try {
    payment = await ensurePayosPaymentRequest(payment);
  } catch (error) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: { status: "failed" },
    });
    await cancelPayosPayment(payment, "provider_create_failed");
    console.error("Không thể tạo link payOS sau khi áp voucher", {
      paymentId: payment.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, errorCode: "paymentProviderFailed" };
  }
}
return { ok: true, payment: paymentInfo(payment, true) };
```

Conditional `pending → failed` là bắt buộc để provider failure không ghi đè `superseded`. `cancelPayosPayment` và `ensurePayosPaymentRequest` không chạy trong transaction. `PaymentPanel` chỉ render voucher form khi `payment.voucherAllowed && !payment.voucherCode`, và dịch `errorCode` qua `paymentActivation.errors`.

Rà toàn bộ call site hiện có trong `actions.ts`: cached/new checkout đều truyền `invitation.adminPriceOverride === null`; Casso updated/zero-paid và payOS replacement đều truyền `true` sau guard override. Chạy:

```bash
rg -n 'paymentInfo\(' 'src/app/dashboard/[id]/thanh-toan/actions.ts'
```

Expected: definition có hai parameters và mọi call có argument `voucherAllowed`; không còn `paymentInfo(payment)` một-argument.

- [ ] **Step 8: Chạy unit, E2E slice và typecheck**

```bash
npx tsx --test src/lib/invitation-pricing.test.ts
npm run typecheck
npx playwright test tests/e2e/dashboard-manage.spec.ts --project=chromium --grep 'final price|complimentary invitation|regular voucher|stale voucher'
```

Expected: unit tests PASS, typecheck exit 0; override, complimentary, voucher thường và stale-form E2E đều PASS.

- [ ] **Step 9: Commit pricing/checkout slice**

```bash
git add src/lib/invitation-pricing.ts src/lib/invitation-pricing.test.ts src/lib/payment-config.ts src/lib/payment-service.ts 'src/app/dashboard/[id]/thanh-toan/actions.ts' 'src/app/dashboard/[id]/thanh-toan/page.tsx' 'src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx' tests/e2e/helpers/fixtures.ts tests/e2e/dashboard-manage.spec.ts
git commit -m "feat(payment): honor invitation final price overrides"
```

---

### Task 4: Chặn webhook/payment cũ bypass giá Admin

**Files:**
- Create: `src/lib/payment-settlement.ts`
- Create: `src/lib/payment-settlement.test.ts`
- Modify: `src/lib/payment-service.ts`
- Modify: `src/app/api/casso/webhook/route.ts`
- Modify: `src/app/api/payos/webhook/route.ts`
- Modify: `src/app/api/payment/[code]/status/route.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/actions.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/page.tsx`
- Modify: `src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx`
- Modify: `tests/e2e/payment-webhook.spec.ts`
- Modify: `tests/e2e/payos-webhook.spec.ts`

- [ ] **Step 1: Viết unit tests đang đỏ cho quyết định settlement và log an toàn**

Tạo `src/lib/payment-settlement.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  cassoReconciliationMetadata,
  decideCassoSettlement,
  isPaymentSettleable,
} from "./payment-settlement";

test("only pending and legacy voucher-cancelled payments may settle", () => {
  assert.equal(isPaymentSettleable("pending"), true);
  assert.equal(isPaymentSettleable("cancelled"), true);
  assert.equal(isPaymentSettleable("superseded"), false);
  assert.equal(isPaymentSettleable("failed"), false);
  assert.equal(isPaymentSettleable("paid"), false);
});

const candidate = {
  id: "payment-1",
  code: "CDABC123",
  provider: "casso",
  status: "pending",
  amount: 150_000,
  createdAt: new Date("2026-08-13T10:00:00.000Z"),
};
const now = new Date("2026-08-13T10:05:00.000Z");

test("Casso decision distinguishes settle, ignore and manual reconciliation", () => {
  assert.deepEqual(decideCassoSettlement({ payment: candidate, receivedAmount: 150_000, now }), {
    kind: "settle",
  });
  assert.deepEqual(decideCassoSettlement({ payment: null, receivedAmount: 150_000, now }), {
    kind: "ignore",
    reason: "unknown-code",
  });
  assert.deepEqual(decideCassoSettlement({
    payment: { ...candidate, status: "paid" }, receivedAmount: 150_000, now,
  }), { kind: "ignore", reason: "duplicate-paid" });
  assert.deepEqual(decideCassoSettlement({
    payment: { ...candidate, status: "superseded" }, receivedAmount: 150_000, now,
  }), { kind: "reconcile", reason: "superseded" });
  assert.deepEqual(decideCassoSettlement({
    payment: { ...candidate, status: "failed" }, receivedAmount: 150_000, now,
  }), { kind: "reconcile", reason: "non-settleable" });
  assert.deepEqual(decideCassoSettlement({
    payment: { ...candidate, createdAt: new Date("2026-08-12T10:00:00.000Z") },
    receivedAmount: 150_000,
    now,
  }), { kind: "reconcile", reason: "expired" });
  assert.deepEqual(decideCassoSettlement({ payment: candidate, receivedAmount: 149_999, now }), {
    kind: "reconcile",
    reason: "underpaid",
  });
  assert.deepEqual(decideCassoSettlement({
    payment: { ...candidate, status: "cancelled" }, receivedAmount: 150_000, now,
  }), { kind: "settle" });
});

test("manual reconciliation metadata contains identifiers and money only", () => {
  const metadata = cassoReconciliationMetadata({
    transactionId: 42,
    payment: candidate,
    receivedAmount: 149_999,
    reason: "underpaid",
  });
  assert.deepEqual(metadata, {
    transactionId: 42,
    paymentId: "payment-1",
    paymentCode: "CDABC123",
    localStatus: "pending",
    expectedAmount: 150_000,
    receivedAmount: 149_999,
    reason: "underpaid",
  });
  assert.doesNotMatch(JSON.stringify(metadata), /description|account|bank/i);
});
```

- [ ] **Step 2: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/payment-settlement.test.ts
```

Expected: FAIL vì module/quyết định chưa tồn tại.

- [ ] **Step 3: Viết helper thuần đầy đủ**

Tạo `src/lib/payment-settlement.ts`:

```ts
import { PAYMENT_PENDING_EXPIRES_MS } from "@/lib/payment";

export const SETTLEABLE_PAYMENT_STATUSES = ["pending", "cancelled"] as const;

export function isPaymentSettleable(status: string): boolean {
  return (SETTLEABLE_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export type CassoCandidate = {
  id: string;
  code: string;
  provider: string;
  status: string;
  amount: number;
  createdAt: Date;
};

export type CassoDecision =
  | { kind: "settle" }
  | { kind: "ignore"; reason: "duplicate-paid" | "unknown-code" }
  | {
      kind: "reconcile";
      reason: "superseded" | "expired" | "underpaid" | "non-settleable";
    };

export function decideCassoSettlement(input: {
  payment: CassoCandidate | null;
  receivedAmount: number;
  now: Date;
}): CassoDecision {
  const payment = input.payment;
  if (!payment || payment.provider !== "casso") {
    return { kind: "ignore", reason: "unknown-code" };
  }
  if (payment.status === "paid") return { kind: "ignore", reason: "duplicate-paid" };
  if (payment.status === "superseded") return { kind: "reconcile", reason: "superseded" };
  if (!isPaymentSettleable(payment.status)) {
    return { kind: "reconcile", reason: "non-settleable" };
  }
  if (input.now.getTime() >= payment.createdAt.getTime() + PAYMENT_PENDING_EXPIRES_MS) {
    return { kind: "reconcile", reason: "expired" };
  }
  if (input.receivedAmount < payment.amount) {
    return { kind: "reconcile", reason: "underpaid" };
  }
  return { kind: "settle" };
}

type ReconciliationReason = Extract<CassoDecision, { kind: "reconcile" }>["reason"];

export function cassoReconciliationMetadata(input: {
  transactionId: number | string | null;
  payment: CassoCandidate;
  receivedAmount: number;
  reason: ReconciliationReason;
}) {
  return {
    transactionId: input.transactionId,
    paymentId: input.payment.id,
    paymentCode: input.payment.code,
    localStatus: input.payment.status,
    expectedAmount: input.payment.amount,
    receivedAmount: input.receivedAmount,
    reason: input.reason,
  };
}
```

Helper không nhận description/nội dung chuyển khoản, số tài khoản hoặc payload raw nên caller không thể vô tình log chúng.

- [ ] **Step 4: Viết webhook E2E đang đỏ trước khi đổi route/service**

Ngoài hai test `superseded ... cannot activate`, thêm test Casso và payOS cho legacy voucher `cancelled` với amount đủ; cả hai phải chuyển payment thành `paid`, invitation thành `paid=1`. Thêm assertion status route trả nguyên chuỗi `superseded`:

```ts
test("legacy voucher-cancelled Casso payment still settles", async ({ request }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const payment = createPayment(invitation.id, {
    code: "CDCANCEL2",
    amount: 130_000,
    status: "cancelled",
    voucherCode: "LEGACY20",
  });
  try {
    const body = cassoBody(`thanh toan ${payment.code}`, 130_000);
    expect((await request.post(WEBHOOK_PATH, {
      headers: { "x-casso-signature": signCasso(body) },
      data: body,
    })).status()).toBe(200);
    expect(getPayment(payment.code)?.status).toBe("paid");
    expect(getInvitationPaid(invitation.id)).toBe(1);
  } finally {
    cleanupUser(user.id);
  }
});
```

PayOS test dùng `provider:"payos"`, `status:"cancelled"`, signed `orderCode`/amount tương ứng và cùng assertions. Với superseded payment, gọi `GET /api/payment/${code}/status` bằng user session và assert JSON `status === "superseded"`.

Chạy:

```bash
npx playwright test tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium --grep 'superseded|legacy voucher-cancelled'
```

Expected: legacy Casso `cancelled` FAIL vì route hiện prefilter `pending`; superseded tests/status characterization không được bỏ dù đã xanh ở baseline.

- [ ] **Step 5: Siết conditional claim chống race**

Trong `src/lib/payment-service.ts`, thay guard và conditional update:

```ts
if (
  !payment ||
  !isPaymentSettleable(payment.status) ||
  receivedAmount < payment.amount
) {
  return { updated: false };
}

const claimed = await db.payment.updateMany({
  where: {
    id: payment.id,
    status: { in: [...SETTLEABLE_PAYMENT_STATUSES] },
  },
  data: { status: "paid", paidAt: new Date() },
});
```

Điều kiện thứ hai là bắt buộc: nếu Admin đổi `pending → superseded` sau lần read nhưng trước lần update, `updateMany` phải trả count `0`. Giữ `cancelled` trong tập để không âm thầm thay đổi semantics voucher hiện tại; trạng thái mới `superseded` tuyệt đối không nằm trong tập.

**Hai superseded tests đầy đủ thuộc Step 4:**

Trong Casso suite thêm:

```ts
test("superseded payment cannot activate an invitation", async ({ request }) => {
  const user = createUser();
  try {
    const inv = createInvitation(user.id);
    const { code } = createPayment(inv.id, {
      code: "CDSUPER2",
      amount: 150_000,
      status: "superseded",
    });
    const body = cassoBody(`thanh toan ${code}`, 150_000);
    const response = await request.post(WEBHOOK_PATH, {
      headers: { "x-casso-signature": signCasso(body) },
      data: body,
    });
    expect(response.status()).toBe(200);
    expect(getPayment(code)?.status).toBe("superseded");
    expect(getInvitationPaid(inv.id)).toBe(0);
  } finally {
    cleanupUser(user.id);
  }
});
```

Trong payOS suite thêm test đầy đủ:

```ts
test("superseded payOS payment cannot activate an invitation", async ({ request }) => {
  const user = createUser();
  try {
    const invitation = createInvitation(user.id);
    const orderCode = 987_654_399;
    const { code } = createPayment(invitation.id, {
      code: "CDSUPER9",
      amount: 150_000,
      provider: "payos",
      providerOrderCode: String(orderCode),
      status: "superseded",
    });
    const data = webhookData(orderCode, 150_000);
    const response = await request.post(WEBHOOK_PATH, {
      data: {
        code: "00",
        desc: "success",
        success: true,
        data,
        signature: sign(data),
      },
    });

    expect(response.status()).toBe(200);
    expect(paymentStatus(code)).toBe("superseded");
    const row = getDb()
      .prepare("SELECT paid FROM Invitation WHERE id = ?")
      .get(invitation.id) as { paid: number };
    expect(row.paid).toBe(0);
  } finally {
    cleanupUser(user.id);
  }
});
```

- [ ] **Step 6: Cho Casso load theo code và xử lý đủ settle/ignore/reconcile**

Giữ validation JSON/signature và extraction `ORDER_CODE_REGEX`, nhưng query `findUnique({ where: { code } })` **không có status prefilter**. Sau đó gọi `decideCassoSettlement`. Với `ignore`, trả `{ success:true }`. Với `reconcile`, log đúng một event có metadata allowlist rồi không claim:

```ts
function logReconciliation(input: {
  transactionId: number | string | null;
  payment: CassoCandidate;
  receivedAmount: number;
  reason: Extract<CassoDecision, { kind: "reconcile" }>["reason"];
}): void {
  console.warn(
    "payment_manual_reconciliation_required",
    cassoReconciliationMetadata(input),
  );
}
```

Nhánh settle và race handling phải là:

```ts
const decision = decideCassoSettlement({ payment, receivedAmount: received, now: new Date() });
if (decision.kind === "reconcile" && payment) {
  logReconciliation({
    transactionId: tx?.id ?? null,
    payment,
    receivedAmount: received,
    reason: decision.reason,
  });
}
if (decision.kind === "settle" && payment) {
  const result = await markPaymentPaid(payment.id, received);
  if (result.updated) {
    if (result.slug) revalidatePath(`/thiep/${result.slug}`);
  } else {
    const latest = await prisma.payment.findUnique({ where: { id: payment.id } });
    const latestDecision = decideCassoSettlement({
      payment: latest,
      receivedAmount: received,
      now: new Date(),
    });
    if (latest && latestDecision.kind === "reconcile") {
      logReconciliation({
        transactionId: tx?.id ?? null,
        payment: latest,
        receivedAmount: received,
        reason: latestDecision.reason,
      });
    }
  }
}
return Response.json({ success: true });
```

Do đó Casso `pending` và legacy voucher `cancelled` amount đủ đều settle; `superseded`, expired, underpaid và terminal non-settleable có tiền đều tạo structured warning nhưng tuyệt đối không claim; duplicate paid và code/provider không thuộc Casso được ignore. Không log `description`, payload raw, account number hoặc bank text.

- [ ] **Step 7: Chặn tạo link payOS cho payment vừa bị supersede**

Trước hết, `reconcilePayosPayment` phải giữ nguyên local terminal status và chỉ hỏi/claim provider khi local status settleable:

```ts
export async function reconcilePayosPayment(payment: Payment): Promise<string> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) {
    return payment.status;
  }
  if (!isPaymentSettleable(payment.status)) return payment.status;

  const remote = await getPayosPaymentRequest(payment.providerOrderCode);
  const remoteStatus = remote.status.toUpperCase();
  if (remoteStatus === "PAID") {
    const result = await markPaymentPaid(
      payment.id,
      Math.max(remote.amountPaid ?? 0, remote.amount ?? 0),
    );
    if (result.updated) return "paid";
    return (await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).status;
  }
  if (remoteStatus === "CANCELLED") return "cancelled";
  return payment.status;
}
```

PayOS webhook vẫn query bằng `providerOrderCode` và gọi `markPaymentPaid`; không thêm `status:"pending"` prefilter. `markPaymentPaid` là nơi cho phép `pending/cancelled`. Nếu conditional claim thua race, re-read để phục vụ structured reconciliation/observability nhưng không update status; đặc biệt không map `superseded` thành `cancelled` hoặc `pending`.

Trong `ensurePayosPaymentRequest`, re-read payment trước provider call:

```ts
const current = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
if (current.status !== "pending") return current;
if (current.providerPaymentLinkId && current.providerCheckoutUrl) return current;
```

Sau khi nhận `PayosPaymentRequest`, ghi provider fields bằng conditional update:

```ts
const claimed = await prisma.payment.updateMany({
  where: { id: current.id, status: "pending" },
  data: payosFields(data),
});
if (claimed.count === 1) {
  return prisma.payment.findUniqueOrThrow({ where: { id: current.id } });
}

const latest = await prisma.payment.findUniqueOrThrow({ where: { id: current.id } });
if (latest.status === "superseded") {
  await cancelPayosPaymentRequest(
    current.providerOrderCode,
    "admin_price_changed",
  ).catch((error: unknown) => {
    console.error("Không thể hủy link payOS vừa bị supersede", {
      paymentId: current.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  });
}
return latest;
```

Trong `createOrGetPayment`, sau `preparePayment`, nếu returned payment không còn `pending`, return `{ kind: "price-changed" }`. Bổ sung nhánh này vào `CheckoutPreparation` và payment page render cùng copy/nút reload với trạng thái superseded. Không trả QR/link từ payment đã mất hiệu lực.

Contract public sau Task 4 là:

```ts
export type CheckoutPreparation =
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "price-changed" }
  | { kind: "payment"; payment: PaymentInfo };
```

Sau `preparePayment`, chỉ `prepared.status === "pending"` được chuyển thành `PaymentInfo`; mọi status khác trả `price-changed`. Nhánh page dùng cùng `paymentActivation.priceChanged`, `priceChangedDescription`, `reload` và tuyệt đối không render QR/provider URL.

- [ ] **Step 8: Trả trạng thái superseded cho polling và UI**

Status route đã trả `payment.status` ở cuối; giữ `superseded` nguyên trạng. Trong `PaymentPanel`, thay boolean expired đơn bằng state:

```ts
type PaymentTerminalState = "active" | "paid" | "expired" | "superseded";
```

Khi poll nhận `superseded`, dừng interval và render card có copy `paymentActivation.priceChanged` cùng nút `router.refresh()` để lấy giá mới. Không phát event `purchase`.

- [ ] **Step 9: Chạy toàn bộ unit/payment regression**

```bash
npx tsx --test src/lib/payment-settlement.test.ts
npm run typecheck
npx playwright test tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium
```

Expected: unit/typecheck và toàn bộ Casso/payOS tests PASS, gồm pending, legacy cancelled settlement, structured reconciliation decision, exact superseded polling/status và superseded rejection.

- [ ] **Step 10: Commit settlement hardening**

```bash
git add src/lib/payment-settlement.ts src/lib/payment-settlement.test.ts src/lib/payment-service.ts src/app/api/casso/webhook/route.ts src/app/api/payos/webhook/route.ts 'src/app/api/payment/[code]/status/route.ts' 'src/app/dashboard/[id]/thanh-toan/actions.ts' 'src/app/dashboard/[id]/thanh-toan/page.tsx' 'src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx' tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts
git commit -m "fix(payment): reject superseded payment settlements"
```

---

### Task 5: Tạo audit, input và editor-diff primitives

**Files:**
- Create: `src/lib/admin-audit.ts`
- Create: `src/lib/admin-audit.test.ts`
- Create: `src/lib/invitation-editor-audit.ts`
- Create: `src/lib/invitation-editor-audit.test.ts`
- Create: `src/lib/admin-support-input.ts`
- Create: `src/lib/admin-support-input.test.ts`
- Modify: `src/lib/admin-dal.ts`
- Modify: `src/lib/payment-service.ts`

- [ ] **Step 1: Viết audit unit tests đang đỏ**

Tạo `src/lib/admin-audit.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_AUDIT_ACTIONS,
  serializeAuditDetails,
} from "./admin-audit";

test("audit action names are stable", () => {
  assert.equal(ADMIN_AUDIT_ACTIONS.invitationCreated, "INVITATION_CREATED_FOR_USER");
  assert.equal(ADMIN_AUDIT_ACTIONS.complimentaryGranted, "COMPLIMENTARY_GRANTED");
  assert.equal(ADMIN_AUDIT_ACTIONS.priceOverrideCleared, "PRICE_OVERRIDE_CLEARED");
});

test("audit details serialize only the supplied safe metadata", () => {
  const serialized = serializeAuditDetails({
    before: { adminPriceOverride: null, complimentary: false },
    after: { adminPriceOverride: 0, complimentary: true },
    supersededPaymentCount: 2,
  });
  assert.deepEqual(JSON.parse(serialized), {
    before: { adminPriceOverride: null, complimentary: false },
    after: { adminPriceOverride: 0, complimentary: true },
    supersededPaymentCount: 2,
  });
  assert.doesNotMatch(serialized, /password|session|accountNumber/i);
});

```

Tạo riêng `src/lib/invitation-editor-audit.test.ts`. Test dùng một raw Prisma-shaped input có `id`/foreign key, quan hệ đảo thứ tự nhưng có `sortOrder`, `null` scalar và không có `CeremonyItem`; submitted input dùng `persistedData + ceremonies + schedule + gallery` như `PreparedInvitationDraft`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { diffInvitationEditorAudit } from "./invitation-editor-audit";

test("raw Prisma data and logically identical submitted data normalize equally", () => {
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({
      content: { brideFullName: null, ceremonyType: "thanh-hon", ceremonyHeader: null },
      ceremonies: [],
      schedule: [
        { id: "s2", invitationId: "i1", time: "18:00", label: "Đón khách", sortOrder: 1 },
        { id: "s1", invitationId: "i1", time: "17:00", label: "Khai tiệc", sortOrder: 0 },
      ],
    }),
    submittedSnapshot({
      persistedData: {
        brideFullName: "",
        ceremonyType: "thanh-hon",
        ceremonyHeader: "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA",
        ceremonyDate: "",
        ceremonyTime: "",
      },
      ceremonies: [{
        title: "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA",
        date: "",
        time: "",
      }],
      schedule: [
        { time: "17:00", label: "Khai tiệc" },
        { time: "18:00", label: "Đón khách" },
      ],
      gallery: [],
    }),
  );
  assert.deepEqual(diff, { changedGroups: [], changedFields: [] });
});

test("real scalar and ordered relation changes return deterministic names", () => {
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({
      content: { brideFullName: "Mai", address: "Địa chỉ cũ" },
      ceremonies: [{ title: "Lễ cũ", date: "2026-12-20", time: "09:00", sortOrder: 0 }],
    }),
    submittedSnapshot({
      persistedData: { brideFullName: "Lan", address: "Địa chỉ mới" },
      ceremonies: [{ title: "Lễ mới", date: "2026-12-20", time: "09:00" }],
    }),
  );
  assert.deepEqual(diff, {
    changedGroups: ["couple", "event", "venue"],
    changedFields: ["brideFullName", "ceremonies", "address"],
  });
});

test("bank changes expose the field name but never the account value", () => {
  const secret = "012345678901";
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({ content: { brideAccountNumber: "old" } }),
    submittedSnapshot({ persistedData: { brideAccountNumber: secret } }),
  );
  assert.deepEqual(diff, {
    changedGroups: ["gift"],
    changedFields: ["brideAccountNumber"],
  });
  assert.doesNotMatch(JSON.stringify(diff), new RegExp(secret));
});
```

Trong file test, `prismaSnapshot` và `submittedSnapshot` là fixture builders typed, có default đầy đủ cho `templateId`, `content`, `ceremonies`, `schedule`, `gallery`; không dùng `as any`.

- [ ] **Step 2: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/admin-audit.test.ts src/lib/invitation-editor-audit.test.ts
```

Expected: FAIL vì hai module chưa tồn tại.

- [ ] **Step 3: Viết audit primitives**

Tạo `src/lib/admin-audit.ts`:

```ts
import type { Prisma } from "@/generated/prisma/client";

export const ADMIN_AUDIT_ACTIONS = {
  invitationCreated: "INVITATION_CREATED_FOR_USER",
  invitationUpdated: "INVITATION_UPDATED_BY_ADMIN",
  invitationPublished: "INVITATION_PUBLISHED_BY_ADMIN",
  priceOverrideSet: "PRICE_OVERRIDE_SET",
  priceOverrideCleared: "PRICE_OVERRIDE_CLEARED",
  complimentaryGranted: "COMPLIMENTARY_GRANTED",
  complimentaryRevoked: "COMPLIMENTARY_REVOKED",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

type AuditJson =
  | string
  | number
  | boolean
  | null
  | AuditJson[]
  | { [key: string]: AuditJson };

export function serializeAuditDetails(details: Record<string, AuditJson>): string {
  return JSON.stringify(details);
}

export async function writeAdminAudit(
  db: Prisma.TransactionClient,
  input: {
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    targetUserEmail: string | null;
    invitationId: string;
    action: AdminAuditAction;
    details?: Record<string, AuditJson>;
  },
): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      targetUserId: input.targetUserId,
      targetUserEmail: input.targetUserEmail,
      invitationId: input.invitationId,
      action: input.action,
      details: input.details ? serializeAuditDetails(input.details) : null,
    },
  });
}
```

Không đặt logic editor diff trong `admin-audit.ts`. Tạo `src/lib/invitation-editor-audit.ts` là module thuần, export contract:

```ts
export type EditorAuditGroup =
  | "appearance"
  | "couple"
  | "event"
  | "family"
  | "venue"
  | "gift"
  | "media";

export type EditorAuditField =
  | keyof z.infer<typeof contentSchema>
  | "ceremonies"
  | "schedule"
  | "gallery";

export type InvitationEditorAuditDiff = {
  changedGroups: EditorAuditGroup[];
  changedFields: EditorAuditField[];
};

export function diffInvitationEditorAudit(
  before: InvitationEditorAuditInput,
  after: InvitationEditorAuditInput,
): InvitationEditorAuditDiff;
```

`InvitationEditorAuditInput` là discriminated union để caller không ghép shape mơ hồ:

```ts
type StoredRelation<T> = T & { id?: string; invitationId?: string; sortOrder: number };

export type InvitationEditorAuditInput =
  | {
      source: "prisma";
      templateId: string;
      content: Partial<Record<keyof z.infer<typeof contentSchema>, unknown>> | null;
      ceremonies: StoredRelation<{ title: string; date: string; time: string }>[];
      schedule: StoredRelation<{ time: string; label: string }>[];
      gallery: StoredRelation<{ url: string }>[];
    }
  | {
      source: "submitted";
      persistedData: z.infer<typeof contentSchema>;
      ceremonies: { title: string; date: string; time: string }[];
      schedule: { time: string; label: string }[];
      gallery: string[];
    };
```

Implementation phải canonicalize theo thuật toán cụ thể:

1. Với `source:"prisma"`, tạo object `{ templateId, ...content }`; đổi mọi scalar `null` thành `undefined`, rồi parse qua `contentSchema` để áp đúng editor defaults/transform. Với `source:"submitted"`, parse lại `persistedData` qua cùng schema.
2. Stored `ceremonies`, `schedule`, `gallery` được stable-sort theo `(sortOrder, originalIndex)` rồi map chỉ các field business; bỏ `id`, `invitationId`, timestamps và foreign keys. Submitted arrays giữ nguyên thứ tự. Gallery canonical luôn là `string[]` URL.
3. Nếu canonical ceremonies rỗng, hydrate đúng row EditorForm hiện hành: `{ title: parsed.ceremonyHeader || defaultCeremonyMessage(parsed.ceremonyType), date: parsed.ceremonyDate, time: parsed.ceremonyTime }`. Cả raw legacy record và submitted row vì vậy so sánh cùng semantics.
4. Không sort arrays theo nội dung: đổi thứ tự ceremony/schedule/gallery là thay đổi có nghĩa.
5. So sánh `EDITOR_AUDIT_FIELDS` theo thứ tự tuple cố định: các scalar theo thứ tự `contentSchema`, chèn `ceremonies` ngay sau các ceremony scalar, `schedule` sau event fields, `gallery` cuối media. `changedFields` giữ thứ tự này.
6. Map field sang `EDITOR_AUDIT_GROUPS`, rồi trả `changedGroups` theo thứ tự cố định `appearance, couple, event, family, venue, gift, media`; không return bất kỳ before/after value nào.

Để expected ở test trên chính xác, tuple phải đặt `brideFullName` trước `ceremonies`, và `ceremonies` trước `address`. Support audit chỉ serialize `changedFields`/`changedGroups` cùng allowlist `templateId`, `status`, `slug`; không serialize canonical snapshots.

- [ ] **Step 4: Viết validation helper dùng chung cho action và page**

Trước tiên tạo `src/lib/admin-support-input.test.ts`, rồi chạy để xác nhận đỏ:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
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
```

Run:

```bash
npx tsx --test src/lib/admin-support-input.test.ts
```

Expected: FAIL vì module `admin-support-input` chưa tồn tại.

Tạo `src/lib/admin-support-input.ts`:

```ts
import { completedTemplateSlugs } from "@/data/chungdoi";

export const SYSTEM_EMAIL = "system@demo.local";

export function parseUserSearch(value: string | undefined): string {
  return value?.trim().toLowerCase().slice(0, 120) ?? "";
}

export function isAllowedCustomerEmail(email: string | null): boolean {
  return email !== SYSTEM_EMAIL;
}

export function parseAdminTemplateId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !completedTemplateSlugs.has(value)) return null;
  return value;
}
```

Chạy:

```bash
npx tsx --test src/lib/admin-support-input.test.ts
```

Expected: 3 tests PASS sau khi implementation tồn tại.

- [ ] **Step 5: Trả email actor từ `verifyAdmin`**

Đổi signature trong `src/lib/admin-dal.ts`:

```ts
export async function verifyAdmin(): Promise<{
  adminId: string;
  adminEmail: string;
}> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return { adminId: admin.id, adminEmail: admin.email };
}
```

Đây là thay đổi additive; các caller hiện chỉ destructure `adminId` hoặc bỏ qua return nên không cần nới quyền.

- [ ] **Step 6: Cho `cancelPayosPayment` nhận lý do cụ thể**

Đổi signature:

```ts
export async function cancelPayosPayment(
  payment: Payment,
  reason = "voucher_changed",
): Promise<void> {
  if (payment.provider !== "payos" || !payment.providerOrderCode) return;
  try {
    await cancelPayosPaymentRequest(payment.providerOrderCode, reason);
  } catch (error) {
    console.error("Không thể hủy link payOS cũ", {
      paymentId: payment.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
```

- [ ] **Step 7: Chạy unit và typecheck**

```bash
npx tsx --test src/lib/admin-audit.test.ts src/lib/invitation-editor-audit.test.ts src/lib/admin-support-input.test.ts
npm run typecheck
```

Expected: audit tests PASS; typecheck exit 0.

- [ ] **Step 8: Commit primitive slice**

```bash
git add src/lib/admin-audit.ts src/lib/admin-audit.test.ts src/lib/invitation-editor-audit.ts src/lib/invitation-editor-audit.test.ts src/lib/admin-support-input.ts src/lib/admin-support-input.test.ts src/lib/admin-dal.ts src/lib/payment-service.ts
git commit -m "feat(admin): add support audit primitives"
```

---

### Task 6: Thêm i18n contract cho Admin support và activation

**Files:**
- Create: `src/lib/admin-support-copy.test.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Viết catalog shape test đang đỏ**

Tạo `src/lib/admin-support-copy.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import ko from "../../messages/ko.json";
import vi from "../../messages/vi.json";
import zh from "../../messages/zh.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("admin support copy has the same shape in every locale", () => {
  const expected = keyPaths(vi.adminSupport).sort();
  for (const catalog of [en, ko, ja, zh]) {
    assert.deepEqual(keyPaths(catalog.adminSupport).sort(), expected);
  }
});

test("activation copy exists for dashboard, payment and editor", () => {
  for (const catalog of [vi, en, ko, ja, zh]) {
  assert.equal(typeof catalog.dashboardActivation.complimentary, "string");
  assert.equal(typeof catalog.paymentActivation.priceChanged, "string");
  assert.equal(typeof catalog.paymentActivation.errors.customPriceVoucherBlocked, "string");
  assert.equal(typeof catalog.editor.support.banner, "string");
  assert.equal(typeof catalog.editor.errors.invitationNotFound, "string");
  assert.equal(typeof catalog.adminSupport.errors.invalidPrice, "string");
  }
});
```

- [ ] **Step 2: Chạy test để xác nhận đỏ**

```bash
npx tsx --test src/lib/admin-support-copy.test.ts
```

Expected: FAIL vì `adminSupport`/activation keys chưa tồn tại.

- [ ] **Step 3: Thêm namespace tiếng Việt đầy đủ**

Thêm object sau vào `messages/vi.json`:

```json
"adminSupport": {
  "usersTitle": "Người dùng ({count})",
  "searchLabel": "Tìm theo email",
  "searchPlaceholder": "nhap@email.com",
  "searchButton": "Tìm",
  "clearSearch": "Xóa tìm kiếm",
  "noUsers": "Chưa có người dùng nào.",
  "noSearchResults": "Không tìm thấy người dùng phù hợp.",
  "registeredAt": "Ngày đăng ký",
  "invitationCount": "Số thiệp",
  "backToUsers": "Danh sách người dùng",
  "userFallback": "Người dùng chưa có email",
  "createInvitation": "Tạo thiệp mới",
  "chooseTemplate": "Chọn mẫu thiệp cho khách",
  "close": "Đóng",
  "invitationsTitle": "Thiệp của người dùng",
  "noInvitations": "Người dùng chưa có thiệp nào.",
  "coupleFallback": "Thiệp {id}",
  "template": "Mẫu",
  "status": "Trạng thái",
  "activation": "Kích hoạt",
  "effectivePrice": "Giá hiệu lực",
  "updatedAt": "Cập nhật",
  "actions": "Thao tác",
  "draft": "Bản nháp",
  "published": "Đã xuất bản",
  "view": "Xem thiệp",
  "preview": "Xem trước",
  "edit": "Chỉnh sửa",
  "setPrice": "Đặt giá",
  "systemPrice": "Giá hệ thống",
  "customPrice": "Giá Admin đặt",
  "paid": "Đã thanh toán",
  "complimentary": "Được tặng miễn phí",
  "trial": "Dùng thử / chưa thanh toán",
  "priceDialogTitle": "Đặt giá cuối cùng",
  "priceDialogDescription": "Giá này áp dụng riêng cho thiệp và không cộng thêm voucher.",
  "finalPriceLabel": "Giá cuối cùng (VND)",
  "freeHint": "Nhập 0 để tặng miễn phí và kích hoạt thiệp ngay.",
  "savePrice": "Lưu giá",
  "saving": "Đang lưu...",
  "resetPrice": "Dùng lại giá hệ thống",
  "confirmFree": "Xác nhận tặng miễn phí cho thiệp này?",
  "confirmResetFree": "Thiệp sẽ mất quyền miễn phí và quay lại dùng thử hoặc hết hạn. Tiếp tục?",
  "paidPriceLocked": "Thiệp đã thanh toán nên không thể đổi giá.",
  "priceSaved": "Đã cập nhật giá thiệp.",
  "auditTitle": "Lịch sử hỗ trợ",
  "noAudit": "Chưa có thao tác hỗ trợ nào.",
  "auditActor": "{admin} lúc {time}",
  "audit": {
    "INVITATION_CREATED_FOR_USER": "Đã tạo thiệp cho người dùng",
    "INVITATION_UPDATED_BY_ADMIN": "Đã chỉnh sửa thiệp",
    "INVITATION_PUBLISHED_BY_ADMIN": "Đã xuất bản thiệp",
    "PRICE_OVERRIDE_SET": "Đã đặt giá riêng cho thiệp",
    "PRICE_OVERRIDE_CLEARED": "Đã đưa thiệp về giá hệ thống",
    "COMPLIMENTARY_GRANTED": "Đã tặng miễn phí thiệp",
    "COMPLIMENTARY_REVOKED": "Đã thu hồi quyền miễn phí"
  },
  "errors": {
    "invalidTemplate": "Mẫu thiệp không hợp lệ.",
    "userNotFound": "Không tìm thấy người dùng.",
    "invitationNotFound": "Không tìm thấy thiệp.",
    "invalidPrice": "Giá cuối cùng phải là số nguyên từ 0 đến 100.000.000đ.",
    "paidPriceLocked": "Thiệp đã thanh toán nên không thể đổi giá.",
    "concurrentChange": "Thiệp vừa thay đổi, vui lòng tải lại.",
    "customPriceVoucherBlocked": "Thiệp đã có giá ưu đãi riêng."
  }
}
```

Thêm các nhóm con:

```json
"dashboardActivation": {
  "paid": "Đã thanh toán",
  "complimentary": "Được tặng miễn phí"
},
"paymentActivation": {
  "paidTitle": "Đã thanh toán",
  "paidDescription": "Thiệp này đã được kích hoạt vĩnh viễn.",
  "complimentaryTitle": "Được tặng miễn phí",
  "complimentaryDescription": "Thiệp này đã được Admin kích hoạt miễn phí.",
  "priceChanged": "Giá thiệp vừa được cập nhật",
  "priceChangedDescription": "Mã thanh toán cũ không còn hiệu lực. Hãy tải lại để nhận đúng giá mới.",
  "reload": "Tải lại giá mới",
  "errors": {
    "voucherRequired": "Nhập mã giảm giá.",
    "paymentNotFound": "Không tìm thấy đơn.",
    "forbidden": "Không có quyền thao tác đơn này.",
    "paymentProcessed": "Đơn đã được xử lý.",
    "voucherAlreadyApplied": "Đơn đã áp mã giảm giá.",
    "paymentExpired": "Đơn đã hết hạn, tải lại trang để lấy mã mới.",
    "voucherInvalid": "Mã không hợp lệ.",
    "voucherExpired": "Mã đã hết hạn.",
    "voucherExhausted": "Mã đã hết lượt dùng.",
    "paymentProviderFailed": "Không thể tạo mã thanh toán mới, vui lòng thử lại.",
    "customPriceVoucherBlocked": "Thiệp đã có giá ưu đãi riêng."
  }
},
"editor": {
  "support": {
    "banner": "Đang hỗ trợ tài khoản {email}",
    "bannerDescription": "Mọi thay đổi đã lưu sẽ tác động trực tiếp tới thiệp của khách.",
    "back": "Quay lại hồ sơ người dùng",
    "complimentary": "Thiệp được tặng miễn phí và đã kích hoạt vĩnh viễn."
  },
  "errors": {
    "invalidData": "Dữ liệu không hợp lệ.",
    "invitationNotFound": "Không tìm thấy thiệp.",
    "slugMissing": "Chưa nhập đường dẫn.",
    "slugMalformed": "Chỉ dùng chữ thường, số và dấu gạch ngang.",
    "slugTaken": "Đường dẫn đã được dùng.",
    "coupleRequired": "Cần tên cô dâu và chú rể trước khi xuất bản.",
    "dateRequired": "Cần ngày cưới trước khi xuất bản.",
    "timeRequired": "Cần giờ tiệc cưới trước khi xuất bản."
  }
}
```

Khi merge `editor.support`, giữ nguyên toàn bộ keys `editor` hiện có. `dashboardActivation` và `paymentActivation` là namespace top-level mới để không tạo object cha rỗng/khó type trong catalog hiện tại.

- [ ] **Step 4: Thêm cùng key shape vào bốn catalog còn lại**

Dùng bản dịch tự nhiên, không đổi placeholder `{count}`, `{id}`, `{admin}`, `{time}`, `{email}`. Các tiêu đề chính xác:

```text
en: Users; Create new invitation; Complimentary; Support history; Editing for {email}
ko: 사용자; 새 청첩장 만들기; 무료 제공; 지원 기록; {email} 계정 지원 중
ja: ユーザー; 招待状を新規作成; 無料提供; サポート履歴; {email} をサポート中
zh: 用户; 新建请柬; 免费赠送; 支持记录; 正在协助 {email}
```

Mỗi catalog phải chứa toàn bộ keys đã liệt kê trong object tiếng Việt; không dùng một namespace rỗng hoặc fallback runtime.

- [ ] **Step 5: Chạy copy contract và JSON parse**

```bash
npx tsx --test src/lib/admin-support-copy.test.ts
node -e 'for (const f of ["vi","en","ko","ja","zh"]) JSON.parse(require("node:fs").readFileSync(`messages/${f}.json`, "utf8"))'
```

Expected: test PASS, JSON parse exit 0.

- [ ] **Step 6: Cung cấp message cho các client component**

Trong `src/app/admin/layout.tsx`, import `NextIntlClientProvider` và `viMessages`, rồi bọc header/main bằng:

```tsx
<NextIntlClientProvider
  locale="vi"
  messages={{
    adminSupport: viMessages.adminSupport,
    editor: { support: viMessages.editor.support },
  }}
>
  {/* header và main hiện có */}
</NextIntlClientProvider>
```

Trong `src/app/dashboard/layout.tsx`, mở rộng provider hiện có:

```tsx
messages={{
  chrome: viMessages.chrome,
  trialCountdown: viMessages.trialCountdown,
  dashboardActivation: viMessages.dashboardActivation,
  paymentActivation: viMessages.paymentActivation,
}}
```

Support editor page ở Task 9 có provider riêng và phải truyền cả `editor: viMessages.editor`; không dựa vào Admin layout vì route editor support vẫn nằm trong `/admin` nhưng page chủ động truyền message cho `EditorForm` client boundary.

- [ ] **Step 7: Commit i18n slice**

```bash
git add src/lib/admin-support-copy.test.ts src/app/admin/layout.tsx src/app/dashboard/layout.tsx messages/vi.json messages/en.json messages/ko.json messages/ja.json messages/zh.json
git commit -m "feat(i18n): add admin invitation support copy"
```

---

### Task 7: Xây trang hồ sơ người dùng, tạo thiệp và đặt giá

**Files:**
- Create: `src/app/admin/users/[id]/actions.ts`
- Create: `src/app/admin/users/[id]/page.tsx`
- Create: `src/app/admin/users/[id]/AdminCreateInvitationButton.tsx`
- Create: `src/app/admin/users/[id]/InvitationPriceDialog.tsx`
- Create: `tests/e2e/admin-invitation-support.spec.ts`
- Modify: `src/app/admin/users/page.tsx`
- Modify: `tests/e2e/helpers/fixtures.ts`

- [ ] **Step 1: Viết E2E list/detail permission tests đang đỏ**

Tạo `tests/e2e/admin-invitation-support.spec.ts` với helpers `seededAdminId`, `seedAdmin(false)` và cleanup theo pattern của `tests/e2e/admin.spec.ts`. Thêm ba test đầu:

```ts
test("non-super admin can search users and open a support profile", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  try {
    createInvitation(user.id);
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users?q=${encodeURIComponent(user.email)}`);
    await page.getByRole("link", { name: user.email }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/users/${user.id}$`));
    await expect(page.getByRole("heading", { name: user.email })).toBeVisible();
    await expect(page.getByText("Thiệp của người dùng")).toBeVisible();
  } finally {
    getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
      .run(user.id, user.email);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});

test("user session cannot open an admin support profile", async ({ page, context }) => {
  const user = createUser();
  try {
    await loginAsUser(context, user.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.waitForURL("**/admin/login");
  } finally {
    cleanupUser(user.id);
  }
});

test("system user is not exposed by the admin customer list", async ({ page, context }) => {
  await loginAsAdmin(context, seededAdminId());
  await page.goto("/admin/users?q=system%40demo.local");
  await expect(page.getByText("system@demo.local")).toHaveCount(0);
});
```

Trước khi có page/action implementation, thêm toàn bộ mutation/security cases sau vào cùng file. Bốn test golden create/final-price/free/invalid-price có test bodies đầy đủ trong khối “Test bodies bổ sung của Step 1” bên dưới; chúng cũng phải được ghi vào file trước lần chạy Step 2, không trì hoãn tới sau UI:

```ts
test("unauthenticated direct create submission changes nothing", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  const before = invitationCountFor(user.id);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Tạo thiệp mới" }).click();
    await context.clearCookies();
    await page.locator('button[data-template-id="song-hy-red"]').click();
    await page.waitForURL("**/admin/login");
    expect(invitationCountFor(user.id)).toBe(before);
    expect(auditCountForUser(user.id)).toBe(0);
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});

test("unauthenticated direct price submission changes nothing", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  const invitation = createInvitation(user.id);
  const payment = createPayment(invitation.id, { status: "pending" });
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await context.clearCookies();
    await page.getByRole("button", { name: "Lưu giá" }).click();
    await page.waitForURL("**/admin/login");
    expect(invitationPriceState(invitation.id)).toEqual({
      adminPriceOverride: null,
      complimentary: 0,
    });
    expect(paymentStatusById(payment.id)).toBe("pending");
    expect(auditCountForInvitation(invitation.id)).toBe(0);
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});

test("route-bound user prevents cross-profile invitation price mutation", async ({ page, context }) => {
  const userA = createUser();
  const userB = createUser();
  const invitationA = createInvitation(userA.id);
  const invitationB = createInvitation(userB.id);
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${userA.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.locator('input[name="invitationId"]').evaluate((input, id) => {
      (input as HTMLInputElement).value = id;
    }, invitationB.id);
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await page.getByRole("button", { name: "Lưu giá" }).click();
    await expect(page.getByText("Không tìm thấy thiệp.")).toBeVisible();
    expect(invitationPriceState(invitationA.id).adminPriceOverride).toBeNull();
    expect(invitationPriceState(invitationB.id).adminPriceOverride).toBeNull();
    expect(auditCountForInvitation(invitationA.id)).toBe(0);
    expect(auditCountForInvitation(invitationB.id)).toBe(0);
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(userA.id);
    cleanupUser(userB.id);
  }
});

test("a payment race locks direct price mutation", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const payment = createPayment(invitation.id, { status: "pending" });
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    getDb().prepare("UPDATE Invitation SET paid = 1, updatedAt = ? WHERE id = ?")
      .run(prismaNow(), invitation.id);
    await page.getByRole("button", { name: "Lưu giá" }).click();
    await expect(page.getByText("Thiệp đã thanh toán nên không thể đổi giá.")).toBeVisible();
    expect(invitationPriceState(invitation.id).adminPriceOverride).toBeNull();
    expect(paymentStatusById(payment.id)).toBe("pending");
    expect(auditCountForInvitation(invitation.id)).toBe(0);
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});

test("direct price action rejects an already-paid invitation without side effects", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id, { paid: true });
  const paid = createPayment(invitation.id, { status: "paid", amount: 150_000 });
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    const form = page.locator(`form[data-price-invitation-id="${invitation.id}"]`);
    await form.locator('input[name="finalPrice"]').evaluate((input) => {
      const element = input as HTMLInputElement;
      element.disabled = false;
      element.value = "79000";
    });
    await form.locator('button[type="submit"]').evaluate((button) => {
      (button as HTMLButtonElement).disabled = false;
    });
    await form.locator('button[type="submit"]').click();
    await expect(page.getByText("Thiệp đã thanh toán nên không thể đổi giá.")).toBeVisible();
    expect(invitationPriceState(invitation.id)).toEqual({
      adminPriceOverride: null,
      complimentary: 0,
    });
    expect(paymentStatusById(paid.id)).toBe("paid");
    expect(auditCountForInvitation(invitation.id)).toBe(0);
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm và export các SQL helpers typed được gọi ở trên trong `tests/e2e/helpers/fixtures.ts`; mỗi helper chỉ SELECT/COUNT, không tự mutation ngoài fixture seed. Cũng thêm từ đầu các test mang tên chính xác: `non-super admin creates an invitation for the selected user with an audit log`, `admin final price supersedes pending payment and records the actor`, `admin grants complimentary access without creating revenue`, và hai cases `invalid admin price ... changes nothing`. Các test này assert DB, payment và audit đúng như test bodies bên dưới; tất cả đều tồn tại trước lần chạy đỏ ở Step 2.

- [ ] **Step 2: Chạy tests để xác nhận đỏ**

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'search users|cannot open|system user|creates an invitation|final price|complimentary|invalid admin price|unauthenticated direct|cross-profile|payment race|already-paid'
```

Expected: list/detail và mọi create/price mutation test FAIL vì route/action/UI chưa tồn tại. Ghi lại output đỏ trước Step 3.

- [ ] **Step 3: Nâng `/admin/users` với search params Promise**

Đổi page signature và query:

```ts
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await verifyAdmin();
  const { q } = await searchParams;
  const search = parseUserSearch(q);
  const t = await getTranslations("adminSupport");

  const users = await prisma.user.findMany({
    where: {
      NOT: { email: SYSTEM_EMAIL },
      ...(search ? { email: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: { select: { invitations: true } },
    },
  });
```

Render GET form có `name="q"`, và email bằng:

```tsx
<Link href={`/admin/users/${user.id}`} className="font-medium text-primary hover:underline">
  {user.email ?? t("userFallback")}
</Link>
```

`NOT: { email: SYSTEM_EMAIL }` là cố ý: nó giữ user `email = null` trong danh sách. Không dùng `email: { not: SYSTEM_EMAIL }` vì semantics null của Prisma/SQL có thể loại luôn user ẩn danh.

- [ ] **Step 4: Xây profile page server-side**

Page động phải:

```ts
export default async function AdminUserSupportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdmin();
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, NOT: { email: SYSTEM_EMAIL } },
    include: {
      invitations: {
        where: { isDemo: false },
        orderBy: { updatedAt: "desc" },
        include: {
          content: { select: { brideFullName: true, groomFullName: true } },
        },
      },
      adminAuditLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!user) notFound();
```

Load `getPaymentPrices()`, paid payment count của user và template labels song song. Tính system price một lần bằng `resolveSystemInvitationPrice`; với mỗi invitation, giá hiệu lực là `resolveEffectiveInvitationPrice(inv.adminPriceOverride, systemPrice)`. Render profile header, invitation table/card responsive, create button, price dialog và tối đa 50 audit rows. Ở slice này audit chỉ hiện action code, admin email và thời gian; Task 10 mới thêm parser metadata allowlist.

- [ ] **Step 5: Viết template picker Admin**

`AdminCreateInvitationButton` là client component nhận:

```ts
type Props = {
  userId: string;
  templateLabels: Record<string, string>;
};
```

Nó dùng `completedTemplates`, `templatePreviewUrl`, `templateLabel`, `useActionState` và action bind:

```tsx
const [state, formAction, pending] = useActionState(
  createInvitationForUser.bind(null, userId),
  undefined,
);

<form action={formAction}>
  <input type="hidden" name="templateId" value={template.slug} />
  <button type="submit" data-template-id={template.slug} disabled={pending}>
    <Image src={templatePreviewUrl(template.slug)} alt="" width={240} height={320} />
    <span>{templateLabel(template.slug, templateLabels)}</span>
  </button>
</form>
```

Nếu `state?.ok === false`, render `t(`errors.${state.errorCode}`)`. Dialog đóng khi click backdrop/Close; mọi label lấy từ `useTranslations("adminSupport")`.

- [ ] **Step 6: Viết price dialog với confirm miễn phí/reset**

Component nhận:

```ts
type Props = {
  userId: string;
  invitationId: string;
  systemPrice: number;
  currentOverride: number | null;
  complimentary: boolean;
  paid: boolean;
};
```

Dùng `useActionState(updateInvitationPrice.bind(null, userId), undefined)` và thêm `userId` vào `Props`. Form set gửi `mode=set`, `invitationId`, `finalPrice`; form reset gửi `mode=reset`, `invitationId`. `onSubmit` phải gọi `window.confirm(t("confirmFree"))` khi chuỗi input đã trim bằng `"0"`; reset complimentary gọi `window.confirm(t("confirmResetFree"))`. Khi state `ok`, hiển thị `priceSaved` và `router.refresh()`. Với `paid`, không render input/action, chỉ render `paidPriceLocked`.

**Test bodies bổ sung của Step 1 (phải được thêm trước lần chạy đỏ ở Step 2):**

Thêm tests:

```ts
test("non-super admin creates an invitation for the selected user with an audit log", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Tạo thiệp mới" }).click();
    await page.locator('button[data-template-id="song-hy-red"]').click();
    await expect(page).toHaveURL(/\/admin\/invitations\/[^/]+\/edit$/);
    const invitation = getDb()
      .prepare("SELECT id, userId, templateId FROM Invitation WHERE userId = ? ORDER BY createdAt DESC")
      .get(user.id) as { id: string; userId: string; templateId: string };
    expect(invitation.userId).toBe(user.id);
    expect(invitation.templateId).toBe("song-hy-red");
    const audit = getDb()
      .prepare("SELECT adminId, action FROM AdminAuditLog WHERE invitationId = ?")
      .get(invitation.id) as { adminId: string; action: string };
    expect(audit).toEqual({ adminId: admin.id, action: "INVITATION_CREATED_FOR_USER" });
  } finally {
    getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
      .run(user.id, user.email);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm price test hoàn chỉnh:

```ts
test("admin final price supersedes pending payment and records the actor", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  const invitation = createInvitation(user.id);
  const oldPayment = createPayment(invitation.id, { status: "pending", amount: 150_000 });
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await page.getByRole("button", { name: "Lưu giá" }).click();

    await expect.poll(() => getInvitation(invitation.id).adminPriceOverride).toBe(79_000);
    const payment = getDb().prepare("SELECT status FROM Payment WHERE id = ?").get(oldPayment.id) as {
      status: string;
    };
    expect(payment.status).toBe("superseded");
    expect(getLatestAudit(invitation.id)).toMatchObject({
      adminId: admin.id,
      action: "PRICE_OVERRIDE_SET",
    });
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm free test đầy đủ:

```ts
test("admin grants complimentary access without creating revenue", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  const invitation = createInvitation(user.id);
  const db = getDb();
  const revenue = () => (db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM Payment WHERE status = 'paid'")
    .get() as { total: number }).total;
  const invitationPaymentCount = () => (db
    .prepare("SELECT COUNT(*) AS count FROM Payment WHERE invitationId = ?")
    .get(invitation.id) as { count: number }).count;
  const revenueBefore = revenue();
  const paymentsBefore = invitationPaymentCount();

  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("0");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Lưu giá" }).click();

    await expect.poll(() => db
      .prepare("SELECT paid, complimentary, adminPriceOverride FROM Invitation WHERE id = ?")
      .get(invitation.id)).toEqual({ paid: 0, complimentary: 1, adminPriceOverride: 0 });
    expect(invitationPaymentCount()).toBe(paymentsBefore);
    expect(revenue()).toBe(revenueBefore);
    expect(db.prepare(`
      SELECT action, adminId FROM AdminAuditLog
      WHERE invitationId = ?
      ORDER BY createdAt, id
    `).all(invitation.id)).toEqual([
      { action: "PRICE_OVERRIDE_SET", adminId: admin.id },
      { action: "COMPLIMENTARY_GRANTED", adminId: admin.id },
    ]);
  } finally {
    db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
      .run(user.id, user.email);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm validation test đầy đủ để bảo vệ lỗi `z.coerce.number("") === 0`:

```ts
for (const invalidPrice of ["", "1.5"] as const) {
  test(`invalid admin price ${JSON.stringify(invalidPrice)} changes nothing`, async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const pending = createPayment(invitation.id, { status: "pending", amount: 150_000 });
    const db = getDb();
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.getByLabel("Giá cuối cùng (VND)").fill(invalidPrice);
      await page.getByRole("button", { name: "Lưu giá" }).click();

      await expect(page.getByText("Giá cuối cùng phải là số nguyên từ 0 đến 100.000.000đ.")).toBeVisible();
      expect((db.prepare("SELECT adminPriceOverride FROM Invitation WHERE id = ?")
        .get(invitation.id) as { adminPriceOverride: number | null }).adminPriceOverride).toBeNull();
      expect((db.prepare("SELECT status FROM Payment WHERE id = ?")
        .get(pending.id) as { status: string }).status).toBe("pending");
      expect((db.prepare(`
        SELECT COUNT(*) AS count FROM AdminAuditLog
        WHERE invitationId = ? AND action IN ('PRICE_OVERRIDE_SET', 'COMPLIMENTARY_GRANTED')
      `).get(invitation.id) as { count: number }).count).toBe(0);
    } finally {
      db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
        .run(user.id, user.email);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });
}
```

Mọi test khác trong suite tạo audit thành công cũng phải xóa audit theo `targetUserId` **hoặc snapshot `targetUserEmail`** trước `cleanupUser`; điều này cover cả row đã bị `SetNull` sau khi xóa user/thiệp.

- [ ] **Step 7: Implement create/price actions sau khi toàn bộ mutation tests đã đỏ**

Trong `src/app/admin/users/[id]/actions.ts`, mọi export gọi `verifyAdmin()` ở dòng logic đầu tiên. `createInvitationForUser(targetUserId, prev, formData)` chỉ parse `templateId` sau auth; trong transaction load target bằng `{ id:targetUserId, NOT:{email:SYSTEM_EMAIL} }`, tạo draft/content, ghi `INVITATION_CREATED_FOR_USER` với actor/target snapshots và `{templateId}`. Catch duy nhất typed `AdminSupportMutationError("userNotFound")`; rethrow lỗi lạ. Sau commit gọi `revalidatePath('/admin/users/'+targetUserId)`, `revalidatePath('/dashboard')`, rồi `redirect('/admin/invitations/'+created.id+'/edit')` ngoài `try/catch`.

Giữ contracts exact:

```ts
export type CreateInvitationState =
  | { ok: false; errorCode: "invalidTemplate" | "userNotFound" }
  | undefined;

export type PriceMutationErrorCode =
  | "invalidPrice"
  | "userNotFound"
  | "invitationNotFound"
  | "paidPriceLocked"
  | "concurrentChange";

export type PriceMutationState =
  | { ok: true; activation: "trial" | "complimentary"; finalPrice: number | null }
  | { ok: false; errorCode: PriceMutationErrorCode }
  | undefined;

export async function updateInvitationPrice(
  targetUserId: string,
  _previous: PriceMutationState,
  formData: FormData,
): Promise<PriceMutationState>;
```

`updateInvitationPrice` thực hiện đúng thuật toán sau:

Định nghĩa domain error trước action và chỉ catch class này; validation trả trực tiếp `invalidPrice`, còn lỗi Prisma/provider/programming không bị đổi thành thông báo thành công giả:

```ts
class AdminSupportMutationError extends Error {
  constructor(readonly code: Exclude<PriceMutationErrorCode, "invalidPrice">) {
    super(code);
  }
}

function priceFailure(error: unknown): PriceMutationState {
  if (error instanceof AdminSupportMutationError) {
    return { ok: false, errorCode: error.code };
  }
  throw error;
}
```

1. `verifyAdmin()` trước parse. Parse discriminated union `mode=set|reset`, bound `invitationId`, và `adminFinalPriceSchema`; parse fail → `invalidPrice`.
2. Trong một interactive transaction, load target user không phải system; null → `userNotFound`. Load thiệp bằng **cả** `{id:invitationId,userId:targetUserId,isDemo:false}` với `paid`, `updatedAt`, `adminPriceOverride`, `complimentary`, `complimentaryAt`, `slug`, user email snapshot và payments `where:{status:{in:["pending","cancelled"]}}`. null → `invitationNotFound`; `paid` → `paidPriceLocked`.
3. Tính state chính xác:

```ts
const reset = parsed.data.mode === "reset";
const finalPrice = reset ? null : parsed.data.finalPrice;
const complimentary = finalPrice === 0;
const nextState = {
  adminPriceOverride: finalPrice,
  complimentary,
  complimentaryAt: complimentary ? new Date() : null,
};
```

4. Optimistic write bằng `invitation.updateMany({where:{id,userId:targetUserId,isDemo:false,paid:false,updatedAt:invitation.updatedAt},data:nextState})`; count 0 → typed `concurrentChange`, transaction rollback nên chưa payment/audit nào đổi.
5. `payment.updateMany({where:{invitationId:id,status:{in:["pending","cancelled"]}},data:{status:"superseded"}})`. Không dùng `pending`-only; cả QR gốc và legacy voucher-cancelled đều mất hiệu lực.
6. Trong cùng transaction ghi `PRICE_OVERRIDE_SET` hoặc `PRICE_OVERRIDE_CLEARED`, details chỉ gồm before/after price+complimentary và `supersededPaymentCount`. Nếu complimentary boolean đổi, ghi thêm `COMPLIMENTARY_GRANTED` hoặc `COMPLIMENTARY_REVOKED`. Mọi row dùng cùng actor/target snapshots.
7. Return payment rows đã load, slug và next state. Sau commit mới `Promise.all` payOS rows qua `cancelPayosPayment(payment,"admin_price_changed")`; Casso không có provider call.
8. Bao transaction trong `try/catch`; `priceFailure(error)` chỉ map `AdminSupportMutationError`, rethrow lỗi lạ. Chỉ sau transaction commit mới cancel provider, revalidate profile target, `/dashboard`, `/editor/${id}` và public slug nếu có, rồi return success state.

Không tin `userId`/paid/price từ hidden input. Direct action tests ở Step 1 phải chứng minh auth-first, cross-binding, paid lock, zero audit trên mọi failure và Admin thường có cùng quyền mutation như SuperAdmin.

- [ ] **Step 8: Chạy admin support UI slice**

```bash
npm run typecheck
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'search users|creates an invitation|final price|complimentary|invalid admin price|unauthenticated direct|cross-profile|payment race|already-paid'
```

Expected: typecheck exit 0; selected tests PASS.

- [ ] **Step 9: Commit profile/UI slice**

```bash
git add src/app/admin/users/page.tsx 'src/app/admin/users/[id]/actions.ts' 'src/app/admin/users/[id]/page.tsx' 'src/app/admin/users/[id]/AdminCreateInvitationButton.tsx' 'src/app/admin/users/[id]/InvitationPriceDialog.tsx' tests/e2e/admin-invitation-support.spec.ts tests/e2e/helpers/fixtures.ts
git commit -m "feat(admin): add user invitation support workspace"
```

---

### Task 8: Tách editor persistence dùng chung mà không nới auth

**Files:**
- Create: `src/lib/invitation-editor-rules.ts`
- Create: `src/lib/invitation-editor-store.ts`
- Create: `src/lib/invitation-editor-rules.test.ts`
- Modify: `src/app/editor/[id]/actions.ts`
- Modify: `src/app/editor/[id]/content-schema.ts`
- Modify: `tests/e2e/editor.spec.ts`

- [ ] **Step 1: Khóa successful owner publish behavior trước refactor**

Thêm test tên chính xác `owner successfully publishes with persisted content and no admin audit` vào `tests/e2e/editor.spec.ts` trước khi sửa action:

```ts
test("owner successfully publishes with persisted content and no admin audit", async ({ page, context }) => {
  const user = newUser();
  const invitation = createInvitation(user.id);
  const slug = `owner-publish-${randomUUID().slice(0, 8)}`;
  await loginAsUser(context, user.id);
  await page.goto(`/editor/${invitation.id}`);
  await page.locator("#brideFullName").fill("Nguyễn Mai");
  await page.locator("#groomFullName").fill("Trần Nam");
  await page.locator("#date").fill("2026-12-20");
  await page.locator("#time").fill("18:00");
  await page.locator("#slug").fill(slug);
  await page.getByRole("button", { name: "Xuất bản thiệp" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator(`a[href="/thiep/${slug}"]`)).toBeVisible();
  await expect.poll(() => getDb().prepare(`
    SELECT status, slug, publishedAt FROM Invitation WHERE id = ?
  `).get(invitation.id)).toMatchObject({ status: "published", slug });
  expect(readContent(invitation.id, "brideFullName")).toBe("Nguyễn Mai");
  expect(readContent(invitation.id, "groomFullName")).toBe("Trần Nam");
  expect((getDb().prepare(
    "SELECT COUNT(*) AS count FROM AdminAuditLog WHERE invitationId = ?",
  ).get(invitation.id) as { count: number }).count).toBe(0);
  await page.goto(`/thiep/${slug}`);
  await expect(page.getByText("Nguyễn Mai")).toBeVisible();
});
```

Chạy characterization trước refactor:

```bash
npx playwright test tests/e2e/editor.spec.ts --project=chromium --grep 'owner successfully publishes'
```

Expected: PASS trên baseline. Test này khóa persistence, public link/dialog và bất biến không có `AdminAuditLog` cho owner.

- [ ] **Step 2: Viết tests cho validation publication/slug đang đỏ**

Tạo `src/lib/invitation-editor-rules.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { publicationIssue, validateInvitationSlug } from "./invitation-editor-rules";

const validDraft = {
  brideFullName: "Nguyễn Mai",
  groomFullName: "Trần Nam",
  date: "2026-12-20",
  time: "18:00",
};

test("publication requires bride, groom, date and time in order", () => {
  assert.deepEqual(publicationIssue({ ...validDraft, brideFullName: "" }), {
    errorCode: "coupleRequired",
    focusField: "brideFullName",
  });
  assert.deepEqual(publicationIssue({ ...validDraft, date: "" }), {
    errorCode: "dateRequired",
    focusField: "date",
  });
  assert.equal(publicationIssue(validDraft), null);
});

test("slug validation accepts lowercase path and rejects malformed values", () => {
  assert.deepEqual(validateInvitationSlug("mai-nam"), { available: true });
  assert.deepEqual(validateInvitationSlug("Mai Nam"), {
    available: false,
    reasonCode: "slugMalformed",
  });
});
```

- [ ] **Step 3: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/invitation-editor-rules.test.ts
```

Expected: FAIL vì rules module chưa tồn tại.

- [ ] **Step 4: Tạo pure editor rules**

Tạo `src/lib/invitation-editor-rules.ts` với đúng hai helper từ test:

```ts
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function validateInvitationSlug(slug: string): {
  available: true;
} | {
  available: false;
  reasonCode: "slugMissing" | "slugMalformed";
} {
  if (!slug) return { available: false, reasonCode: "slugMissing" };
  if (!SLUG_RE.test(slug)) {
    return { available: false, reasonCode: "slugMalformed" };
  }
  return { available: true };
}

export function publicationIssue(data: {
  brideFullName: string;
  groomFullName: string;
  date: string;
  time: string;
}): {
  errorCode: "coupleRequired" | "dateRequired" | "timeRequired";
  focusField: string;
} | null {
  if (!data.brideFullName.trim() || !data.groomFullName.trim()) {
    return {
      errorCode: "coupleRequired",
      focusField: !data.brideFullName.trim() ? "brideFullName" : "groomFullName",
    };
  }
  if (!data.date.trim()) return { errorCode: "dateRequired", focusField: "date" };
  if (!data.time.trim()) return { errorCode: "timeRequired", focusField: "time" };
  return null;
}
```

- [ ] **Step 5: Tạo prepare/write service không chứa auth**

`src/lib/invitation-editor-store.ts` phải export:

```ts
import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
import {
  contentSchema,
  parseCeremonies,
  parseGallery,
  parseSchedule,
} from "@/app/editor/[id]/content-schema";
import { isGoogleMapsShortUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";

export type PreparedInvitationDraft = {
  persistedData: z.infer<typeof contentSchema>;
  templateId: string;
  contentData: Omit<z.infer<typeof contentSchema>, "templateId">;
  ceremonies: ReturnType<typeof parseCeremonies>;
  schedule: ReturnType<typeof parseSchedule>;
  gallery: ReturnType<typeof parseGallery>;
};

export async function prepareInvitationDraft(
  formData: FormData,
): Promise<{ data: PreparedInvitationDraft } | { errorCode: "invalidData" }> {
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errorCode: "invalidData" };
  }
  const ceremonies = parseCeremonies(formData);
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);
  const mapAddress = isGoogleMapsShortUrl(parsed.data.mapAddress)
    ? await expandGoogleMapsShortUrl(parsed.data.mapAddress)
    : parsed.data.mapAddress;
  const firstCeremony = ceremonies[0];
  const persistedData = {
    ...parsed.data,
    ceremonyHeader: firstCeremony?.title ?? "",
    ceremonyDate: firstCeremony?.date ?? "",
    ceremonyTime: firstCeremony?.time ?? "",
    mapAddress,
  };
  const { templateId, ...contentData } = persistedData;
  return {
    data: { persistedData, templateId, contentData, ceremonies, schedule, gallery },
  };
}
```

`writeInvitationDraft` phải có chữ ký và body đầy đủ:

```ts
export async function writeInvitationDraft(
  db: Prisma.TransactionClient,
  invitationId: string,
  draft: PreparedInvitationDraft,
): Promise<void> {
  await db.invitation.update({
    where: { id: invitationId },
    data: { templateId: draft.templateId },
  });
  await db.invitationContent.upsert({
    where: { invitationId },
    create: { invitationId, ...draft.contentData },
    update: draft.contentData,
  });
  await db.ceremonyItem.deleteMany({ where: { invitationId } });
  await db.scheduleItem.deleteMany({ where: { invitationId } });
  await db.galleryPhoto.deleteMany({ where: { invitationId } });
  if (draft.ceremonies.length) {
    await db.ceremonyItem.createMany({
      data: draft.ceremonies.map((ceremony, sortOrder) => ({
        invitationId,
        title: ceremony.title,
        date: ceremony.date,
        time: ceremony.time,
        sortOrder,
      })),
    });
  }
  if (draft.schedule.length) {
    await db.scheduleItem.createMany({
      data: draft.schedule.map((item, sortOrder) => ({
        invitationId,
        time: item.time,
        label: item.label,
        sortOrder,
      })),
    });
  }
  if (draft.gallery.length) {
    await db.galleryPhoto.createMany({
      data: draft.gallery.map((url, sortOrder) => ({
        invitationId,
        url,
        sortOrder,
      })),
    });
  }
}
```

Hàm không tự mở transaction và không gọi auth. Không import file này trong Node unit tests vì `google-maps-server.ts` là server-only; persistence được cover bởi owner/support Playwright tests ở Step 6 và Task 9.

- [ ] **Step 6: Refactor owner actions qua store nhưng giữ cổng quyền**

Trong `src/app/editor/[id]/actions.ts`, giữ auth owner tường minh bằng helper:

```ts
async function requireOwnedInvitation(id: string) {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) return null;
  return { invitation, userId };
}
```

`saveDraft` dùng flow cụ thể:

```ts
export async function saveDraft(
  id: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState> {
  const access = await requireOwnedInvitation(id);
  if (!access) return { errorCode: "invitationNotFound" };
  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) return { errorCode: prepared.errorCode };
  await prisma.$transaction((db) => writeInvitationDraft(db, id, prepared.data));
  revalidatePath(`/editor/${id}`);
  return { ok: true, persisted: true };
}
```

`autosaveDraft` dùng cùng `requireOwnedInvitation → prepareInvitationDraft → prisma.$transaction(writeInvitationDraft)` và trả `false` khi access/validation lỗi, `true` sau commit. `resolveGoogleMapsLink` tiếp tục gọi `verifySession()` trước parse/expand URL.

`checkSlug` phải gọi `requireOwnedInvitation(invitationId)` trước cả validate/query collision:

```ts
const access = await requireOwnedInvitation(invitationId);
if (!access) return { available: false, reasonCode: "invitationNotFound" };
const normalized = slug.trim().toLowerCase();
const syntax = validateInvitationSlug(normalized);
if (!syntax.available) return syntax;
const existing = await prisma.invitation.findUnique({ where: { slug: normalized } });
if (existing && existing.id !== invitationId) {
  return { available: false, reasonCode: "slugTaken" };
}
return { available: true };
```

`publish` phải gọi `requireOwnedInvitation(id)` rồi prepare trước. Giữ behavior hiện tại: ghi draft trong transaction đầu và trả `persisted: true` ngay cả khi publication validation/slug fail, để test “publish validation keeps unsaved names…” tiếp tục pass sau reload. Sau `publicationIssue` và slug syntax, transaction publish thứ hai re-query ownership + collision rồi update status/slug/publishedAt; trả đúng `persisted`, `publishedSlug`, `publishedAt`. Support publish ở Task 9 dùng transaction nội dung+publish+audit nguyên tử riêng vì mutation Admin chỉ ghi audit khi submit thành công.

Không import/call `getAdminSession()` trong bất kỳ owner action nào. Sau refactor chạy:

```bash
rg -n 'getAdminSession|verifyAdmin' 'src/app/editor/[id]/actions.ts'
```

Expected: không có match.

- [ ] **Step 7: Chạy unit, owner editor E2E và typecheck**

```bash
npx tsx --test src/lib/invitation-editor-rules.test.ts 'src/app/editor/[id]/content-schema.test.ts' 'src/app/editor/[id]/slug.test.ts'
npm run typecheck
npx playwright test tests/e2e/editor.spec.ts --project=chromium --grep 'owner opens editor|hydrates existing content|publish validation|owner successfully publishes'
```

Expected: unit tests PASS; typecheck exit 0; owner editor regression PASS.

- [ ] **Step 8: Commit editor service refactor**

```bash
git add src/lib/invitation-editor-rules.ts src/lib/invitation-editor-rules.test.ts src/lib/invitation-editor-store.ts 'src/app/editor/[id]/actions.ts' 'src/app/editor/[id]/content-schema.ts' tests/e2e/editor.spec.ts
git commit -m "refactor(editor): share invitation persistence service"
```

---

### Task 9: Xây support editor và audit save/publish

**Files:**
- Create: `src/app/admin/invitations/[id]/edit/page.tsx`
- Create: `src/app/admin/invitations/[id]/edit/actions.ts`
- Modify: `src/app/editor/[id]/EditorForm.tsx`
- Modify: `src/hooks/use-form-draft.ts`
- Modify: `src/app/admin/demos/actions.ts`
- Modify: `src/app/admin/demos/[id]/page.tsx`
- Modify: `tests/e2e/admin-invitation-support.spec.ts`

- [ ] **Step 1: Viết support editor E2E tests đang đỏ**

Thêm tests:

```ts
test("non-super admin edits and publishes a customer invitation without impersonation", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/invitations/${invitation.id}/edit`);
    await expect(page.getByText(`Đang hỗ trợ tài khoản ${user.email}`)).toBeVisible();
    const userCookie = (await context.cookies()).find((cookie) => cookie.name === "session");
    expect(userCookie).toBeUndefined();

    await page.locator("#brideFullName").fill("Nguyễn Mai");
    await page.locator("#groomFullName").fill("Trần Nam");
    await page.locator("#date").fill("2026-12-20");
    await page.locator("#time").fill("18:00");
    await page.getByRole("button", { name: "Xuất bản thiệp" }).click();

    await expect.poll(() => getInvitation(invitation.id).status).toBe("published");
    const audit = getLatestAudit(invitation.id);
    expect(audit.adminId).toBe(admin.id);
    expect(audit.action).toBe("INVITATION_PUBLISHED_BY_ADMIN");
  } finally {
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});

test("support editor rejects demo and unknown invitation ids", async ({ page, context }) => {
  const user = createUser();
  const demo = createInvitation(user.id, { isDemo: true });
  try {
    await loginAsAdmin(context, seededAdminId());
    for (const id of [demo.id, `missing-${randomUUID()}`]) {
      const response = await page.goto(`/admin/invitations/${id}/edit`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    }
  } finally {
    cleanupUser(user.id);
  }
});
```

Parameterize happy path bằng `for (const isSuperAdmin of [false, true] as const)`; mỗi case seed admin tương ứng, chạy cùng edit/publish flow và assert audit actor/action như nhau. Thêm bốn direct-action regressions trước Step 2:

- Mở support editor khi authenticated, sửa field, `context.clearCookies()`, submit save; phải navigate login, content/status/audit không đổi.
- Lặp lại với publish; slug/status/content/audit không đổi.
- Khi còn authenticated, tamper hidden `templateId` thành slug không allowlist rồi save; action trả `invalidData`, toàn bộ DB và audit không đổi.
- Mở page authenticated rồi clear cookies trước khi blur/check slug và trước khi nhập Google Maps short URL để trigger resolver; cả `checkSupportedInvitationSlug` và `resolveSupportedGoogleMapsLink` phải chạy auth mới tại invocation, navigate login và không query/mutate thiệp đích.

Mỗi test snapshot `Invitation`, `InvitationContent` và `COUNT(AdminAuditLog)` trước submit, rồi deep-compare sau failure. Không chỉ assert UI error.

Thêm test cross-binding riêng: tạo User A/B và thiệp A/B; mở support editor A, tamper invocation của `saveSupportedInvitation` và `publishSupportedInvitation` lần lượt sang ID thiệp B nhưng giữ form/state A. Mỗi action chỉ có một bound `invitationId`, nên kết quả an toàn phải là hoặc cập nhật đúng thiệp B sau khi action re-query B (không bao giờ dùng user/context A), hoặc `invitationNotFound` nếu fixture đánh dấu B demo/missing. Assert thiệp A tuyệt đối không đổi, audit mới nếu có chỉ mang đồng thời `targetUserId=userB.id` và `invitationId=invitationB.id`; không được tạo row ghép User A với thiệp B. Test này khóa A/B isolation cho cả ownership snapshot lẫn audit, không dựa vào hidden `userId`.

- [ ] **Step 2: Chạy tests để xác nhận đỏ**

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'edits and publishes|rejects demo|unauthenticated support|invalid template|slug wrapper|map wrapper'
```

Expected: route 404 và mọi happy/security path FAIL trước support route/actions.

- [ ] **Step 3: Viết support actions với auth riêng**

`src/app/admin/invitations/[id]/edit/actions.ts` export chính xác:

```ts
export async function saveSupportedInvitation(
  id: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState>;

export async function publishSupportedInvitation(
  id: string,
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState>;

export async function checkSupportedInvitationSlug(
  slug: string,
  invitationId: string,
): Promise<SlugCheckResult>;

export async function resolveSupportedGoogleMapsLink(value: string): Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}>;
```

Mỗi export bắt đầu bằng `verifyAdmin()`. Định nghĩa domain error dùng chung trong file action; chỉ error này được catch và map về `EditorState`, lỗi hạ tầng/lỗi code phải rethrow:

```ts
class SupportEditorMutationError extends Error {
  constructor(readonly code: EditorErrorCode) {
    super(code);
  }
}

function editorFailure(error: unknown): EditorState {
  if (error instanceof SupportEditorMutationError) {
    return { errorCode: error.code };
  }
  throw error;
}
```

Save flow:

1. `prepareInvitationDraft(formData)` ngoài transaction.
2. Trong transaction query `Invitation` với `{ id, isDemo: false }`, user snapshot, content và ba relation có `sortOrder`; không thấy thì throw `SupportEditorMutationError("invitationNotFound")`.
3. `writeInvitationDraft`.
4. Trước khi write, canonicalize/diff persisted row và submitted draft bằng đúng helper Task 5. Sau write, gọi audit cùng transaction bằng object đầy đủ:

```ts
const editorDiff = diffInvitationEditorAudit(
  {
    source: "prisma",
    templateId: invitation.templateId,
    content: invitation.content,
    ceremonies: invitation.ceremonies,
    schedule: invitation.schedule,
    gallery: invitation.gallery,
  },
  {
    source: "submitted",
    persistedData: prepared.data.persistedData,
    ceremonies: prepared.data.ceremonies,
    schedule: prepared.data.schedule,
    gallery: prepared.data.gallery,
  },
);

await writeAdminAudit(db, {
  adminId,
  adminEmail,
  targetUserId: invitation.user.id,
  targetUserEmail: invitation.user.email,
  invitationId: invitation.id,
  action: ADMIN_AUDIT_ACTIONS.invitationUpdated,
  details: {
    changedGroups: editorDiff.changedGroups,
    changedFields: editorDiff.changedFields,
    ...(invitation.templateId === prepared.data.templateId
      ? {}
      : { templateId: prepared.data.templateId }),
  },
});
```

Import `diffInvitationEditorAudit` từ `@/lib/invitation-editor-audit`; `admin-audit` chỉ cung cấp action constants/serialization/write. Không tạo `contentSnapshot`, không gọi `changedEditorGroups`, không ghi raw Prisma row/canonical snapshot hoặc before/after nội dung vào audit. `changedGroups` và `changedFields` là exact result của canonical diff; `templateId` chỉ được thêm khi đổi và là slug allowlist an toàn.

5. Revalidate profile, admin editor, owner editor và dashboard.

Save action phải `try` quanh transaction, catch bằng `editorFailure`, chỉ revalidate/return `{ok:true,persisted:true}` sau commit. Submit invalid hoặc transaction fail không có content write và không có audit.

Publish flow chuẩn bị draft, validate required fields và slug syntax trước transaction nhưng chưa ghi gì. Trong **một** transaction: query `{id,isDemo:false}` cùng user/content/relations; check collision; tính `editorDiff` bằng hai discriminant như save; `writeInvitationDraft`; update status/slug/publishedAt; ghi audit action `INVITATION_PUBLISHED_BY_ADMIN` nếu status cũ chưa published, nếu đã published dùng `INVITATION_UPDATED_BY_ADMIN`. Audit details chỉ gồm `changedGroups`, `changedFields`, `templateId` khi đổi, `before:{status,slug}` và `after:{status,slug}`; status/slug là metadata định danh allowlist, không ghi tên, địa chỉ, bank hoặc nội dung đầy đủ. Transaction lỗi rollback cả draft, publication và audit. Catch chỉ `SupportEditorMutationError`; rethrow lỗi lạ. Revalidate/return `publishedSlug` và `publishedAt` như owner action chỉ sau commit.

Slug check phải query thiệp đích `{ id: invitationId, isDemo: false }` sau `verifyAdmin`; resolver map chỉ chạy sau `verifyAdmin`, dùng cùng URL/length policy của owner action.

- [ ] **Step 4: Đổi `EditorForm` sang ba mode tường minh**

Thay `adminMode?: boolean` bằng một discriminated union để non-owner mode không thể fallback nhầm sang owner action:

```ts
export type EditorMode = "owner" | "demo-admin" | "support-admin";

type CommonEditorFormProps = {
  invitationId: string;
  status: string;
  activation: InvitationActivation;
  publishedAt?: string | null;
  currentSlug: string | null;
  templateId: string;
  content: InvitationContent | null;
  ceremonies: { title: string; date: string; time: string }[];
  schedule: { time: string; label: string }[];
  gallery: string[];
  locale: string;
  musicMessages: MusicPickerMessages;
  initialTrack: { url: string; title: string; artist: string } | null;
  templateLabels?: Record<string, string>;
};

type EditorFormProps = CommonEditorFormProps & (
  | {
      mode?: "owner";
      saveAction?: never;
      publishAction?: never;
      checkSlugAction?: never;
      resolveMapAction?: never;
      supportContext?: never;
    }
  | {
      mode: "demo-admin";
      saveAction: EditorMutationAction;
      publishAction?: never;
      checkSlugAction?: never;
      resolveMapAction?: never;
      supportContext?: never;
    }
  | {
      mode: "support-admin";
      saveAction: EditorMutationAction;
      publishAction: EditorMutationAction;
      checkSlugAction: SlugCheckAction;
      resolveMapAction: ResolveMapAction;
      supportContext: { userId: string; email: string };
    }
);
```

Với:

```ts
type EditorMutationAction = (
  id: string,
  prev: EditorState,
  formData: FormData,
) => Promise<EditorState>;
type EditorErrorCode = NonNullable<EditorState>["errorCode"];
type SlugCheckAction = (
  slug: string,
  invitationId: string,
) => Promise<SlugCheckResult>;
type ResolveMapAction = (value: string) => Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}>;
```

Không destructure các action khỏi `props` trước khi narrow. Tách ba branch component tường minh để TypeScript giữ đúng discriminant và hook order ổn định; default owner action chỉ xuất hiện trong owner branch:

```tsx
export function EditorForm(props: EditorFormProps) {
  if (props.mode === "support-admin") {
    return <SupportAdminEditorForm {...props} />;
  }
  if (props.mode === "demo-admin") {
    return <DemoAdminEditorForm {...props} />;
  }
  return <OwnerEditorForm {...props} mode="owner" />;
}

function OwnerEditorForm(
  props: CommonEditorFormProps & { mode: "owner" },
) {
  return (
    <EditorFormBody
      {...props}
      ownerMode
      saveAction={saveDraft}
      publishAction={publish}
      checkSlugAction={checkSlug}
      resolveMapAction={resolveGoogleMapsLink}
    />
  );
}

function SupportAdminEditorForm(
  props: Extract<EditorFormProps, { mode: "support-admin" }>,
) {
  return <EditorFormBody {...props} ownerMode={false} />;
}

function DemoAdminEditorForm(
  props: Extract<EditorFormProps, { mode: "demo-admin" }>,
) {
  return <DemoEditorFormBody {...props} ownerMode={false} />;
}
```

`EditorFormBody` nhận đủ bốn action bắt buộc và có save/publish/slug/map hooks. `DemoEditorFormBody` chỉ nhận `saveAction`, không có prop publish/slug/map và không dựng các hook/section đó. Không dùng no-op action. Như vậy `saveDemo` không thể nhận submit xuất bản hoặc fallback sang action owner ở cả runtime lẫn type-level.

Behavior matrix bắt buộc:

| Hành vi | owner | demo-admin | support-admin |
|---|---:|---:|---:|
| Autosave | có | không | không |
| Save tay | có | có | có |
| Slug/publish section | có | không | có |
| Trial/payment CTA | có khi trial | không | không |
| Support banner | không | không | có |
| Publish success dialog dành cho user | có | không | không |
| Back link | `/dashboard` | `/admin/demos` | `/admin/users/{userId}` |
| Đọc/ghi localStorage draft | có | không | không |

`VenueLocationFields` nhận `resolveMapAction` prop và gọi prop thay import trực tiếp. `onCheckSlug` gọi `effectiveCheckSlug`. Support banner dùng `editor.support.*`; support mode chỉ mở toast khi publish thành công và không mở dialog dẫn tới dashboard người dùng.

Trong `src/app/editor/[id]/content-schema.ts`, thay type cũ bằng contract chính xác:

```ts
export type EditorErrorCode =
  | "invalidData"
  | "invitationNotFound"
  | "slugMissing"
  | "slugMalformed"
  | "slugTaken"
  | "coupleRequired"
  | "dateRequired"
  | "timeRequired";

export type EditorState =
  | {
      errorCode?: EditorErrorCode;
      focusField?: string;
      ok?: boolean;
      persisted?: boolean;
      publishedSlug?: string;
      publishedAt?: string;
    }
  | undefined;

export type SlugCheckResult =
  | { available: true }
  | {
      available: false;
      reasonCode: Extract<
        EditorErrorCode,
        "invitationNotFound" | "slugMissing" | "slugMalformed" | "slugTaken"
      >;
    };
```

Import `EditorErrorCode`, `EditorState` và `SlugCheckResult` ở các action/UI thay vì định nghĩa union lệch nhau. `EditorForm` dùng `const errorT = useTranslations("editor.errors")` và map `saveState.errorCode`, `publishState.errorCode`, `slugStatus.reasonCode` qua `errorT(code)` trước toast/render. Không đưa message đã dịch từ client vào analytics; analytics chỉ nhận error code.

Đổi draft restore logic trong `EditorFormBody` thành:

```ts
const restoredDraft = useMemo(
  () => (hydrated && ownerMode ? readDraft(props.invitationId) : null),
  [hydrated, ownerMode, props.invitationId],
);
```

Và gọi hook bên trong với `enabled: ownerMode`. Sửa `src/hooks/use-form-draft.ts` để `capture()` vẫn serialize form cho submit nhưng không gọi `writeDraft` khi `enabled=false`:

```ts
const persist = useCallback(
  (draft: Draft) => {
    latestRef.current = draft;
    return enabled ? writeDraft(invitationId, draft) : false;
  },
  [enabled, invitationId],
);

const clear = useCallback(() => {
  latestRef.current = null;
  if (enabled) clearFormDraft(invitationId);
}, [enabled, invitationId]);
```

Support E2E sau save/publish phải assert:

```ts
expect(
  await page.evaluate((id) => localStorage.getItem(`chungdoi:draft:${id}`), invitation.id),
).toBeNull();
```

- [ ] **Step 5: Viết support editor page**

Page phải `await verifyAdmin()`, `await params`, query thiệp `{ id, isDemo: false }`, include user/content/ceremonies/schedule/gallery. Load music messages và template labels song song. Wrap `EditorForm` trong:

```tsx
<NextIntlClientProvider
  locale="vi"
  messages={{ editor: viMessages.editor }}
>
  <EditorForm
    mode="support-admin"
    supportContext={{ userId: invitation.user.id, email: invitation.user.email ?? "—" }}
    saveAction={saveSupportedInvitation}
    publishAction={publishSupportedInvitation}
    checkSlugAction={checkSupportedInvitationSlug}
    resolveMapAction={resolveSupportedGoogleMapsLink}
    activation={getInvitationActivation(invitation)}
    invitationId={invitation.id}
    status={invitation.status}
    publishedAt={invitation.publishedAt?.toISOString() ?? null}
    currentSlug={invitation.slug}
    templateId={invitation.templateId}
    content={invitation.content}
    ceremonies={invitation.ceremonies.map((item) => ({
      title: item.title,
      date: item.date,
      time: item.time,
    }))}
    schedule={invitation.schedule.map((item) => ({
      time: item.time,
      label: item.label,
    }))}
    gallery={invitation.gallery.map((item) => item.url)}
    locale="vi"
    musicMessages={musicMessages}
    initialTrack={initialTrack}
    templateLabels={templateLabels}
  />
</NextIntlClientProvider>
```

Trang demo đổi `adminMode` thành `mode="demo-admin"`; quyền demo và behavior save giữ nguyên. Vì `EditorState.error` đã bị thay bằng `errorCode`, refactor `src/app/admin/demos/actions.ts` trong Task 9 để `saveDemo` trả `invitationNotFound`/`invalidData` thay cho copy tự do; không thay đổi `RenameTemplateState` hoặc các action quản lý template khác.

Support page link/back context chỉ lấy `invitation.user.id/email` từ query server. Không nhận `userId` qua search param/form. Direct support action cũng chỉ nhận `invitationId`, rồi tự derive target user từ row đã re-query; đây là bất biến ngăn audit cross-binding User A/thiệp B.

- [ ] **Step 6: Chạy support/owner/demo editor regressions**

```bash
npm run typecheck
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'edits and publishes|rejects demo|unauthenticated support|invalid template|slug wrapper|map wrapper'
npx playwright test tests/e2e/editor.spec.ts tests/e2e/admin.spec.ts --project=chromium --grep 'owner opens editor|demo edit page loads'
```

Expected: typecheck exit 0; support happy path cho Admin/SuperAdmin, demo/unknown rejection, mọi direct-action auth/invalid-data zero-write/zero-audit regression, owner và demo tests đều PASS.

- [ ] **Step 7: Commit support editor slice**

```bash
git add 'src/app/admin/invitations/[id]/edit/page.tsx' 'src/app/admin/invitations/[id]/edit/actions.ts' 'src/app/editor/[id]/EditorForm.tsx' src/hooks/use-form-draft.ts src/app/admin/demos/actions.ts 'src/app/admin/demos/[id]/page.tsx' tests/e2e/admin-invitation-support.spec.ts
git commit -m "feat(admin): edit customer invitations through support mode"
```

---

### Task 10: Hoàn thiện audit UI, activation copy và end-to-end bất biến

**Files:**
- Create: `src/lib/admin-audit-view.ts`
- Create: `src/lib/admin-audit-view.test.ts`
- Modify: `src/app/admin/users/[id]/page.tsx`
- Modify: `src/app/dashboard/DashboardInvitationCard.tsx`
- Modify: `src/app/dashboard/[id]/thanh-toan/page.tsx`
- Modify: `src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx`
- Modify: `src/app/editor/[id]/EditorForm.tsx`
- Modify: `tests/e2e/admin-invitation-support.spec.ts`
- Modify: `tests/e2e/payment-webhook.spec.ts`
- Modify: `tests/e2e/helpers/fixtures.ts`

- [ ] **Step 1: Thêm audit snapshot survival test đang đỏ**

Trong `tests/e2e/admin-invitation-support.spec.ts`, thêm helper typed:

```ts
type AuditSnapshotRow = {
  adminId: string | null;
  adminEmail: string;
  targetUserId: string | null;
  targetUserEmail: string | null;
  invitationId: string | null;
  action: string;
};

function latestAuditByAction(action: string): AuditSnapshotRow | undefined {
  return getDb()
    .prepare(`
      SELECT adminId, adminEmail, targetUserId, targetUserEmail, invitationId, action
      FROM AdminAuditLog
      WHERE action = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `)
    .get(action) as AuditSnapshotRow | undefined;
}
```

Thêm test actor survival đầy đủ:

```ts
test("audit keeps the admin snapshot after the actor is deleted", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const admin = seedAdmin(false);
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await page.getByRole("button", { name: "Lưu giá" }).click();
    await expect.poll(() => latestAuditByAction("PRICE_OVERRIDE_SET")?.adminId).toBe(admin.id);

    await context.clearCookies();
    getDb().prepare("DELETE FROM Admin WHERE id = ?").run(admin.id);
    const snapshot = latestAuditByAction("PRICE_OVERRIDE_SET");
    expect(snapshot?.adminId).toBeNull();
    expect(snapshot?.adminEmail).toBe(admin.email);
    expect(snapshot?.targetUserEmail).toBe(user.email);

    await loginAsAdmin(context, seededAdminId());
    await page.goto(`/admin/users/${user.id}`);
    await expect(page.getByText(admin.email)).toBeVisible();
  } finally {
    getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ?").run(user.id);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm helper:

```ts
function auditById(id: string): AuditSnapshotRow | undefined {
  return getDb().prepare(`
    SELECT adminId, adminEmail, targetUserId, targetUserEmail, invitationId, action
    FROM AdminAuditLog WHERE id = ?
  `).get(id) as AuditSnapshotRow | undefined;
}
```

Thêm invitation survival test đầy đủ:

```ts
test("audit keeps the invitation snapshot after the invitation is deleted", async ({ page, context }) => {
  const user = createUser();
  const invitationA = createInvitation(user.id);
  createInvitation(user.id);
  const admin = seedAdmin(false);
  let auditId: string | undefined;
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    const row = page.locator("tr", { has: page.locator(`[data-invitation-id="${invitationA.id}"]`) });
    await row.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await page.getByRole("button", { name: "Lưu giá" }).click();
    auditId = (getDb().prepare(`
      SELECT id FROM AdminAuditLog
      WHERE invitationId = ? AND action = 'PRICE_OVERRIDE_SET'
      ORDER BY createdAt DESC LIMIT 1
    `).get(invitationA.id) as { id: string }).id;

    getDb().prepare("DELETE FROM Invitation WHERE id = ?").run(invitationA.id);
    expect(auditById(auditId)).toEqual({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: user.id,
      targetUserEmail: user.email,
      invitationId: null,
      action: "PRICE_OVERRIDE_SET",
    });

    await page.goto(`/admin/users/${user.id}`);
    await expect(page.getByText("Đã đặt giá riêng cho thiệp")).toBeVisible();
    await expect(page.getByText(admin.email)).toBeVisible();
  } finally {
    if (auditId) getDb().prepare("DELETE FROM AdminAuditLog WHERE id = ?").run(auditId);
    getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
      .run(user.id, user.email);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Thêm user survival test đầy đủ:

```ts
test("audit keeps the target-user snapshot after the user is deleted", async ({ page, context }) => {
  const user = createUser();
  const invitation = createInvitation(user.id);
  const admin = seedAdmin(false);
  let auditId: string | undefined;
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("button", { name: "Đặt giá" }).click();
    await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
    await page.getByRole("button", { name: "Lưu giá" }).click();
    auditId = (getDb().prepare(`
      SELECT id FROM AdminAuditLog
      WHERE invitationId = ? AND action = 'PRICE_OVERRIDE_SET'
      ORDER BY createdAt DESC LIMIT 1
    `).get(invitation.id) as { id: string }).id;

    getDb().prepare("DELETE FROM User WHERE id = ?").run(user.id);
    expect(auditById(auditId)).toEqual({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: null,
      targetUserEmail: user.email,
      invitationId: null,
      action: "PRICE_OVERRIDE_SET",
    });
  } finally {
    if (auditId) getDb().prepare("DELETE FROM AdminAuditLog WHERE id = ?").run(auditId);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Chạy để xác nhận đỏ:

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'snapshot after|invitation snapshot'
```

Expected: FAIL trước khi relation dùng `SetNull` và audit UI tồn tại; PASS sau Task 1/7/10.

- [ ] **Step 2: Thêm late-payment và reset-free golden paths**

Trong `tests/e2e/payment-webhook.spec.ts`, mở rộng test `superseded payment cannot activate an invitation`: seed payment `pending`, rồi update invitation và payment trong cùng direct SQLite transaction để mô phỏng kết quả Admin price mutation; sau đó gửi signed Casso webhook cũ. Dùng assertion chính xác:

```ts
const oldPayment = createPayment(inv.id, {
  code: "CDLATE23",
  amount: 150_000,
  status: "pending",
});
getDb().transaction(() => {
  getDb().prepare(
    `UPDATE Invitation
     SET adminPriceOverride = 79000, complimentary = 0, complimentaryAt = NULL
     WHERE id = ?`,
  ).run(inv.id);
  getDb().prepare(`UPDATE Payment SET status = 'superseded' WHERE id = ?`).run(oldPayment.id);
})();

const body = cassoBody(`thanh toan ${oldPayment.code}`, 150_000);
const response = await request.post(WEBHOOK_PATH, {
  headers: { "x-casso-signature": signCasso(body) },
  data: body,
});
expect(response.status()).toBe(200);
expect(getPayment(oldPayment.code)?.status).toBe("superseded");
expect(getInvitationPaid(inv.id)).toBe(0);
```

Audit của chính mutation Admin đã được cover ở support suite; webhook characterization không giả tạo audit row.

Trong `tests/e2e/admin-invitation-support.spec.ts`, thêm reset complimentary golden path:

```ts
test("resetting complimentary revokes activation and restores expiry", async ({ page, context }) => {
  const user = createUser();
  const admin = seedAdmin(false);
  const invitation = createInvitation(user.id, {
    adminPriceOverride: 0,
    complimentary: true,
    status: "published",
    slug: `expired-${randomUUID().slice(0, 8)}`,
    publishedAt: new Date(Date.now() - FREE_TRIAL_MS - 60_000),
  });
  try {
    await loginAsAdmin(context, admin.id);
    await page.goto(`/admin/users/${user.id}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Dùng lại giá hệ thống" }).click();

    await expect.poll(() => {
      return getDb()
        .prepare("SELECT adminPriceOverride, complimentary FROM Invitation WHERE id = ?")
        .get(invitation.id);
    }).toEqual({ adminPriceOverride: null, complimentary: 0 });

    const actions = getDb()
      .prepare("SELECT action, adminId FROM AdminAuditLog WHERE invitationId = ? ORDER BY createdAt")
      .all(invitation.id) as { action: string; adminId: string | null }[];
    expect(actions).toEqual([
      { action: "PRICE_OVERRIDE_CLEARED", adminId: admin.id },
      { action: "COMPLIMENTARY_REVOKED", adminId: admin.id },
    ]);

    await page.goto(`/thiep/${getInvitation(invitation.id).slug}`);
    await expect(page.getByText(/đã hết 3 ngày dùng thử/i)).toBeVisible();
  } finally {
    getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
      .run(user.id, user.email);
    deleteAdmin(admin.id);
    cleanupUser(user.id);
  }
});
```

Import `FREE_TRIAL_MS`, `randomUUID` và dùng helper `getInvitation` đã định nghĩa trong suite. Chạy:

```bash
npx playwright test tests/e2e/payment-webhook.spec.ts --project=chromium --grep 'superseded payment'
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'resetting complimentary'
```

Expected: cả hai PASS sau Task 4/5/7.

- [ ] **Step 3: Viết audit display allowlist đang đỏ**

Tạo `src/lib/admin-audit-view.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { parseAuditDetailsForDisplay } from "./admin-audit-view";

test("audit display parser returns only allowed price metadata", () => {
  assert.deepEqual(
    parseAuditDetailsForDisplay(JSON.stringify({
      before: { adminPriceOverride: null, complimentary: false, passwordHash: "secret" },
      after: { adminPriceOverride: 79_000, complimentary: false, bankAccount: "123" },
      supersededPaymentCount: 2,
      sessionToken: "secret",
    })),
    {
      beforePrice: null,
      afterPrice: 79_000,
      beforeComplimentary: false,
      afterComplimentary: false,
      supersededPaymentCount: 2,
    },
  );
});

test("malformed or wrong-shaped audit details are ignored", () => {
  assert.equal(parseAuditDetailsForDisplay("not-json"), null);
  assert.equal(parseAuditDetailsForDisplay(JSON.stringify(["raw"])), null);
  assert.equal(parseAuditDetailsForDisplay(null), null);
});
```

Chạy:

```bash
npx tsx --test src/lib/admin-audit-view.test.ts
```

Expected: FAIL vì module chưa tồn tại.

- [ ] **Step 4: Viết audit display allowlist và dùng translation tại mọi copy mới**

Tạo `src/lib/admin-audit-view.ts` với các guard `unknown` (không dùng `any`) và export:

```ts
export type AuditDisplayDetails = {
  beforePrice: number | null;
  afterPrice: number | null;
  beforeComplimentary: boolean | null;
  afterComplimentary: boolean | null;
  supersededPaymentCount: number | null;
};

export function parseAuditDetailsForDisplay(
  raw: string | null,
): AuditDisplayDetails | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const before = isRecord(parsed.before) ? parsed.before : null;
  const after = isRecord(parsed.after) ? parsed.after : null;
  const beforePrice = nullablePrice(before?.adminPriceOverride);
  const afterPrice = nullablePrice(after?.adminPriceOverride);
  const beforeComplimentary = nullableBoolean(before?.complimentary);
  const afterComplimentary = nullableBoolean(after?.complimentary);
  const supersededPaymentCount = nullableCount(parsed.supersededPaymentCount);
  if (
    !beforePrice.valid &&
    !afterPrice.valid &&
    !beforeComplimentary.valid &&
    !afterComplimentary.valid &&
    !supersededPaymentCount.valid
  ) {
    return null;
  }

  return {
    beforePrice: beforePrice.value,
    afterPrice: afterPrice.value,
    beforeComplimentary: beforeComplimentary.value,
    afterComplimentary: afterComplimentary.value,
    supersededPaymentCount: supersededPaymentCount.value,
  };
}

type ParsedField<T> = { valid: boolean; value: T | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nullablePrice(value: unknown): ParsedField<number> {
  if (value === null) return { valid: true, value: null };
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? { valid: true, value }
    : { valid: false, value: null };
}

function nullableBoolean(value: unknown): ParsedField<boolean> {
  return typeof value === "boolean"
    ? { valid: true, value }
    : { valid: false, value: null };
}

function nullableCount(value: unknown): ParsedField<number> {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? { valid: true, value }
    : { valid: false, value: null };
}
```

Implementation chỉ đọc đúng năm field allowlist; key khác bị bỏ qua. JSON parse lỗi, array hoặc object không có field hợp lệ trả `null`.

Áp dụng translation bằng các lời gọi cụ thể:

```tsx
// DashboardInvitationCard.tsx
const activationT = useTranslations("dashboardActivation");
const activationLabel = activation === "paid"
  ? activationT("paid")
  : activation === "complimentary"
    ? activationT("complimentary")
    : null;
```

```tsx
// dashboard/[id]/thanh-toan/page.tsx
const t = await getTranslations("paymentActivation");
const title = result.activation === "paid" ? t("paidTitle") : t("complimentaryTitle");
const description = result.activation === "paid"
  ? t("paidDescription")
  : t("complimentaryDescription");
```

```tsx
// PaymentPanel.tsx
const t = useTranslations("paymentActivation");
// terminalState === "superseded": render t("priceChanged"),
// t("priceChangedDescription") và button t("reload").
```

Admin profile server component dùng `getTranslations("adminSupport")`; create/price client components dùng `useTranslations("adminSupport")`; support banner dùng `useTranslations("editor.support")`. Không thêm provider khác ở Task 10: provider keys đã được Task 6 cung cấp.

Không để literal mới `Được tặng miễn phí`, `Đặt giá`, `Lịch sử hỗ trợ` hoặc `Đang hỗ trợ tài khoản` trong TSX.

Chạy literal scan:

```bash
rg -n 'Được tặng miễn phí|Đặt giá|Lịch sử hỗ trợ|Đang hỗ trợ tài khoản' \
  src/app/admin/users src/app/admin/invitations src/app/dashboard src/app/editor
```

Expected: không có literal mới trong các TSX thuộc feature; các chuỗi chỉ tồn tại trong `messages/*.json`.

- [ ] **Step 5: Xác minh audit descriptions an toàn**

Admin profile dùng `parseAuditDetailsForDisplay(log.details)`. Map action code qua:

```ts
const auditKey = `audit.${log.action}` as Parameters<typeof t.has>[0];
const description = t.has(auditKey) ? t(auditKey) : log.action;
```

Chỉ render các field typed từ parser; không render `log.details`, JSON raw, password hash, session token hoặc bank fields. Chạy:

```bash
npx tsx --test src/lib/admin-audit-view.test.ts
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'malformed audit|snapshot after|invitation snapshot'
```

Expected: unit và E2E audit tests PASS; malformed details vẫn hiện action/admin/time, không hiện chuỗi nhạy cảm seed trong raw JSON.

- [ ] **Step 6: Chạy full feature E2E**

```bash
npx tsx --test src/lib/admin-audit-view.test.ts
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium
npx playwright test tests/e2e/dashboard-manage.spec.ts tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium
```

Expected: toàn bộ feature, checkout và webhook suites PASS.

- [ ] **Step 7: Commit finishing slice**

```bash
git add src/lib/admin-audit-view.ts src/lib/admin-audit-view.test.ts 'src/app/admin/users/[id]/page.tsx' src/app/dashboard/DashboardInvitationCard.tsx 'src/app/dashboard/[id]/thanh-toan/page.tsx' 'src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx' 'src/app/editor/[id]/EditorForm.tsx' tests/e2e/admin-invitation-support.spec.ts tests/e2e/payment-webhook.spec.ts tests/e2e/helpers/fixtures.ts
git commit -m "test(admin): cover invitation support invariants"
```

---

### Task 11: Chạy migration rehearsal và toàn bộ quality gates

**Files:**
- Verify only; chỉ sửa file nếu gate tìm thấy regression thuộc phạm vi tính năng.

- [ ] **Step 1: Kiểm tra diff scope và whitespace**

```bash
feature_base=d46e89ac6f0d606951fcc02c220ad764e7c79dd4
git merge-base --is-ancestor "$feature_base" HEAD
test -z "$(git status --porcelain)"
git diff --check "$feature_base"..HEAD
git diff --stat "$feature_base"..HEAD
git log --oneline "$feature_base"..HEAD
```

Expected: feature base chính xác là ancestor, worktree sạch, không có whitespace error; diff chỉ gồm các file được liệt kê trong plan và thay đổi tiền đề đã được nhận diện rõ. Không giả định số commit cố định vì plan có 11 task/commit và execution worktree có thể chứa commit tiền đề được bảo toàn.

- [ ] **Step 2: Rehearse migration trên snapshot tạm**

```bash
support_dir=$(mktemp -d /tmp/chungdoi-admin-support-final.XXXXXX)
mkdir -p "$support_dir/prisma"
support_db="$support_dir/support.db"
cp prisma/schema.prisma "$support_dir/prisma/schema.prisma"
cp -R prisma/migrations "$support_dir/prisma/migrations"
rm -rf "$support_dir/prisma/migrations/20260813090000_add_admin_invitation_support"
DATABASE_URL="file:$support_db" RUST_LOG=info \
  npx prisma migrate deploy --schema="$support_dir/prisma/schema.prisma"
python3 - "$support_db" <<'PY'
import sqlite3
import sys

connection = sqlite3.connect(sys.argv[1])
connection.execute(
    'INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    ('legacy-user', 'legacy@example.com', None),
)
connection.execute(
    '''INSERT INTO Invitation
       (id, userId, slug, templateId, status, paid, isDemo, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)''',
    ('legacy-invitation', 'legacy-user', None, 'song-hy-red', 'draft', 0, 0),
)
connection.commit()
PY
cp -R prisma/migrations/20260813090000_add_admin_invitation_support \
  "$support_dir/prisma/migrations/"
DATABASE_URL="file:$support_db" RUST_LOG=info \
  npx prisma migrate deploy --schema="$support_dir/prisma/schema.prisma"
python3 - "$support_db" <<'PY'
import sqlite3
import sys

connection = sqlite3.connect(sys.argv[1])
foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
quick_check = connection.execute("PRAGMA quick_check").fetchone()[0]
legacy = connection.execute(
    '''SELECT adminPriceOverride, complimentary, complimentaryAt
       FROM Invitation WHERE id = 'legacy-invitation' ''',
).fetchone()
assert foreign_keys == [], foreign_keys
assert quick_check == "ok", quick_check
assert legacy == (None, 0, None), legacy
print("quick_check=ok")
PY
```

Expected: migrations deploy thành công, `quick_check` trả `ok`, không có foreign-key rows.

- [ ] **Step 3: Chạy Prisma và unit/type gates**

```bash
npx prisma validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
```

Expected: tất cả exit 0.

- [ ] **Step 4: Chạy production build**

```bash
npm run build
```

Expected: Next.js 16 production build exit 0; không có lỗi dynamic params, server-action serialization hoặc next-intl missing message.

- [ ] **Step 5: Chạy E2E feature và regression trọng yếu lần cuối**

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts tests/e2e/admin.spec.ts tests/e2e/editor.spec.ts tests/e2e/dashboard-manage.spec.ts tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium
```

Expected: tất cả tests PASS. Lưu trace/screenshot chỉ khi failure để điều tra, không bỏ qua test.

- [ ] **Step 6: Review thủ công desktop/mobile**

Khởi động production server hoặc dùng Playwright đã build, rồi ghi checklist `PASS/FAIL` cho từng mục vào handoff:

```text
[ ] Desktop 1440×900: /admin/users search hoạt động, empty/search-empty khác nhau.
[ ] Mobile 390×844: /admin/users và /admin/users/{id} không tràn ngang.
[ ] Keyboard only: mở/đóng template picker và price dialog, focus quay về trigger.
[ ] Support editor: banner luôn hiện đúng email và back link đúng user.
[ ] Golden path: create → save → publish → set 79.000đ → grant 0đ → reset cập nhật UI sau từng bước.
[ ] Dashboard: paid và complimentary có nhãn khác nhau; complimentary không có CTA/trial countdown.
```

Nếu mục nào FAIL, ghi route, viewport, bước tái hiện và sửa trong file thuộc feature; chạy lại gate liên quan trước khi chuyển Step 7.

- [ ] **Step 7: Ghi kết quả và bàn giao, không tự deploy**

Tạo handoff trong final response theo mẫu thực tế (không tạo file mới):

```text
Migration rehearsal: <command> — PASS/FAIL
Quality gates: <command + số pass thực tế cho từng suite>
Feature commits: <git log --oneline "$feature_base"..HEAD>
Preserved overlaps: <danh sách file + commit/patch tiền đề>
Manual QA: <6 dòng PASS/FAIL từ Step 6>
Deployment: NOT RUN — chờ yêu cầu riêng
```

Nếu người dùng yêu cầu deploy sau đó, dùng đúng runbook Mini PC, backup SQLite trước migration và deploy từ một source tree chỉ chứa feature đã duyệt.
