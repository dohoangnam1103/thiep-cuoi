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
- Worktree hiện tại có thay đổi chưa commit trùng vào `messages/*.json`, `src/app/editor/[id]/EditorForm.tsx` và một số file editor. Khi bắt đầu thực thi, dùng `superpowers:using-git-worktrees` và tạo một execution worktree an toàn. Nếu cần mang các thay đổi hiện tại ở file trùng sang execution worktree, lưu chúng thành patch tiền đề riêng; không reset, stage hoặc commit thay đổi của người dùng trong worktree gốc.
- `src/generated/prisma/` bị gitignore. Chạy `npm run prisma:generate` để kiểm tra/typecheck nhưng không stage generated client.
- Chỉ deploy khi người dùng yêu cầu riêng sau khi toàn bộ gate hoàn tất.

### Thứ tự thực thi bắt buộc

Thực thi theo thứ tự `Task 1 → Task 6 → Task 2 → Task 3 → Task 4 → Task 5 → Task 7 → Task 8 → Task 9 → Task 10 → Task 11`. Task 6 được đặt sớm hơn trong dependency order vì các client component ở Task 2–5 phải có message key và `NextIntlClientProvider` trước khi typecheck/runtime gate chạy; số task được giữ theo lát cắt thiết kế để liên kết spec dễ đọc.

## Bản đồ file

### File mới

- `prisma/migrations/20260813090000_add_admin_invitation_support/migration.sql` — migration entitlement, giá riêng và audit.
- `src/lib/invitation-entitlement.ts` — nguồn quyết định duy nhất cho trạng thái paid/complimentary/trial và expiry.
- `src/lib/invitation-entitlement.test.ts` — unit test entitlement.
- `src/lib/invitation-pricing.ts` — hàm thuần resolve giá hệ thống/override và validation giới hạn giá.
- `src/lib/invitation-pricing.test.ts` — unit test pricing.
- `src/lib/admin-support-input.ts` — normalize search, chặn user hệ thống và allowlist template dùng chung cho page/action.
- `src/lib/admin-support-input.test.ts` — unit test validation search/template/user đích.
- `src/lib/admin-audit.ts` — action constants, serialization details và hàm ghi audit trong transaction.
- `src/lib/admin-audit.test.ts` — unit test audit detail.
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
- `src/lib/payment-service.ts` — chỉ claim payment `pending`.
- `src/lib/trial-reminder.ts`, `scripts/send-trial-reminders.ts`, `src/app/api/cron/trial-reminders/route.ts` — bỏ qua thiệp complimentary.
- `src/app/api/casso/webhook/route.ts`, `src/app/api/payos/webhook/route.ts` — settlement tập trung và chặn payment superseded.
- `src/app/dashboard/[id]/thanh-toan/actions.ts`, `page.tsx`, `PaymentPanel.tsx` — dùng override, chặn checkout activated và xử lý superseded.
- `src/app/dashboard/page.tsx`, `DashboardInvitationCard.tsx` — hiển thị complimentary, không hiện trial/payment CTA.
- `src/app/thiep/[slug]/page.tsx` — complimentary không hết hạn.
- `src/app/editor/[id]/actions.ts`, `EditorForm.tsx`, `page.tsx`, `PublishSuccessDialog.tsx` — persistence dùng chung, entitlement và ba editor mode.
- `src/app/editor/[id]/content-schema.ts` — `EditorState` dùng error code ổn định; UI dịch code qua `editor.errors`.
- `src/app/admin/demos/[id]/page.tsx` — chuyển sang mode `demo-admin`.
- `src/app/admin/users/page.tsx` — tìm kiếm và liên kết hồ sơ.
- `src/app/admin/layout.tsx` — cung cấp message `adminSupport` cho client component Admin.
- `src/app/dashboard/layout.tsx` — cung cấp message activation/payment cho dashboard client component.
- `messages/{vi,en,ko,ja,zh}.json` — copy mới theo namespace `adminSupport`, `dashboardActivation`, `paymentActivation`, `editor.support` và `editor.errors`.
- `tests/e2e/helpers/fixtures.ts`, `tests/e2e/payment-webhook.spec.ts`, `tests/e2e/payos-webhook.spec.ts`, `tests/e2e/dashboard-manage.spec.ts` — fixtures và regression payment/entitlement.

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
  if (c.paid || c.complimentary) return false;
  if (!c.publishedAt || c.reminderSentAt || !c.email) return false;
  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt > nowMs && expiresAt <= nowMs + REMINDER_WINDOW_MS;
}
```

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

- [ ] **Step 5: Thay mọi expiry/payment CTA trực tiếp theo `paid` bằng activation**

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

- [ ] **Step 6: Chuyển editor và publish dialog sang activation**

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

- [ ] **Step 7: Chạy unit regression và typecheck**

```bash
npx tsx --test src/lib/invitation-entitlement.test.ts src/lib/trial-reminder.test.ts
npm run typecheck
```

Expected: tests PASS; typecheck exit 0 và không còn lỗi prop `paid` tại các call site của `EditorForm`/`DashboardInvitationCard`.

- [ ] **Step 8: Commit entitlement slice**

```bash
git add src/lib/invitation-entitlement.ts src/lib/invitation-entitlement.test.ts src/lib/trial-reminder.ts src/lib/trial-reminder.test.ts src/lib/to-demo-content.test.ts scripts/send-trial-reminders.ts src/app/api/cron/trial-reminders/route.ts 'src/app/thiep/[slug]/page.tsx' src/app/dashboard/page.tsx src/app/dashboard/DashboardInvitationCard.tsx 'src/app/editor/[id]/page.tsx' 'src/app/editor/[id]/EditorForm.tsx' 'src/app/editor/[id]/PublishSuccessDialog.tsx' 'src/app/admin/demos/[id]/page.tsx'
git commit -m "feat(invitation): support complimentary activation"
```

---

### Task 3: Resolve giá cuối cùng và bảo vệ checkout

**Files:**
- Create: `src/lib/invitation-pricing.ts`
- Create: `src/lib/invitation-pricing.test.ts`
- Modify: `src/lib/payment-config.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/actions.ts`
- Modify: `src/app/dashboard/[id]/thanh-toan/page.tsx`
- Modify: `src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx`
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

- [ ] **Step 5: Làm checkout transaction-safe và không tạo payment cho thiệp activated**

Trong actions thanh toán, định nghĩa:

```ts
export type CheckoutPreparation =
  | { kind: "activated"; activation: "paid" | "complimentary" }
  | { kind: "payment"; payment: PaymentInfo };
