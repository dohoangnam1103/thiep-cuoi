# Email nhắc thanh toán ngày cuối dùng thử — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gửi email tiếng Việt nhắc user thanh toán khi thiệp còn 24h cuối của thời gian dùng thử miễn phí, dùng Resend gói free + cron trên minipc.

**Architecture:** Một cột `reminderSentAt` mới trên `Invitation` chống gửi trùng. Một hàm thuần (`shouldSendReminder`) quyết định thiệp nào đủ điều kiện — test được không cần DB. Một module `email.ts` bọc Resend + build HTML đẹp. Một script standalone (`scripts/send-trial-reminders.ts`) quét DB, gửi, đánh dấu — cắm vào crontab 9h sáng.

**Tech Stack:** Next.js 16, Prisma 7 + SQLite (better-sqlite3 adapter), Resend SDK, `tsx` để chạy script + test (`node:test`).

## Global Constraints

- TypeScript strict mode, KHÔNG dùng `any`.
- Named exports, camelCase utils, PascalCase components.
- Mọi copy tiếng Việt (chỉ tiếng Việt cho email này, không đa ngôn ngữ).
- Test framework: `node:test` + `node:assert/strict`, chạy bằng `npm run test:unit` (`tsx --test "src/**/*.test.ts"`).
- Prisma client cho app import từ `@/lib/prisma`. Script standalone tự tạo client qua `PrismaBetterSqlite3` adapter (xem `scripts/seed-demos.ts`).
- `RESEND_API_KEY` chỉ để trong `.env` trên server, KHÔNG commit key thật vào git.
- From email: `noreply@thiepmungonline.com` (domain đã verify trên Resend).
- Trial hiện tại: `FREE_TRIAL_MS` từ `@/lib/trial` (`publishedAt + 3 ngày`).
- Absolute URL: `absoluteUrl(path)` từ `@/lib/site-url`.

---

### Task 1: Thêm cột `reminderSentAt` vào Invitation (migration)

**Files:**
- Modify: `prisma/schema.prisma` (model `Invitation`, quanh dòng 36 `publishedAt`)
- Create: `prisma/migrations/<timestamp>_add_reminder_sent_at/migration.sql` (do `prisma migrate` sinh)

**Interfaces:**
- Produces: field `Invitation.reminderSentAt: DateTime?` — các task sau đọc/ghi field này.

- [ ] **Step 1: Thêm field vào schema**

Trong `prisma/schema.prisma`, model `Invitation`, thêm dòng ngay dưới `publishedAt DateTime?`:

```prisma
  publishedAt       DateTime?
  reminderSentAt    DateTime?
  createdAt         DateTime  @default(now())
```

- [ ] **Step 2: Tạo migration + generate client**

Run: `npm run prisma:migrate -- --name add_reminder_sent_at`
Expected: migration mới được tạo trong `prisma/migrations/`, Prisma client regenerate, không lỗi. Nếu prompt tên thì đã truyền qua `--name`.

- [ ] **Step 3: Verify client có field mới**

Run: `npx tsc --noEmit -e "import type { Invitation } from '@/generated/prisma/client'; const x: Invitation['reminderSentAt'] = null; void x;"` — nếu lệnh inline không chạy được, thay bằng: `grep -n "reminderSentAt" src/generated/prisma/models/Invitation.ts`
Expected: tìm thấy `reminderSentAt` trong model đã generate.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat(db): add reminderSentAt column to Invitation"
```

---

### Task 2: Hàm thuần chọn thiệp đủ điều kiện gửi

**Files:**
- Create: `src/lib/trial-reminder.ts`
- Test: `src/lib/trial-reminder.test.ts`

**Interfaces:**
- Consumes: `FREE_TRIAL_MS` từ `@/lib/trial`.
- Produces:
  - type `ReminderCandidate = { paid: boolean; publishedAt: Date | null; reminderSentAt: Date | null; email: string | null }`
  - `shouldSendReminder(c: ReminderCandidate, now: Date): boolean` — true khi TẤT CẢ: `!paid`, `publishedAt != null`, `reminderSentAt == null`, `email` không rỗng, và thời điểm hết hạn (`publishedAt + FREE_TRIAL_MS`) nằm trong `(now, now + 24h]`.
  - `REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/trial-reminder.test.ts`:

```typescript
import assert from "node:assert/strict";
import test from "node:test";

