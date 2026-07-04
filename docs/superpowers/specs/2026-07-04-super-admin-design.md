# Trang Super Admin — Thiết kế

**Ngày:** 2026-07-04
**Trạng thái:** Đã duyệt hướng, chờ duyệt spec

## Mục tiêu

Xây trang quản trị nội bộ (`/admin`) cho super admin để: xem danh sách user đã đăng ký, quản lý danh sách thiệp demo, và chỉnh sửa nội dung thiệp demo bằng chính form editor sẵn có.

**Trong phạm vi đợt này:** quyền admin + login admin riêng, danh sách user (chỉ đọc), danh sách + chỉnh sửa thiệp demo (chuyển demo vào DB), danh sách giao dịch (chỉ đọc), quản lý voucher (tạo/tắt).

**Đã có sẵn trong code (không làm lại):** hệ thống thanh toán đã tích hợp — `Payment`/`Voucher` model + migration `20260704031005_add_payment_voucher`, `src/lib/payment.ts` (VietQR, sinh mã đơn, verify webhook), trang `/dashboard/[id]/thanh-toan`, webhook `/api/casso/webhook` (khớp mã → đánh dấu `paid`), polling `/api/payment/[code]/status`. Trang admin chỉ **đọc** dữ liệu giao dịch này và **quản lý voucher**, không đụng luồng thanh toán.

## Ràng buộc & bối cảnh (từ code hiện tại)

1. **Chưa có hệ thống quyền/role.** `User` chỉ có `id, email, passwordHash, createdAt`. Auth là session email+mật khẩu (`jose` JWT, cookie `session`).
2. **Thanh toán đã có dữ liệu thật.** `Payment` (mã đơn `CDxxxxxx`, `amount`, `voucherCode?`, `status` pending/paid, `paidAt?`) gắn `invitationId`; `Voucher` (`code`, `amountOff`, `active`, `maxUses?`, `usedCount`, `expiresAt?`). Webhook Casso đánh dấu `paid`. Admin đọc các bảng này (chỉ đọc giao dịch) và CRUD tối thiểu voucher.
3. **Thiệp demo là file tĩnh** `src/data/chungdoi-demo-content.ts` (auto-generated), build cứng vào Docker image, runtime không ghi được. Muốn sửa qua web phải chuyển vào DB.
4. **Trang demo công khai là SSG** — `src/app/[locale]/templates/[slug]/demo/page.tsx` prerender ~200 trang (template × locale) qua `generateStaticParams`, đọc nội dung đồng bộ từ file tĩnh.
5. **Form editor gắn cứng session user** — `saveDraft`/`publish`/`checkSlug` gọi `verifySession()` + `ownInvitation()`.
6. **`toDemoContent(invitation)`** (`src/lib/to-demo-content.ts`) đã chuyển `Invitation` → `ChungDoiDemoContent`; cùng chiều với dữ liệu form editor.

## Kiến trúc tổng thể

Demo được biểu diễn là các bản ghi `Invitation` (`isDemo=true`) thuộc một **user hệ thống**, nhờ đó tái dụng nguyên form editor + `toDemoContent`. Admin có session riêng (cookie tách biệt) và bảng `Admin` riêng. Trang demo công khai chuyển sang đọc demo từ DB và được `revalidatePath` khi admin lưu.

---

## Phần 1 — Schema DB (Prisma)

Thêm vào `prisma/schema.prisma`:

```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Invitation {
  // ... giữ nguyên các field cũ ...
  isDemo Boolean @default(false)   // thêm mới
  @@index([isDemo])
}
```

- `Admin` tách hoàn toàn khỏi `User`.
- `isDemo` đánh dấu invitation là thiệp demo.
- Demo thuộc một **user hệ thống** (email cố định `system@demo.local`, không phát session cho nó).
- Migration: `npm run prisma:migrate`.

## Phần 2 — Quyền admin & session

Tách hoàn toàn khỏi session user.

- **Cookie riêng:** user dùng cookie `session`; admin dùng `admin_session` (JWT `jose`, payload `{ adminId }`, secret vẫn là `SESSION_SECRET`).
- **`src/lib/admin-session.ts`:** `createAdminSession(adminId)`, `getAdminSession()`, `destroyAdminSession()` — sao mẫu `src/lib/session.ts`.
- **`src/lib/admin-dal.ts`:** `verifyAdmin()` → đọc `admin_session`, tra bảng `Admin`, không có thì `redirect("/admin/login")`. Dùng `cache()` như `getCurrentUser`.
- **Lý do cookie riêng:** một người vừa là user vừa admin vẫn đăng nhập song hai phiên; và `verifySession` (user) không vô tình cấp quyền admin.