```

`createOrGetPayment` phải dùng một interactive transaction để đọc entitlement, tái sử dụng/tạo payment và resolve giá:

```ts
export async function createOrGetPayment(invitationId: string): Promise<CheckoutPreparation> {
  const { userId } = await verifySession();
  const provider = getPaymentProvider();

  const result = await prisma.$transaction(async (db) => {
    const invitation = await db.invitation.findFirst({
      where: { id: invitationId, userId },
      select: {
        paid: true,
        complimentary: true,
        adminPriceOverride: true,
      },
    });
    if (!invitation) throw new Error("Không tìm thấy thiệp");
    if (invitation.paid) return { kind: "activated" as const, activation: "paid" as const };
    if (invitation.complimentary) {
      return { kind: "activated" as const, activation: "complimentary" as const };
    }

    const existing = await db.payment.findFirst({
      where: { invitationId, status: "pending", provider },
      orderBy: { createdAt: "desc" },
    });
    if (existing && !isPendingPaymentExpired(existing.createdAt)) {
      return {
        kind: "payment" as const,
        payment: existing,
        voucherAllowed: invitation.adminPriceOverride === null,
      };
    }

    const amount = await getPriceForInvitation(db, userId, invitationId);
    if (amount <= 0) {
      throw new Error("INVALID_COMPLIMENTARY_STATE");
    }
    const payment = await db.payment.create({
      data: {
        invitationId,
        code: genOrderCode(),
        amount,
        provider,
        providerOrderCode: provider === "payos" ? genPayosOrderCode() : null,
      },
    });
    return {
      kind: "payment" as const,
      payment,
      voucherAllowed: invitation.adminPriceOverride === null,
    };
  });

  if (result.kind === "activated") return result;
  const prepared = await preparePayment(result.payment);
  return {
    kind: "payment",
    payment: paymentInfo(prepared, result.voucherAllowed),
  };
}
```

Page thanh toán bỏ nhánh đọc `invitation.paid` riêng và luôn gọi đúng một lần `createOrGetPayment(id)`. Nó render activated state khi transaction trả `kind: "activated"`, kể cả activation đổi ngay trước request; không gọi `PaymentPanel` trong nhánh này. Copy lấy từ `getTranslations("paymentActivation")`.

- [ ] **Step 6: Chặn voucher làm giảm tiếp “giá cuối cùng” của Admin**

Thêm `voucherAllowed: boolean` vào `PaymentInfo`. `createOrGetPayment` phải select thêm `adminPriceOverride`, return internal result `{ payment, voucherAllowed: invitation.adminPriceOverride === null }`, rồi gọi helper sau transaction:

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

Trong `applyVoucherToPayment`, query payment kèm:

```ts
include: {
  invitation: {
    select: { userId: true, adminPriceOverride: true },
  },
},
```

Sau authorization, từ chối:

```ts
if (payment.invitation.adminPriceOverride !== null) {
  return { ok: false, errorCode: "customPriceVoucherBlocked" };
}
```

`PaymentPanel` chỉ render input voucher khi `payment.voucherAllowed` và chưa có `voucherCode`.

Đổi `VoucherResult` từ free-form message sang contract chính xác sau:

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
```