import { FREE_TRIAL_MS } from "./trial";
import { shouldSendReminder, REMINDER_WINDOW_MS, type ReminderCandidate } from "./trial-reminder";

const now = new Date("2026-07-24T09:00:00.000Z");

function candidate(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  // publishedAt sao cho hết hạn đúng 12h nữa (nằm trong cửa sổ 24h)
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
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/trial-reminder.test.ts`
Expected: FAIL — không import được `./trial-reminder` (module chưa tồn tại).

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `src/lib/trial-reminder.ts`:

```typescript
import { FREE_TRIAL_MS } from "@/lib/trial";

export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  paid: boolean;
  publishedAt: Date | null;
  reminderSentAt: Date | null;
  email: string | null;
};

export function shouldSendReminder(c: ReminderCandidate, now: Date): boolean {
  if (c.paid) return false;
  if (!c.publishedAt) return false;
  if (c.reminderSentAt) return false;
  if (!c.email) return false;

  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt > nowMs && expiresAt <= nowMs + REMINDER_WINDOW_MS;
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/trial-reminder.test.ts`
Expected: PASS — tất cả 8 test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/trial-reminder.ts src/lib/trial-reminder.test.ts
git commit -m "feat: add shouldSendReminder pure filter for trial reminders"
```

---

### Task 3: Module email (Resend + HTML đẹp)

**Files:**
- Create: `src/lib/email.ts`
- Test: `src/lib/email.test.ts`
- Modify: `package.json` (thêm dep `resend`)

**Interfaces:**
- Consumes: `absoluteUrl` từ `@/lib/site-url`.
- Produces:
  - `buildTrialReminderEmail(input: { recipientName: string; cardName: string; payUrl: string }): { subject: string; html: string }` — hàm thuần build nội dung, test được không cần gọi Resend.
  - `sendTrialReminderEmail(input: { to: string; recipientName: string; cardName: string; invitationId: string }): Promise<void>` — build payUrl bằng `absoluteUrl` rồi gửi qua Resend. Throw nếu Resend trả lỗi.
  - `TRIAL_REMINDER_FROM = "ChungDoi <noreply@thiepmungonline.com>"`

- [ ] **Step 1: Cài Resend**

Run: `npm install resend`
Expected: `resend` xuất hiện trong `package.json` dependencies, không lỗi.

- [ ] **Step 2: Viết test thất bại cho hàm build nội dung**

Tạo `src/lib/email.test.ts`:

```typescript
import assert from "node:assert/strict";
import test from "node:test";

import { buildTrialReminderEmail } from "./email";

test("subject chứa tên thiệp", () => {
  const { subject } = buildTrialReminderEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(subject.includes("Thạch & Jade"), `subject: ${subject}`);
});

test("html chứa tên người nhận, tên thiệp và link thanh toán", () => {
  const { html } = buildTrialReminderEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(html.includes("Thạch"), "thiếu tên người nhận");
  assert.ok(html.includes("Thạch & Jade"), "thiếu tên thiệp");
  assert.ok(html.includes("https://thiepmungonline.com/dashboard/abc/thanh-toan"), "thiếu link");
  assert.ok(html.includes("<table"), "phải là email table-based");
});

test("html escape ký tự đặc biệt trong tên", () => {
  const { html } = buildTrialReminderEmail({
    recipientName: "A<b>",
    cardName: "X & Y",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(!html.includes("A<b>"), "tên chưa được escape");
  assert.ok(html.includes("A&lt;b&gt;"), "escape sai");
});
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/email.test.ts`
Expected: FAIL — không import được `buildTrialReminderEmail`.

- [ ] **Step 4: Viết implementation**

Tạo `src/lib/email.ts`:

```typescript
import { Resend } from "resend";

import { absoluteUrl } from "@/lib/site-url";

export const TRIAL_REMINDER_FROM = "ChungDoi <noreply@thiepmungonline.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTrialReminderEmail(input: {
  recipientName: string;
  cardName: string;
  payUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(input.recipientName || "bạn");
  const card = escapeHtml(input.cardName);
  const url = input.payUrl;
  const subject = `Thiệp cưới "${input.cardName}" — Hôm nay là ngày cuối dùng thử`;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(190,24,93,0.12);">
        <tr><td style="background:linear-gradient(135deg,#ec4899,#f472b6);padding:32px 32px 24px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">ChungDoi</div>
          <div style="margin-top:8px;font-size:14px;color:#fce7f3;">Thiệp cưới online</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1f2937;">Chào <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
            Hôm nay là <strong>ngày cuối cùng</strong> dùng thử thiệp cưới
            <strong style="color:#be185d;">"${card}"</strong>. Sau hôm nay, thiệp sẽ tạm ẩn cho tới khi bạn thanh toán.
          </p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#374151;">
            Thanh toán ngay để giữ thiệp online mãi mãi và chia sẻ tới người thân nhé.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="border-radius:12px;background:#ec4899;">
              <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                Thanh toán ngay
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;text-align:center;">
            Hoặc mở link: <a href="${url}" style="color:#ec4899;">${url}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fdf2f8;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© ChungDoi — thiepmungonline.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

export async function sendTrialReminderEmail(input: {
  to: string;
  recipientName: string;
  cardName: string;
  invitationId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Thiếu RESEND_API_KEY");

  const resend = new Resend(apiKey);
  const payUrl = absoluteUrl(`/dashboard/${input.invitationId}/thanh-toan`);
  const { subject, html } = buildTrialReminderEmail({
    recipientName: input.recipientName,
    cardName: input.cardName,
    payUrl,
  });

  const { error } = await resend.emails.send({
    from: TRIAL_REMINDER_FROM,
    to: input.to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Resend lỗi: ${error.message}`);
  }
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/email.test.ts`
Expected: PASS — 3 test.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts src/lib/email.test.ts package.json package-lock.json
git commit -m "feat: add Resend email module with trial reminder template"
```

