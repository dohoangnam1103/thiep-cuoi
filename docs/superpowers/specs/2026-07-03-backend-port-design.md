# Thiết kế: Port full backend sang clone repo

Ngày: 2026-07-03
Repo đích: `/Users/namdo/Documents/learning/clone` (port 3000)

## Bối cảnh & vấn đề

Dự án là bản clone của chungdoi.com (khôi phục source đã mất). Hiện tại tồn tại **hai repo phân nhánh**:

- **`thiep cuoi online`** (port 3001): có backend đầy đủ chạy được — auth (bcrypt + JWT), editor, dashboard, public invitation `/[slug]`, API (upload, AI), Prisma schema. NHƯNG nối với hệ template cũ (`@/templates`) nhận `TemplateData` — shape nghèo, layout đơn giản.
- **`clone`** (port 3000): có các component **pixel-clone** chất lượng cao (`chungdoi-demo.tsx`, 10 mẫu đã clone 100%: double-phoenix-red, double-phoenix-green, song-hy-red, song-hy-green, nhat-binh-red, co-ba-red, dragon-phoenix-red, double-dragon-red, double-dragon-blue, double-dragon-green). NHƯNG hoàn toàn tĩnh — đọc từ `chungdoiDemoContent[slug]`, không có backend.

Backend đẹp gắn template xấu; template đẹp không có backend. Quyết định: **đưa full backend sang clone repo, port một lần**, để pixel-clone trở thành sản phẩm SaaS thật.

## Quyết định đã chốt

1. Đưa **full backend sang clone repo**, port một lần (không làm nửa vời từng phần).
2. **Mở rộng schema** cho khớp `ChungDoiDemoContent` (shape giàu), thay vì bê schema nghèo của repo cũ.
3. **Full editor** — mọi trường của shape giàu.
4. **Thanh toán để sau** — ngoài phạm vi đợt này.
5. Editor **chỉ cho chọn 10 mẫu đã pixel-clone**.
6. Editor mới viết bằng **Tailwind v4** (khớp clone repo), không bê inline-style của repo cũ.

## Mấu chốt kỹ thuật: content shape

`ChungDoiDemoContent` (clone) giàu hơn `TemplateData` (repo cũ) đáng kể:

- `couple`: có `groomShortName/brideShortName`, tách `date/time` (tiệc) khỏi `ceremonyDate/ceremonyTime` (lễ), `brideFirst`, `ceremonyHeader`.
- `families`: cấu trúc từng bên — cha, mẹ, địa chỉ, xưng hô (8 trường). Repo cũ chỉ có `groomParents/brideParents` là 1 chuỗi.
- `schedule[]`, `gallery[]`, `wishes[]`: mảng có cấu trúc.
- `bank`: 6 trường (2 bên × tên NH / số TK / chủ TK).
- `theme`: `primaryColor`, `fontFamily`, `assetFolder`; `music`.

Repo cũ dùng text tự do song ngữ (`invitationText/loveStory/thanks` vi+en) mà pixel-clone chungdoi **không** dùng → bỏ các trường này.

## Phần 1 — Data model & kiến trúc

**Dependencies thêm vào clone repo:** `prisma`, `@prisma/client`, `@prisma/adapter-better-sqlite3`, `better-sqlite3`, `bcryptjs`, `jose`, `zod`.

**Prisma schema (SQLite):**

```
User        id, email? (unique, null=guest), passwordHash?, createdAt
            → invitations[]

Invitation  id, userId, slug? (unique), templateId, status(draft|published),
            createdAt, updatedAt
            → content(1-1), schedule[], gallery[], wishes[], rsvps[]
            @@index([userId])

InvitationContent (1-1)  invitationId(unique)
  couple:   groomFullName, brideFullName, groomShortName, brideShortName,
            brideFirst(Bool), date, time, ceremonyDate, ceremonyTime, ceremonyHeader
  families: groomFather, groomMother, groomAddress, groomParentTitle,
            brideFather, brideMother, brideAddress, brideParentTitle
  venue:    venueAddress, mapAddress, banquetTime
  bank:     groomBankName, groomAccountNumber, groomAccountName,
            brideBankName, brideAccountNumber, brideAccountName
  theme:    primaryColor, fontFamily, assetFolder, musicUrl
  (date/time lưu String để khớp shape hiện tại "YYYY-MM-DD" / "HH:MM")

ScheduleItem  id, invitationId, order(Int), time, label      @@index([invitationId])
GalleryPhoto  id, invitationId, order(Int), url              @@index([invitationId])
Wish          id, invitationId, guestName, message, createdAt @@index([invitationId])
Rsvp          id, invitationId, guestName, attending(Bool),
              guestCount(Int, default 1), note, createdAt     @@index([invitationId])
```