Mọi nhánh lỗi hiện tại map theo đúng thứ tự guard sang các code trên. Bổ sung toàn bộ keys vào `paymentActivation.errors` của cả năm catalog; `PaymentPanel` chỉ render `t(`errors.${result.errorCode}`)`. Không trả copy tiếng Việt trực tiếp từ action mới/refactor.

Toàn bộ validate voucher và update/create replacement phải chạy trong một interactive transaction. Trong transaction, re-read payment với điều kiện `status: "pending"`, re-read `invitation.adminPriceOverride`, voucher active/expiry/uses, rồi mới update. Như vậy Admin đổi giá đồng thời không thể bị một action voucher đang bay ghi đè. Với payOS, transaction tạo replacement và đổi old payment local sang `cancelled` để giữ semantics voucher hiện tại; lời gọi `ensurePayosPaymentRequest` chạy sau commit, và nếu provider create thất bại thì mark replacement `failed` như behavior hiện tại. Admin price action ở Task 5 sẽ supersede cả `pending` và `cancelled`, nên sau khi Admin đổi giá không còn payment cũ nào settle được.

- [ ] **Step 7: Viết E2E regression cho override và complimentary checkout**

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

- [ ] **Step 8: Chạy unit, E2E slice và typecheck**

```bash
npx tsx --test src/lib/invitation-pricing.test.ts
npm run typecheck
npx playwright test tests/e2e/dashboard-manage.spec.ts --project=chromium --grep 'final price|complimentary invitation'
```

Expected: unit tests PASS, typecheck exit 0, 2 E2E tests PASS.

- [ ] **Step 9: Commit pricing slice**

```bash
git add src/lib/invitation-pricing.ts src/lib/invitation-pricing.test.ts src/lib/payment-config.ts 'src/app/dashboard/[id]/thanh-toan/actions.ts' 'src/app/dashboard/[id]/thanh-toan/page.tsx' 'src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx' tests/e2e/helpers/fixtures.ts tests/e2e/dashboard-manage.spec.ts
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
- Modify: `src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx`
- Modify: `tests/e2e/payment-webhook.spec.ts`
- Modify: `tests/e2e/payos-webhook.spec.ts`

- [ ] **Step 1: Viết unit test đang đỏ cho tập trạng thái settleable**

Tạo `src/lib/payment-settlement.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { isPaymentSettleable } from "./payment-settlement";