## Phần 3 — Trang & route admin

Tất cả dưới `/admin`, ngoài `[locale]` (không cần i18n — trang nội bộ).

- **`src/app/admin/layout.tsx`** — layout riêng (nền sáng, không header/footer marketing). Nav: Người dùng · Thiệp demo · Giao dịch · Voucher · Đăng xuất.
- **`src/app/admin/login/page.tsx` + `AdminLoginForm.tsx`** — form email+mật khẩu; server action `adminLogin` (bcrypt như `login` user), tạo `admin_session`, redirect `/admin`. Trang này **không** gọi `verifyAdmin` (tránh loop).
- **`src/app/admin/page.tsx`** — trang chủ admin, gọi `verifyAdmin()`, hiện số liệu tổng (số user, số thiệp thật, số demo, số đơn đã trả, tổng doanh thu) + link nhanh.
- **`src/app/admin/users/page.tsx`** — danh sách user: email, ngày đăng ký, số thiệp. Chỉ đọc.
- **`src/app/admin/demos/page.tsx`** — danh sách demo (`Invitation` có `isDemo=true`): tên template, tên cô dâu/chú rể, nút "Chỉnh sửa".
- **`src/app/admin/payments/page.tsx`** — danh sách giao dịch (`Payment`): mã đơn, thiệp (templateId + tên cô dâu/chú rể), email user, số tiền, voucher, trạng thái, ngày tạo/ngày trả. Chỉ đọc, sắp xếp mới nhất trước; tổng doanh thu (tổng `amount` các đơn `paid`) ở đầu trang.
- **`src/app/admin/vouchers/page.tsx` + `VoucherForm.tsx`** — danh sách voucher (`code`, `amountOff`, `active`, `usedCount`/`maxUses`, `expiresAt`) + form tạo mới; mỗi voucher có nút bật/tắt (`active`).
- **`src/app/admin/actions.ts`** — `adminLogin`, `adminLogout`.
- **`src/app/admin/vouchers/actions.ts`** — `createVoucher`, `toggleVoucher` (đều gọi `verifyAdmin()` + `revalidatePath("/admin/vouchers")`).

Điều hướng: `adminLogin` → `/admin`; `adminLogout` → `/admin/login`. Nav thêm mục: Người dùng · Thiệp demo · Giao dịch · Voucher · Đăng xuất.

## Phần 4 — Sửa nội dung demo (tái dụng form editor)

Vấn đề: `saveDraft`/`publish`/`checkSlug` gắn cứng session user → admin sửa demo (thuộc user hệ thống) bị chặn.

Cách làm — thêm nhánh phân quyền admin, không đổi hành vi user:

- **`src/app/admin/demos/[id]/page.tsx`** — sửa 1 demo. Gọi `verifyAdmin()`, nạp invitation demo theo `id` (bắt buộc `isDemo=true`, không thì `notFound`), render **cùng `EditorForm`** đang dùng ở `/editor/[id]`. Truyền prop `adminMode` để form post vào action admin.
- **`src/app/admin/demos/actions.ts` → `saveDemo(id, ...)`:** dùng lại `contentSchema` + `parseSchedule` + `parseGallery` từ `editor/[id]/actions.ts` (export lại để không lặp code). Khác biệt: kiểm tra bằng `verifyAdmin()`; bắt buộc bản ghi `isDemo=true`.
- **Sau khi lưu:** `revalidatePath` route demo công khai của template đó — `/[locale]/templates/[slug]/demo` + listing — cho cả 5 locale (giải quyết ràng buộc SSG).
- **Không đụng** `chungdoi-demo.tsx` hay `thiep/layout.tsx`: chỉ sửa dữ liệu; render demo nguyên vẹn.
- **EditorForm chỉnh nhẹ:** nhận save action qua prop (mặc định `saveDraft`); admin truyền `saveDemo`. Ở `adminMode`, **ẩn** khối "Xuất bản" + "Đường dẫn công khai" (demo không dùng slug/publish — hiển thị qua route template, không qua `/thiep/[slug]`), chỉ giữ "Lưu".

## Phần 5 — Seed dữ liệu demo & tài khoản admin