**Adapter `toDemoContent(invitation): ChungDoiDemoContent`** (server-side): map row DB → shape để tái dùng đúng component `ChungDoiDemo` hiện có. Cần refactor nhẹ: `ChungDoiDemo` nhận `content` từ prop (fallback về `chungdoiDemoContent[slug]` tĩnh khi không truyền), thay vì luôn tra bảng tĩnh.

**Seed:** đổ `chungdoiDemoContent` (10 mẫu) vào DB làm dữ liệu demo, để `/mau-thiep/[slug]/demo` vẫn chạy sau khi chuyển sang nguồn động (hoặc giữ demo route đọc tĩnh — xem Rủi ro).

## Phần 2 — Auth + Editor + Public

**Auth** (port gần nguyên repo cũ): `lib/session.ts` (JWT jose, cookie httpOnly, 7d), `lib/dal.ts` (`verifySession` → redirect `/login`), `lib/prisma.ts`. Routes `(auth)/login`, `(auth)/signup`, `AuthForm.tsx`, `actions.ts` (signup/login/logout, bcrypt).

**Editor** (`/editor/[id]`): full form Tailwind, mọi trường shape giàu:
- couple (tên đầy đủ + short + brideFirst + lễ/tiệc riêng + ceremonyHeader)
- families 2 bên (cha/mẹ/địa chỉ/xưng hô)
- venue (địa chỉ + map + giờ tiệc)
- bank 2 bên
- schedule: thêm/xóa/sắp xếp dòng (time + label)
- gallery: upload nhiều ảnh + sắp xếp
- chọn template (dropdown 10 mẫu đã clone)
- nhạc (musicUrl / picker)
- Server actions: `saveDraft` (zod validate), `checkSlug` (realtime), `publish` (yêu cầu tối thiểu: 2 tên + ngày). `ownInvitation` guard theo userId.
- `/editor/[id]/preview`: render `ChungDoiDemo` với content động.

**Public** (`/[slug]`): lấy invitation `status=published` + content + schedule + gallery + wishes → `toDemoContent()` → `<ChungDoiDemo content={...} />`. RSVP form + sổ lưu bút submit thật (server action ghi DB). `generateMetadata` từ tên cặp đôi + ảnh đầu.

## Phần 3 — Dashboard + API

**Dashboard** (`/dashboard`): list thiệp user (couple name, trạng thái, đếm RSVP), nút tạo mới, link sửa/xem. `/dashboard/[id]/rsvp`: bảng RSVP. `createInvitation` action tạo Invitation + InvitationContent rỗng rồi redirect editor.

**API:**
- `/api/upload`: nhận file, lưu `public/uploads/`, trả URL. Guard session.
- `/api/ai`: port stub deterministic + fallback gọi LLM (OpenAI-compatible) khi có `OPENAI_API_KEY`/`AI_API_KEY`. Rate limit theo user. Body zod (kind, lang, tone, hints).

## Phần 4 — Ngoài phạm vi (để sau)

- Thanh toán / luồng mua gói.
- ~30 mẫu chưa pixel-clone (editor không cho chọn cho tới khi clone xong).
- Đa ngôn ngữ (vi/en/ko) cho editor & public — pixel-clone hiện đã song ngữ vi-ko ở mức nội dung tĩnh; i18n động để sau.

## Rủi ro & lưu ý

- **`ChungDoiDemo` refactor nhận prop content:** phải cẩn thận không phá `/mau-thiep/[slug]/demo` đang chạy. Cách an toàn: thêm optional prop `content`, fallback tĩnh khi vắng.
- **`SESSION_SECRET`** phải set trong env clone repo.
- **Next.js v16 (bản modified):** đọc `node_modules/next/dist/docs/` trước khi viết code Next.js (PageProps, params/searchParams là Promise, server actions).
- **date/time là String** trong schema (khớp shape hiện tại), không phải DateTime — tránh lệch format với helper `formatDate/buildCalendar`.
- **10 mẫu hợp lệ** để editor cho chọn: double-phoenix-red, double-phoenix-green, song-hy-red, song-hy-green, nhat-binh-red, co-ba-red, dragon-phoenix-red, double-dragon-red, double-dragon-blue, double-dragon-green.

## Tiêu chí thành công

- User signup/login được.
- Tạo thiệp mới → editor lưu mọi trường → publish với slug.
- `/{slug}` render đúng pixel-clone component với dữ liệu user nhập (không phải demo tĩnh).
- Khách gửi RSVP + lời chúc, lưu DB, hiện trên dashboard & trang thiệp.
- `/mau-thiep/[slug]/demo` vẫn chạy như cũ.
- Typecheck sạch.