test("only pending and legacy voucher-cancelled payments may settle", () => {
  assert.equal(isPaymentSettleable("pending"), true);
  assert.equal(isPaymentSettleable("cancelled"), true);
  assert.equal(isPaymentSettleable("superseded"), false);
  assert.equal(isPaymentSettleable("failed"), false);
  assert.equal(isPaymentSettleable("paid"), false);
});
```

- [ ] **Step 2: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/payment-settlement.test.ts
```

Expected: FAIL vì module chưa tồn tại.

- [ ] **Step 3: Viết helper và siết conditional claim chống race**

Tạo `src/lib/payment-settlement.ts`:

```ts
export const SETTLEABLE_PAYMENT_STATUSES = ["pending", "cancelled"] as const;

export function isPaymentSettleable(status: string): boolean {
  return (SETTLEABLE_PAYMENT_STATUSES as readonly string[]).includes(status);
}
```

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

- [ ] **Step 4: Viết E2E characterization cho payment `superseded`**

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

- [ ] **Step 5: Chạy unit và hai E2E characterization tests**

```bash
npx tsx --test src/lib/payment-settlement.test.ts
npx playwright test tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium --grep 'superseded'
```

Expected: unit test và cả hai E2E tests PASS. E2E là characterization của bất biến route; unit test là test đỏ/đỏ→xanh cho helper mới và conditional claim được review cùng implementation.

Trong `reconcilePayosPayment`, return sớm nếu local payment không còn settleable:

```ts
if (!isPaymentSettleable(payment.status)) {
  return payment.status === "paid" ? "paid" : "cancelled";
}
```

- [ ] **Step 6: Cho Casso dùng settlement service chung**

Thay transaction thủ công trong Casso route bằng:

```ts
const result = await markPaymentPaid(payment.id, received);
if (result.updated && result.slug) {
  revalidatePath(`/thiep/${result.slug}`);
}
```

Giữ điều kiện signature, provider, `status === "pending"`, expiry và amount hiện có trước lời gọi. Import `markPaymentPaid` từ `@/lib/payment-service`. Cách này đảm bảo Casso và payOS dùng cùng conditional claim trong transaction.

- [ ] **Step 7: Chặn tạo link payOS cho payment vừa bị supersede**

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

- [ ] **Step 8: Trả trạng thái superseded cho polling và UI**

Status route đã trả `payment.status` ở cuối; giữ `superseded` nguyên trạng. Trong `PaymentPanel`, thay boolean expired đơn bằng state:

```ts
type PaymentTerminalState = "active" | "paid" | "expired" | "superseded";
```

Khi poll nhận `superseded`, dừng interval và render card có copy `paymentActivation.priceChanged` cùng nút `router.refresh()` để lấy giá mới. Không phát event `purchase`.

- [ ] **Step 9: Chạy toàn bộ unit/payment regression**

```bash
npx tsx --test src/lib/payment-settlement.test.ts
npx playwright test tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts --project=chromium
```

Expected: toàn bộ Casso/payOS tests PASS, gồm pending settlement và superseded rejection.

- [ ] **Step 10: Commit settlement hardening**

```bash
git add src/lib/payment-settlement.ts src/lib/payment-settlement.test.ts src/lib/payment-service.ts src/app/api/casso/webhook/route.ts src/app/api/payos/webhook/route.ts 'src/app/api/payment/[code]/status/route.ts' 'src/app/dashboard/[id]/thanh-toan/actions.ts' 'src/app/dashboard/[id]/thanh-toan/page.tsx' 'src/app/dashboard/[id]/thanh-toan/PaymentPanel.tsx' tests/e2e/payment-webhook.spec.ts tests/e2e/payos-webhook.spec.ts
git commit -m "fix(payment): reject superseded payment settlements"
```

---

### Task 5: Tạo audit primitives và Admin price/create actions