**Seed demo (file tĩnh → DB, chạy một lần):**
- Script `scripts/seed-demos.ts`: đọc `chungdoiDemoContent`, upsert:
  - 1 user hệ thống (`system@demo.local`, không đăng nhập được).
  - Mỗi entry demo: upsert 1 `Invitation` (`isDemo=true`, `templateId=slug`, thuộc user hệ thống) + `InvitationContent` + `schedule` + `gallery`, map ngược chiều `toDemoContent`.
- **Idempotent:** chạy lại không tạo trùng (key ổn định: `Invitation.id` cố định theo slug demo, hoặc tra theo `isDemo+templateId`).

**Quan hệ với file tĩnh sau seed:**
- `templates/[slug]/demo/page.tsx` đọc demo **từ DB** (qua `toDemoContent`) rồi truyền `content` xuống `ChungDoiDemo`, thay vì để component đọc file. Đây là đổi **cách nạp dữ liệu ở page** — không đụng nội bộ render `chungdoi-demo.tsx`. File tĩnh giữ làm nguồn seed + fallback nếu DB chưa có.

**Tài khoản admin đầu tiên:**
- Script `scripts/create-admin.ts` chạy tay: nhận email+mật khẩu qua env/đối số, `bcrypt.hash`, insert `Admin`. Chạy một lần trên minipc khi deploy.

## Danh sách file

**Tạo mới:**
- `src/lib/admin-session.ts` — session admin (cookie `admin_session`)
- `src/lib/admin-dal.ts` — `verifyAdmin()`
- `src/app/admin/layout.tsx` — layout admin
- `src/app/admin/page.tsx` — trang chủ admin (số liệu)
- `src/app/admin/actions.ts` — `adminLogin`, `adminLogout`
- `src/app/admin/login/page.tsx` + `AdminLoginForm.tsx`
- `src/app/admin/users/page.tsx` — danh sách user
- `src/app/admin/demos/page.tsx` — danh sách demo
- `src/app/admin/demos/[id]/page.tsx` — sửa demo (render EditorForm)
- `src/app/admin/demos/actions.ts` — `saveDemo`
- `src/app/admin/payments/page.tsx` — danh sách giao dịch (chỉ đọc)
- `src/app/admin/vouchers/page.tsx` + `VoucherForm.tsx` — danh sách + tạo voucher
- `src/app/admin/vouchers/actions.ts` — `createVoucher`, `toggleVoucher`
- `scripts/seed-demos.ts` — seed demo vào DB
- `scripts/create-admin.ts` — tạo admin đầu tiên

**Sửa:**
- `prisma/schema.prisma` — thêm `Admin` + `Invitation.isDemo`
- `src/app/editor/[id]/actions.ts` — export lại `contentSchema`, `parseSchedule`, `parseGallery` để dùng chung
- `src/app/editor/[id]/EditorForm.tsx` — nhận save action + `adminMode` qua prop; ẩn publish/slug ở adminMode
- `src/app/[locale]/templates/[slug]/demo/page.tsx` — đọc demo từ DB (fallback file tĩnh)

**Không đụng:**
- `src/components/chungdoi-demo.tsx`, `src/app/thiep/layout.tsx` — render demo nguyên vẹn

## Verification

1. `npm run prisma:migrate` — tạo bảng `Admin` + cột `isDemo`.
2. Chạy `scripts/seed-demos.ts` → DB có user hệ thống + N invitation demo.
3. Chạy `scripts/create-admin.ts`, đăng nhập `/admin/login` → vào `/admin`, xem danh sách user + demo.
4. Sửa 1 demo qua form editor → lưu → mở `/vi/templates/<slug>/demo` thấy nội dung đổi.
5. `/admin/payments` hiện danh sách giao dịch + tổng doanh thu khớp dữ liệu `Payment` (kiểm chứng bằng đơn `paid` seed tay hoặc từ webhook thật).
6. `/admin/vouchers`: tạo 1 voucher mới → thấy trong danh sách; bật/tắt `active` → trạng thái đổi; áp voucher đó ở `/dashboard/[id]/thanh-toan` giảm giá đúng.
7. Cô lập: user thường **không** vào được `/admin` (redirect login); action demo bắt buộc `isDemo=true` nên admin không sửa nhầm invitation thật.
8. `npm run check` sạch (lint + typecheck + build), không `any`, copy tiếng Việt.