---

### Task 4: Hàm build tên thiệp từ content

**Files:**
- Modify: `src/lib/trial-reminder.ts`
- Modify: `src/lib/trial-reminder.test.ts`

**Interfaces:**
- Produces: `buildCardName(content: { brideShortName: string; groomShortName: string } | null): string` — trả `"Bride & Groom"`; nếu thiếu cả hai thì trả `"Thiệp cưới của bạn"`.

- [ ] **Step 1: Thêm test thất bại**

Thêm vào cuối `src/lib/trial-reminder.test.ts`:

```typescript
import { buildCardName } from "./trial-reminder";

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
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/trial-reminder.test.ts`
Expected: FAIL — `buildCardName` chưa tồn tại.

- [ ] **Step 3: Thêm implementation**

Thêm vào cuối `src/lib/trial-reminder.ts`:

```typescript
export function buildCardName(
  content: { brideShortName: string; groomShortName: string } | null,
): string {
  const parts = [content?.brideShortName, content?.groomShortName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" & ") : "Thiệp cưới của bạn";
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/trial-reminder.test.ts`
Expected: PASS — tất cả test (8 cũ + 3 mới).

- [ ] **Step 5: Commit**

```bash
git add src/lib/trial-reminder.ts src/lib/trial-reminder.test.ts
git commit -m "feat: add buildCardName helper for reminder emails"
```

---

### Task 5: Script cron quét DB, gửi mail, đánh dấu

**Files:**
- Create: `scripts/send-trial-reminders.ts`

**Interfaces:**
- Consumes: `shouldSendReminder`, `buildCardName` từ `@/lib/trial-reminder`; `sendTrialReminderEmail` từ `@/lib/email`; `PrismaBetterSqlite3` adapter + `PrismaClient` (pattern từ `scripts/seed-demos.ts`).

- [ ] **Step 1: Viết script**

Tạo `scripts/send-trial-reminders.ts`:

```typescript
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { sendTrialReminderEmail } from "@/lib/email";
import {
  buildCardName,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const invitations = await prisma.invitation.findMany({
    where: { paid: false, publishedAt: { not: null }, reminderSentAt: null },
    include: {
      user: { select: { email: true } },
      content: { select: { brideShortName: true, groomShortName: true } },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const inv of invitations) {
    const email = inv.user.email;
    const candidate: ReminderCandidate = {
      paid: inv.paid,
      publishedAt: inv.publishedAt,
      reminderSentAt: inv.reminderSentAt,
      email,
    };
    if (!shouldSendReminder(candidate, now)) {
      skipped += 1;
      continue;
    }

    const cardName = buildCardName(inv.content);
    const recipientName = cardName === "Thiệp cưới của bạn" ? "" : cardName;
    try {
      await sendTrialReminderEmail({
        to: email as string,
        recipientName,
        cardName,
        invitationId: inv.id,
      });
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
      console.log(`[sent] ${inv.id} -> ${email}`);
    } catch (error) {
      failed += 1;
      console.error(`[fail] ${inv.id} -> ${email}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nTổng kết: gửi ${sent}, lỗi ${failed}, bỏ qua ${skipped}, quét ${invitations.length}`);
}

main()
  .catch((error) => {
    console.error("Script lỗi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Verify typecheck script**

Run: `npx tsc --noEmit -p tsconfig.tests.json 2>/dev/null || npx tsc --noEmit`
Expected: không lỗi type liên quan tới `scripts/send-trial-reminders.ts`. Nếu `scripts/` không nằm trong tsconfig chính, chạy `npx tsx --check scripts/send-trial-reminders.ts` hoặc bỏ qua và dựa vào Step 3.

- [ ] **Step 3: Dry-run trên DB dev (không có RESEND_API_KEY → mọi cái gửi sẽ fail an toàn, không set mốc)**

Run: `npx tsx scripts/send-trial-reminders.ts`
Expected: chạy xong, in "Tổng kết: ...". Không crash. Nếu có thiệp đủ điều kiện mà thiếu key thì đếm vào `lỗi` (đúng thiết kế — retry hôm sau), `reminderSentAt` KHÔNG bị set.

- [ ] **Step 4: Commit**

```bash
git add scripts/send-trial-reminders.ts
git commit -m "feat: add trial reminder cron script"
```

---

### Task 6: npm script + tài liệu env + crontab

**Files:**
- Modify: `package.json` (thêm script `reminders:trial`)
- Modify: `.env.example` (nếu tồn tại; nếu không thì tạo dòng ghi chú trong `docs/deploy-minipc.md`)

**Interfaces:**
- Produces: lệnh `npm run reminders:trial` chạy script.

- [ ] **Step 1: Thêm npm script**

Trong `package.json`, mục `scripts`, thêm:

```json
    "reminders:trial": "tsx scripts/send-trial-reminders.ts",
```

- [ ] **Step 2: Ghi chú RESEND_API_KEY**

Kiểm tra `.env.example`:

Run: `test -f .env.example && echo EXISTS || echo NONE`

Nếu EXISTS → thêm vào cuối `.env.example`:

```
# Resend — gửi email nhắc thanh toán (lấy key tại resend.com)
RESEND_API_KEY=
```

Nếu NONE → thêm mục vào `docs/deploy-minipc.md` (cuối file):

```markdown
## Email nhắc thanh toán (Resend)

Thêm vào `.env` trên server:

    RESEND_API_KEY=re_xxx   # lấy tại resend.com, KHÔNG commit

Cron gửi nhắc mỗi 9h sáng:

    0 9 * * *  cd /home/namdo/apps/thiepmungonline && npm run reminders:trial >> /var/log/trial-reminders.log 2>&1
```

- [ ] **Step 3: Verify script chạy qua npm**

Run: `npm run reminders:trial`
Expected: chạy script, in "Tổng kết: ...".

- [ ] **Step 4: Commit**

```bash
git add package.json .env.example docs/deploy-minipc.md
git commit -m "chore: add reminders:trial npm script + env docs"
```

---

### Task 7: Chạy full check

**Files:** (không sửa file — chỉ verify)

- [ ] **Step 1: Chạy toàn bộ test unit**

Run: `npm run test:unit`
Expected: PASS — gồm `trial-reminder.test.ts` và `email.test.ts`.

- [ ] **Step 2: Lint + typecheck + build**

Run: `npm run check`
Expected: lint pass (chỉ warnings ok), typecheck pass, build thành công.

- [ ] **Step 3: Commit (nếu có fix phát sinh từ check)**

```bash
git add -A
git commit -m "fix: resolve lint/type issues for trial reminder feature" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** migration (T1), hàm lọc thuần + test (T2), email Resend + HTML đẹp (T3), tên thiệp từ content (T4, phát sinh do Invitation không có field tên), script cron + đánh dấu + summary + xử lý lỗi giữ `reminderSentAt` null khi fail (T5), crontab + env (T6), full check (T7). Tất cả mục spec đều có task.
- **Escape HTML:** thêm để tránh vỡ layout / injection từ tên user — đúng nguyên tắc an toàn ở biên.
- **Không có placeholder:** mọi step có code/lệnh thật.