**Files:**
- Create: `src/lib/admin-audit.ts`
- Create: `src/lib/admin-audit.test.ts`
- Create: `src/lib/admin-support-input.ts`
- Create: `src/lib/admin-support-input.test.ts`
- Create: `src/app/admin/users/[id]/actions.ts`
- Modify: `src/lib/admin-dal.ts`
- Modify: `src/lib/payment-service.ts`

- [ ] **Step 1: Viết audit unit tests đang đỏ**

Tạo `src/lib/admin-audit.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_AUDIT_ACTIONS,
  changedEditorGroups,
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

test("changed editor groups reveal categories but never field values", () => {
  assert.deepEqual(
    changedEditorGroups(
      { brideFullName: "Mai", address: "Old", templateId: "song-hy-red" },
      { brideFullName: "Lan", address: "New", templateId: "song-hy-red" },
    ),
    ["couple", "venue"],
  );
});
```

- [ ] **Step 2: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/admin-audit.test.ts
```

Expected: FAIL vì module chưa tồn tại.

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

const EDITOR_AUDIT_GROUPS = {
  appearance: ["templateId", "primaryColor", "fontFamily", "music", "albumLayout"],
  couple: [
    "brideFullName", "groomFullName", "brideShortName", "groomShortName",
    "brideBirthOrder", "groomBirthOrder", "brideZodiac", "groomZodiac", "brideFirst",
  ],
  event: [
    "date", "time", "ceremonyDate", "ceremonyTime", "ceremonyHeader",
    "ceremonyType", "openingMessage", "banquetTime", "ceremonies", "schedule",
  ],
  family: [
    "brideFather", "brideMother", "brideAddress", "groomFather", "groomMother",
    "groomAddress", "brideParentTitle", "groomParentTitle",
  ],
  venue: ["address", "mapAddress"],
  gift: [
    "brideBankName", "brideAccountNumber", "brideAccountName",
    "groomBankName", "groomAccountNumber", "groomAccountName",
  ],
  media: ["heroImage", "heroImage2", "showHeroImage", "dressCodeColors", "gallery"],
} as const;

export type EditorAuditGroup = keyof typeof EDITOR_AUDIT_GROUPS;

export function changedEditorGroups(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): EditorAuditGroup[] {
  return (Object.keys(EDITOR_AUDIT_GROUPS) as EditorAuditGroup[]).filter((group) =>
    EDITOR_AUDIT_GROUPS[group].some(
      (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    ),
  );
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

- [ ] **Step 7: Viết create invitation action**

Trong `src/app/admin/users/[id]/actions.ts`, import `parseAdminTemplateId`/`SYSTEM_EMAIL` từ `@/lib/admin-support-input`, và viết action:

```ts
export async function createInvitationForUser(
  userId: string,
  _previous: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const { adminId, adminEmail } = await verifyAdmin();
  const templateId = parseAdminTemplateId(formData.get("templateId"));
  if (!templateId) {
    return { ok: false, errorCode: "invalidTemplate" };
  }

  const invitation = await prisma.$transaction(async (db) => {
    const user = await db.user.findFirst({
      where: { id: userId, NOT: { email: SYSTEM_EMAIL } },
      select: { id: true, email: true },
    });
    if (!user) throw new AdminSupportMutationError("userNotFound");

    const created = await db.invitation.create({
      data: {
        userId: user.id,
        templateId,
        status: "draft",
        content: { create: {} },
      },
    });
    await writeAdminAudit(db, {
      adminId,
      adminEmail,
      targetUserId: user.id,
      targetUserEmail: user.email,
      invitationId: created.id,
      action: ADMIN_AUDIT_ACTIONS.invitationCreated,
      details: { templateId: created.templateId },
    });
    return created;
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/dashboard");
  redirect(`/admin/invitations/${invitation.id}/edit`);
}
```

Với:

```ts
type CreateInvitationErrorCode = "invalidTemplate" | "userNotFound";

export type CreateInvitationState =
  | { ok: false; errorCode: CreateInvitationErrorCode }
  | undefined;

class AdminSupportMutationError extends Error {
  constructor(readonly code: Extract<CreateInvitationErrorCode, "userNotFound">) {
    super(code);
    this.name = "AdminSupportMutationError";
  }
}
```

Bao transaction bằng `try/catch`, nhưng để `redirect` ở ngoài `try` theo Next.js 16. Catch riêng `AdminSupportMutationError` và trả `{ ok: false, errorCode: error.code }`; rethrow lỗi không xác định. Client template picker dùng `useActionState` và dịch `adminSupport.errors.*`. Thành công redirect nên không cần return state. Không trả/throw copy tiếng Việt từ action.

Đặt `revalidatePath` trước `redirect` vì `redirect` ném control-flow exception trong Next.js 16.

- [ ] **Step 8: Viết price mutation transaction-safe**

Trong cùng file, import `adminFinalPriceSchema` từ `@/lib/invitation-pricing` và dùng schema:

```ts
const priceMutationSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("set"),
    invitationId: z.string().min(1),
    finalPrice: adminFinalPriceSchema,
  }),
  z.object({
    mode: z.literal("reset"),
    invitationId: z.string().min(1),
  }),
]);

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

class AdminPriceMutationError extends Error {
  constructor(readonly code: Exclude<PriceMutationErrorCode, "invalidPrice">) {
    super(code);
    this.name = "AdminPriceMutationError";
  }
}
```

Signature action phải bind user đích ở server component, không đọc user đích từ form:

```ts
export async function updateInvitationPrice(
  targetUserId: string,
  _previous: PriceMutationState,
  formData: FormData,
): Promise<PriceMutationState>;
```

`updateInvitationPrice` phải thực hiện theo thứ tự trong một transaction:

1. Xác thực Admin.
2. Parse `mode`, `invitationId`, `finalPrice`.
3. Query thiệp thật bằng cả `id = invitationId`, `userId` route-bound và `isDemo = false`, kèm user snapshot + mọi payment pending. `updateInvitationPrice` nhận `userId` bằng bind từ profile page; không tin `userId` từ hidden input.
4. Từ chối nếu `paid = true`.
5. Tính after state: reset → `null/false/null`; set 0 → `0/true/now`; set dương → `price/false/null`.
6. Query ban đầu phải select `updatedAt`. Gọi `updateMany({ where: { id, userId: targetUserId, isDemo: false, paid: false, updatedAt: invitation.updatedAt }, data: nextState })`; count phải bằng 1. Nếu webhook đặt `paid=true` hoặc bất kỳ mutation nào đổi thiệp giữa read/write, `updatedAt` thay đổi và transaction trả `{ ok: false, errorCode: "concurrentChange" }` mà không supersede payment hay ghi audit.
7. Đã query `pendingPayments` bằng `status: { in: ["pending", "cancelled"] }`; gọi `payment.updateMany({ where: { invitationId, status: { in: ["pending", "cancelled"] } }, data: { status: "superseded" } })` để vô hiệu cả QR gốc lẫn payment voucher cũ.
8. Ghi `PRICE_OVERRIDE_SET` hoặc `PRICE_OVERRIDE_CLEARED`; ghi thêm `COMPLIMENTARY_GRANTED`/`COMPLIMENTARY_REVOKED` khi boolean đổi.
9. Return danh sách pending payment đã đọc để huỷ payOS sau commit.

Phần after state phải dùng object chính xác:

```ts
const reset = parsed.data.mode === "reset";
const finalPrice = reset ? null : parsed.data.finalPrice;
const nextComplimentary = finalPrice === 0;
const nextState = {
  adminPriceOverride: finalPrice,
  complimentary: nextComplimentary,
  complimentaryAt: nextComplimentary ? new Date() : null,
};
```

Ngay sau `updateMany`, kiểm tra:

```ts
if (updated.count !== 1) {
  throw new AdminPriceMutationError("concurrentChange");
}
```

Parse lỗi trả `invalidPrice`; user/thiệp/paid/concurrent trả code tương ứng qua `AdminPriceMutationError`. Catch ngoài transaction chỉ chuyển class này thành `{ ok: false, errorCode: error.code }`; rethrow lỗi không xác định. Action price không redirect. `InvitationPriceDialog` dịch bằng `t(`errors.${state.errorCode}`)`.

Sau transaction:

```ts
await Promise.all(
  result.pendingPayments
    .filter((payment) => payment.provider === "payos")
    .map((payment) => cancelPayosPayment(payment, "admin_price_changed")),
);
revalidatePath(`/admin/users/${result.userId}`);
revalidatePath("/dashboard");
if (result.slug) revalidatePath(`/thiep/${result.slug}`);
return {
  ok: true,
  activation: result.complimentary ? "complimentary" : "trial",
  finalPrice: result.adminPriceOverride,
};
```

- [ ] **Step 9: Chạy unit và typecheck**

```bash
npx tsx --test src/lib/admin-audit.test.ts src/lib/admin-support-input.test.ts
npm run typecheck
```

Expected: audit tests PASS; typecheck exit 0.

- [ ] **Step 10: Commit action/domain slice**

```bash
git add src/lib/admin-audit.ts src/lib/admin-audit.test.ts src/lib/admin-support-input.ts src/lib/admin-support-input.test.ts src/lib/admin-dal.ts src/lib/payment-service.ts 'src/app/admin/users/[id]/actions.ts'
git commit -m "feat(admin): add audited invitation price controls"
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

- [ ] **Step 2: Chạy tests để xác nhận đỏ**

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'search users|cannot open|system user'
```

Expected: detail route 404 hoặc link/profile assertions FAIL.

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
    {/* Next Image preview và label */}
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

- [ ] **Step 7: Viết E2E create/price/audit tests**

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

- [ ] **Step 8: Chạy admin support UI slice**

```bash
npm run typecheck
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'search users|creates an invitation|final price|complimentary'
```

Expected: typecheck exit 0; selected tests PASS.

- [ ] **Step 9: Commit profile/UI slice**

```bash
git add src/app/admin/users/page.tsx 'src/app/admin/users/[id]/page.tsx' 'src/app/admin/users/[id]/AdminCreateInvitationButton.tsx' 'src/app/admin/users/[id]/InvitationPriceDialog.tsx' tests/e2e/admin-invitation-support.spec.ts tests/e2e/helpers/fixtures.ts
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

- [ ] **Step 1: Viết tests cho validation publication/slug đang đỏ**

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

- [ ] **Step 2: Chạy unit test để xác nhận đỏ**

```bash
npx tsx --test src/lib/invitation-editor-rules.test.ts
```

Expected: FAIL vì rules module chưa tồn tại.

- [ ] **Step 3: Tạo pure editor rules**

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

- [ ] **Step 4: Tạo prepare/write service không chứa auth**

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

- [ ] **Step 5: Refactor owner actions qua store nhưng giữ cổng quyền**

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

- [ ] **Step 6: Chạy unit, owner editor E2E và typecheck**

```bash
npx tsx --test src/lib/invitation-editor-rules.test.ts 'src/app/editor/[id]/content-schema.test.ts' 'src/app/editor/[id]/slug.test.ts'
npm run typecheck
npx playwright test tests/e2e/editor.spec.ts --project=chromium --grep 'owner opens editor|hydrates existing content|publish validation|publishes'
```

Expected: unit tests PASS; typecheck exit 0; owner editor regression PASS.

- [ ] **Step 7: Commit editor service refactor**

```bash
git add src/lib/invitation-editor-rules.ts src/lib/invitation-editor-rules.test.ts src/lib/invitation-editor-store.ts 'src/app/editor/[id]/actions.ts' 'src/app/editor/[id]/content-schema.ts'
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
    await page.goto(`/admin/invitations/${demo.id}/edit`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  } finally {
    cleanupUser(user.id);
  }
});
```

- [ ] **Step 2: Chạy tests để xác nhận đỏ**

```bash
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'edits and publishes|rejects demo'
```

Expected: route 404 và happy-path FAIL.

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

Mỗi export bắt đầu bằng `verifyAdmin()`. Save flow:

1. `prepareInvitationDraft(formData)` ngoài transaction.
2. Trong transaction query `Invitation` với `{ id, isDemo: false }` và user snapshot.
3. `writeInvitationDraft`.
4. Gọi audit cùng transaction bằng object đầy đủ:

```ts
await writeAdminAudit(db, {
  adminId,
  adminEmail,
  targetUserId: invitation.user.id,
  targetUserEmail: invitation.user.email,
  invitationId: invitation.id,
  action: ADMIN_AUDIT_ACTIONS.invitationUpdated,
  details: {
    changedGroups: changedEditorGroups(contentSnapshot, {
      ...prepared.data.persistedData,
      ceremonies: prepared.data.ceremonies,
      schedule: prepared.data.schedule,
      gallery: prepared.data.gallery,
    }),
    before: { templateId: invitation.templateId },
    after: { templateId: prepared.data.templateId },
  },
});
```

Ngay sau query, tạo `contentSnapshot` chính xác bằng `{ templateId: invitation.templateId, ...invitation.content, ceremonies: invitation.ceremonies, schedule: invitation.schedule, gallery: invitation.gallery.map((item) => item.url) }`. Object này chỉ dùng làm input cho `changedEditorGroups`; tuyệt đối không ghi snapshot hoặc giá trị field vào audit. Import `changedEditorGroups` từ `@/lib/admin-audit`.

5. Revalidate profile, admin editor, owner editor và dashboard.

Publish flow validate required fields và slug trước write. Trong transaction, check collision bằng slug unique query, tạo cùng `contentSnapshot`, write content, update status/slug/publishedAt, rồi audit action `INVITATION_PUBLISHED_BY_ADMIN` nếu status cũ chưa published; nếu đã published dùng `INVITATION_UPDATED_BY_ADMIN`. Audit details dùng cùng `changedGroups` an toàn như save và thêm `before.status`/`after.status`, `before.slug`/`after.slug`; không ghi tên, địa chỉ, bank hoặc nội dung đầy đủ. Return `publishedSlug` và `publishedAt` như owner action.

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

Narrow union trước khi chọn action; default chỉ tồn tại ở owner branch:

```ts
const editorMode = mode ?? "owner";
const ownerMode = editorMode === "owner";
const demoMode = editorMode === "demo-admin";
const supportMode = editorMode === "support-admin";

const effectiveSaveAction = (
  ownerMode ? saveDraft : props.saveAction
).bind(null, invitationId);
const effectivePublishAction = (
  supportMode ? props.publishAction : publish
).bind(null, invitationId);
const effectiveCheckSlug = supportMode ? props.checkSlugAction : checkSlug;
const effectiveResolveMap = supportMode
  ? props.resolveMapAction
  : resolveGoogleMapsLink;
```

Không dựng `useActionState` cho publish trong `demoMode`; tách một child component cho publish section hoặc dùng action no-op nội bộ không export/không gắn vào form. Mục tiêu là `saveDemo` không bao giờ vô tình nhận submit xuất bản.

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

Đổi outer `EditorForm` restore logic thành:

```ts
const ownerMode = (props.mode ?? "owner") === "owner";
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

- [ ] **Step 6: Chạy support/owner/demo editor regressions**

```bash
npm run typecheck
npx playwright test tests/e2e/admin-invitation-support.spec.ts --project=chromium --grep 'edits and publishes|rejects demo'
npx playwright test tests/e2e/editor.spec.ts tests/e2e/admin.spec.ts --project=chromium --grep 'owner opens editor|demo edit page loads'
```

Expected: typecheck exit 0; support, owner và demo tests PASS.

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
feature_base=$(git merge-base HEAD origin/master)
git status --short
git diff --check
git diff --stat "$feature_base"..HEAD
```

Expected: không có whitespace error; diff chỉ gồm các file được liệt kê trong plan và thay đổi tiền đề đã được nhận diện rõ. Không giả định số commit cố định vì plan có 11 task/commit và execution worktree có thể chứa commit tiền đề được bảo toàn.

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
