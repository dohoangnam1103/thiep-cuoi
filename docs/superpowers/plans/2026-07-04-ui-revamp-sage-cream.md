# UI Revamp "Sage & Cream" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp toàn bộ giao diện project sang hướng "Sáng & sang" (palette Sage & Cream) — chỉ đổi giao diện, không đổi chức năng; tuyệt đối không đụng trang thiệp chi tiết.

**Architecture:** Đổi design tokens oklch trong `globals.css` từ dark → light (giữ nguyên tên biến để component kế thừa tự động). Gộp 2 bộ chrome trùng lặp về một `SiteHeader`/`SiteFooter` dùng chung. Sau đó áp tông + typography + component style mới cho từng trang, dựng lại bố cục nơi cần. Verify bằng `npm run check` + kiểm tra trực tiếp trên trình duyệt (không có unit test cho thay đổi thuần giao diện).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4 (oklch tokens), shadcn/ui, next-intl.

---

## Ràng buộc tuyệt đối (mọi task phải tuân thủ)

- **KHÔNG sửa** `src/components/chungdoi-demo.tsx` (render demo + thiệp đã publish). Không đọc-ghi, không format, không một dòng.
- **KHÔNG sửa** `src/app/thiep/layout.tsx` và trang `/thiep/[slug]`.
- **KHÔNG hardcode** copy người dùng thấy — chuỗi mới phải qua `messages/*.json` (5 locale: vi/en/ko/ja/zh). Phần lớn task chỉ đổi className nên không phát sinh chuỗi.
- **KHÔNG đổi** logic/handler/server action/link — chỉ markup + class + token.
- Sau MỖI task: `npm run check` phải sạch (lint + typecheck + build) trước khi commit.

## Design tokens tham chiếu (dùng xuyên suốt)

Palette Sage & Cream (oklch), áp trong `:root` của `globals.css`:

| Biến | Giá trị mới | Vai trò |
|---|---|---|
| `--background` | `oklch(0.968 0.012 120)` | nền kem ngả sage |
| `--foreground` | `oklch(0.32 0.028 75)` | chữ nâu đậm |
| `--card` | `oklch(0.99 0.008 110)` | card trắng ngà |
| `--card-foreground` | `oklch(0.32 0.028 75)` | chữ trên card |
| `--popover` | `oklch(0.99 0.008 110)` | |
| `--popover-foreground` | `oklch(0.32 0.028 75)` | |
| `--primary` | `oklch(0.52 0.05 150)` | sage đậm (nút chính) |
| `--primary-foreground` | `oklch(0.99 0.01 110)` | chữ trên nút sage |
| `--secondary` | `oklch(0.93 0.02 115)` | kem đậm hơn |
| `--secondary-foreground` | `oklch(0.38 0.03 90)` | |
| `--muted` | `oklch(0.94 0.014 115)` | |
| `--muted-foreground` | `oklch(0.52 0.02 80)` | chữ phụ nâu nhạt |
| `--accent` | `oklch(0.72 0.10 85)` | vàng đất (điểm nhấn) |
| `--accent-foreground` | `oklch(0.30 0.03 70)` | |
| `--destructive` | `oklch(0.58 0.20 27)` | đỏ (giữ) |
| `--border` | `oklch(0.32 0.028 75 / 14%)` | viền sage mảnh |
| `--input` | `oklch(0.32 0.028 75 / 18%)` | |
| `--ring` | `oklch(0.52 0.05 150)` | focus sage |

Typography: thêm biến `--font-heading` trỏ tới serif. `--radius` giữ `0.625rem`; nút pill dùng `rounded-full` tại chỗ.

**Lưu ý oklch:** giá trị chỉ áp trong `:root`. KHÔNG đụng block `.dark {}` (thiệp/những chỗ ép dark vẫn dùng riêng). Body hiện `font-weight: 300` HelveticaNeue — giữ nguyên cho body, chỉ heading đổi serif.

---

## Task 1: Đổi design tokens sang Sage & Cream

**Files:**
- Modify: `src/app/globals.css:122-155` (block `:root`)
- Modify: `src/app/globals.css:83` (`--font-heading`)
- Modify: `src/app/globals.css:191-204` (`@layer base`)

- [ ] **Step 1: Thay toàn bộ block `:root` (dòng 122-155) bằng token Sage & Cream**

```css
:root {
  --background: oklch(0.968 0.012 120);
  --foreground: oklch(0.32 0.028 75);
  --card: oklch(0.99 0.008 110);
  --card-foreground: oklch(0.32 0.028 75);
  --popover: oklch(0.99 0.008 110);
  --popover-foreground: oklch(0.32 0.028 75);
  --primary: oklch(0.52 0.05 150);
  --primary-foreground: oklch(0.99 0.01 110);
  --secondary: oklch(0.93 0.02 115);
  --secondary-foreground: oklch(0.38 0.03 90);
  --muted: oklch(0.94 0.014 115);
  --muted-foreground: oklch(0.52 0.02 80);
  --accent: oklch(0.72 0.10 85);
  --accent-foreground: oklch(0.30 0.03 70);
  --destructive: oklch(0.58 0.20 27);
  --border: oklch(0.32 0.028 75 / 14%);
  --input: oklch(0.32 0.028 75 / 18%);
  --ring: oklch(0.52 0.05 150);
  --chart-1: oklch(0.72 0.10 85);
  --chart-2: oklch(0.52 0.05 150);
  --chart-3: oklch(0.60 0.04 120);
  --chart-4: oklch(0.75 0.08 95);
  --chart-5: oklch(0.45 0.05 150);
  --radius: 0.625rem;
  --sidebar: oklch(0.99 0.008 110);
  --sidebar-foreground: oklch(0.32 0.028 75);
  --sidebar-primary: oklch(0.52 0.05 150);
  --sidebar-primary-foreground: oklch(0.99 0.01 110);
  --sidebar-accent: oklch(0.94 0.014 115);
  --sidebar-accent-foreground: oklch(0.32 0.028 75);
  --sidebar-border: oklch(0.32 0.028 75 / 14%);
  --sidebar-ring: oklch(0.52 0.05 150);
}
```

- [ ] **Step 2: Thêm font heading serif — sửa dòng 83**

Đổi:
```css
  --font-heading: var(--font-sans);
```
thành:
```css
  --font-heading: "Fz Qellia", "Times New Roman", Georgia, serif;
```

- [ ] **Step 3: Thêm tiện ích heading trong `@layer base` (sau block `html {}`, trước khi đóng `@layer base` ở dòng ~204)**

Chèn:
```css
  h1, h2, h3, .font-heading {
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
  }
```

- [ ] **Step 4: Verify build + trình duyệt**

Run: `npm run check`
Expected: PASS (lint + typecheck + build sạch, không lỗi).

Sau đó `npm run dev`, mở `http://localhost:3000` — nền chuyển kem sage, chữ nâu, nút sage. Kiểm tra nhanh 1 trang bất kỳ để chắc token áp đúng. Mở `http://localhost:3000/mau-thiep/song-hy-xanh/demo` xác nhận **thiệp KHÔNG đổi màu** (vẫn tông riêng của nó).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): switch design tokens to Sage & Cream light theme"
```

---

## Task 2: Gộp chrome dùng chung + style Sage & Cream

Đọc trước: `src/components/chungdoi-chrome.tsx` (toàn bộ), `src/components/chungdoi-clone.tsx:77-116` (header inline) và `:704-760` (footer + mobile nav inline).

**Files:**
- Modify: `src/components/chungdoi-chrome.tsx` (restyle SiteHeader/SiteFooter/Logo sang light; đảm bảo bao gồm mobile bottom nav + floating chat button vốn đang nằm ở homepage inline)
- Modify: `src/components/chungdoi-clone.tsx` (xoá header/footer/nav inline, import và dùng `SiteHeader`/`SiteFooter`)

- [ ] **Step 1: Restyle `chungdoi-chrome.tsx` sang Sage & Cream**

Đổi các class nền tối `bg-[#18120f]` / `border-white/10` / `text-zinc-200` sang token:
- Header: `sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl`
- Nav link: `text-sm font-medium text-muted-foreground hover:text-foreground`
- Footer: `border-t border-border bg-secondary`
- Logo giữ nguyên component `LogoMark`.

Giữ nguyên: `NAV_LINKS`, `useTranslations("chrome")`, mọi `href`, cấu trúc `<Link>`.

- [ ] **Step 2: Đảm bảo mobile bottom nav + floating chat button có trong chrome**

Nếu `chungdoi-chrome.tsx` chưa có mobile bottom nav (`fixed bottom-0 ... lg:hidden`) và nút chat nổi mà homepage đang có inline (`chungdoi-clone.tsx:728`), copy markup đó vào `SiteFooter` (hoặc thành phần riêng trong chrome), restyle sang token light. Giữ y hệt link/aria/onClick.

- [ ] **Step 3: Homepage dùng chrome chung — sửa `chungdoi-clone.tsx`**

- Thêm import: `import { SiteHeader, SiteFooter } from "@/components/chungdoi-chrome";`
- Xoá function `Logo()` inline (nếu trùng với chrome), xoá block `<header>...</header>` (dòng ~96-116), block `<footer>...</footer>` (dòng ~704-...) và mobile `<nav fixed bottom>` inline.
- Bọc nội dung: `<SiteHeader />` đầu, `<SiteFooter />` cuối.
- Gỡ import không dùng (vd `LogoMark` nếu chỉ dùng trong `Logo()` đã xoá) để lint sạch.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS (chú ý lỗi "unused import" — gỡ hết).

`npm run dev`: mở `/` (homepage) và `/mau-thiep` (listing) — header/footer **giống hệt nhau**, tông sage. Kiểm mobile (DevTools responsive): bottom nav hiện, nút chat nổi hoạt động, chuyển ngôn ngữ OK, mọi link nav đúng đích.

- [ ] **Step 5: Commit**

```bash
git add src/components/chungdoi-chrome.tsx src/components/chungdoi-clone.tsx
git commit -m "feat(ui): unify site chrome into shared SiteHeader/SiteFooter (Sage & Cream)"
```

---

## Task 3: Revamp homepage (`chungdoi-clone.tsx`)

Đọc trước: toàn bộ `src/components/chungdoi-clone.tsx` (các section còn lại sau khi đã gỡ chrome ở Task 2). Mockup tham chiếu: `.superpowers/brainstorm/.../homepage.html`.

**Files:**
- Modify: `src/components/chungdoi-clone.tsx` (hero, lưới mẫu nổi bật, tính năng, CTA)

- [ ] **Step 1: Hero section**

Áp: nền `bg-background`, eyebrow `text-accent` uppercase tracking-widest, tiêu đề lớn `font-heading text-foreground`, mô tả `text-muted-foreground`, 2 nút CTA `rounded-full` (nút chính `bg-primary text-primary-foreground`, phụ `border border-border`). Giữ nguyên mọi `href`, `onClick`, text lấy từ `useTranslations`.

- [ ] **Step 2: Lưới mẫu thiệp nổi bật**

Card `rounded-2xl bg-card border border-border shadow-[0_8px_30px_rgb(0_0_0/0.06)]`; thumbnail thiệp **giữ nền tối** (không đổi ảnh/tông trong ảnh). Giữ nguyên nguồn dữ liệu `templates`, link tới `/mau-thiep/[slug]`.

- [ ] **Step 3: Section tính năng + CTA cuối**

Tính năng: hàng 3 icon (Lucide) trong vòng tròn `bg-secondary text-primary`, tiêu đề `font-heading`. CTA cuối: nền `bg-primary` hoặc gradient sage, chữ sáng, nút `rounded-full bg-background text-foreground`.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

`npm run dev` → `/`: cuộn toàn trang desktop + mobile. Kiểm mọi nút/link còn hoạt động, animation `reveal`/`float` vẫn chạy, không vỡ layout. Không có chuỗi hardcode mới (nếu thêm text → đưa vào `messages/*.json`).

- [ ] **Step 5: Commit**

```bash
git add src/components/chungdoi-clone.tsx
git commit -m "feat(ui): revamp homepage layout to Sage & Cream"
```

---

## Task 4: Revamp listing (`chungdoi-listing.tsx`)

Đọc trước: toàn bộ `src/components/chungdoi-listing.tsx`. Mockup: `.superpowers/brainstorm/.../listing.html`.

**Files:**
- Modify: `src/components/chungdoi-listing.tsx`

- [ ] **Step 1: Hero + chip filter**

Hero `font-heading` trên nền `bg-background`. Nếu đã có cơ chế filter/tab — **giữ nguyên state/logic**, chỉ restyle chip: `rounded-full border border-border px-4 py-1.5 text-sm`, chip active `bg-primary text-primary-foreground`. Nếu hiện chưa có filter thì KHÔNG thêm chức năng mới (ngoài phạm vi "chỉ giao diện") — bỏ qua chip, chỉ style hero + lưới.

- [ ] **Step 2: Lưới card mẫu thiệp**

Card `rounded-2xl bg-card border border-border shadow` + hover nâng nhẹ (`transition hover:-translate-y-1 hover:shadow-lg`). Thumbnail **giữ nền tối**. Nút/overlay "Xem demo / Dùng mẫu" giữ nguyên link (`/mau-thiep/[slug]` → redirect demo). KHÔNG đổi hành vi.

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: PASS.

`/mau-thiep`: lưới hiển thị đúng số mẫu, click card → vào demo (thiệp tối) mượt. Responsive 1→2→3 cột. Filter (nếu có) lọc đúng.

- [ ] **Step 4: Commit**

```bash
git add src/components/chungdoi-listing.tsx
git commit -m "feat(ui): revamp template listing to Sage & Cream"
```

---

## Task 5: Revamp pricing (`chungdoi-pricing.tsx`)

Đọc trước: toàn bộ `src/components/chungdoi-pricing.tsx`. Mockup: `.superpowers/brainstorm/.../pricing.html`.

**Files:**
- Modify: `src/components/chungdoi-pricing.tsx`

- [ ] **Step 1: Toggle chu kỳ + 3 card giá**

**Giữ nguyên nội dung/giá và mọi logic toggle hiện có.** Chỉ restyle: card `rounded-2xl bg-card border border-border`, card nổi bật `border-primary ring-1 ring-primary` + badge `bg-accent text-accent-foreground`. Nút `rounded-full bg-primary text-primary-foreground`. Toggle: track `bg-secondary`, active `bg-primary`.

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

`/gia` (hoặc route pricing thực tế): toggle đổi giá đúng như trước, 3 card hiển thị, responsive. Nội dung giá không đổi so với bản cũ.

- [ ] **Step 3: Commit**

```bash
git add src/components/chungdoi-pricing.tsx
git commit -m "feat(ui): revamp pricing page to Sage & Cream"
```

---

## Task 6: Revamp tools, policy, blog, help

Đọc trước: `src/components/chungdoi-tools.tsx`, `src/components/chungdoi-policy.tsx`, `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/help/page.tsx`.

**Files:**
- Modify: `src/components/chungdoi-tools.tsx`
- Modify: `src/components/chungdoi-policy.tsx`
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Modify: `src/app/[locale]/help/page.tsx`

- [ ] **Step 1: Tools + Policy**

Áp token nền/chữ, tiêu đề `font-heading`, card `rounded-2xl bg-card border border-border`. Policy: nội dung văn bản dùng `text-foreground`/`text-muted-foreground`, tiêu đề mục `font-heading`. Giữ nguyên nội dung + link.

- [ ] **Step 2: Blog (list + detail)**

Blog list: card bài viết `rounded-2xl bg-card border border-border shadow`, tiêu đề `font-heading`, meta `text-muted-foreground`. Blog detail: khối nội dung `prose` (nếu dùng) đổi sang tông sáng — tiêu đề `font-heading text-foreground`, body `text-foreground`. Giữ nguyên chrome (đã dùng `SiteHeader/SiteFooter`).

- [ ] **Step 3: Help**

Áp token + `font-heading` cho tiêu đề mục; accordion/list (nếu có) restyle viền `border-border`, nền `bg-card`. Giữ nguyên nội dung + tương tác.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

Mở `/cong-cu` (tools), `/chinh-sach-*` (policy), `/blog`, `/blog/<slug>`, `/tro-giup` (help) — tông đồng nhất, đọc rõ, responsive. Link/nội dung giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add src/components/chungdoi-tools.tsx src/components/chungdoi-policy.tsx "src/app/[locale]/blog/page.tsx" "src/app/[locale]/blog/[slug]/page.tsx" "src/app/[locale]/help/page.tsx"
git commit -m "feat(ui): revamp tools/policy/blog/help to Sage & Cream"
```

---

## Task 7: Revamp auth (login, signup)

Đọc trước: `src/app/(auth)/login/` và `src/app/(auth)/signup/` (page + form component). Kiểm tra `(auth)` có layout riêng không (`src/app/(auth)/layout.tsx`).

**Files:**
- Modify: form/page login + signup (đường dẫn xác định khi đọc)
- Modify (nếu có): `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Restyle form auth**

Card form `rounded-2xl bg-card border border-border shadow` trên nền `bg-background`. Input `border-input bg-background focus:ring-ring`, nút submit `rounded-full bg-primary text-primary-foreground`. Tiêu đề `font-heading`. Giữ nguyên toàn bộ server action, field name, validation, redirect.

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

`/login`, `/signup`: form hiển thị tông sáng; **thử đăng nhập/đăng ký thật** trên trình duyệt để chắc action không đổi (submit → redirect đúng). Kiểm lỗi hiển thị (sai mật khẩu) vẫn ra.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)"
git commit -m "feat(ui): revamp auth pages to Sage & Cream"
```

---

## Task 8: Revamp dashboard (page, guests, rsvp)

Đọc trước: `src/app/dashboard/page.tsx`, `src/app/dashboard/[id]/guests/`, `src/app/dashboard/[id]/rsvp/` và component con của chúng.

**Files:**
- Modify: `src/app/dashboard/page.tsx` (+ component list/card thiệp)
- Modify: `src/app/dashboard/[id]/guests/` (bảng/list khách)
- Modify: `src/app/dashboard/[id]/rsvp/` (bảng/list RSVP)

- [ ] **Step 1: Dashboard chính**

List thiệp: card `rounded-2xl bg-card border border-border shadow`, trạng thái badge (draft/published) dùng `bg-secondary`/`bg-primary`. Nút hành động `rounded-full`. Tiêu đề `font-heading`. Giữ nguyên link tới `/editor/[id]`, guests, rsvp.

- [ ] **Step 2: Guests + RSVP**

Bảng: header `bg-secondary text-secondary-foreground`, hàng viền `border-border`, hover `bg-muted`. Empty state chữ `text-muted-foreground`. Giữ nguyên cột/dữ liệu/hành động.

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: PASS.

Đăng nhập → `/dashboard`: danh sách thiệp tông sáng; mở guests + rsvp của 1 thiệp — bảng đọc rõ, hành động (nếu có) hoạt động. Responsive.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard
git commit -m "feat(ui): revamp dashboard/guests/rsvp to Sage & Cream"
```

---

## Task 9: Áp tông sáng cho editor (`editor/[id]`)

Đọc trước: `src/app/editor/[id]/EditorForm.tsx` (đã nâng cấp đợt trước: upload, toast, sticky bar), `src/app/editor/[id]/page.tsx`, `src/app/editor/[id]/preview/`.

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx` (chỉ class/tông — KHÔNG đụng logic upload/toast/dnd/sticky bar)
- Modify (nếu cần): `src/app/editor/[id]/page.tsx`

- [ ] **Step 1: Áp token cho form**

Đổi nền/chữ/viền sang token light. Accordion, input, select (BirthOrderField/MusicField/TemplatePicker), vùng upload, sticky action bar → dùng `bg-card`/`bg-background`/`border-border`/`text-foreground`. Nút `rounded-full bg-primary`. Toaster (sonner) đổi `theme="light"` cho khớp (giữ `richColors`). **KHÔNG đổi** logic upload, handler, tên field, state, dnd.

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

`/editor/<id>` (đăng nhập, tạo nháp nếu cần): form tông sáng; **test lại** upload ảnh (toast hiện), kéo sắp xếp, chọn font/nhạc/mẫu, Lưu nháp (toast), sticky bar hiện khi cuộn. Bấm "Xem trước" → preview đúng.

- [ ] **Step 3: Commit**

```bash
git add "src/app/editor/[id]"
git commit -m "feat(ui): apply Sage & Cream tone to editor form"
```

---

## Task 10: Verify tổng thể + dọn dẹp

**Files:** không tạo mới.

- [ ] **Step 1: `npm run check` toàn cục**

Run: `npm run check`
Expected: PASS sạch (lint + typecheck + build).

- [ ] **Step 2: Duyệt toàn site trên trình duyệt**

`npm run dev`, đi lần lượt: `/` → `/mau-thiep` → click 1 mẫu vào `/mau-thiep/<slug>/demo` (xác nhận **thiệp KHÔNG đổi gì**) → pricing → tools → policy → blog → help → login → dashboard → editor. Kiểm desktop + mobile. Tìm chỗ còn sót tông tối cũ (search class `bg-[#18120f]`, `text-zinc-*`, `border-white/` trong các file đã sửa).

- [ ] **Step 3: Xác nhận thiệp bất biến**

Mở `/thiep/<slug>` của 1 thiệp đã publish (nếu có) và `/mau-thiep/<slug>/demo` — so với trước: **không đổi một chi tiết nào**. `git diff` xác nhận `chungdoi-demo.tsx` và `thiep/layout.tsx` KHÔNG nằm trong thay đổi.

- [ ] **Step 4: Kiểm i18n**

`grep` chuỗi tiếng Việt hardcode mới thêm trong các file đã sửa. Nếu có → chuyển vào `messages/*.json` (5 locale) + commit riêng.

- [ ] **Step 5: Commit cuối (nếu có dọn dẹp)**

```bash
git add -A
git commit -m "chore(ui): final Sage & Cream cleanup + i18n"
```

---

## Self-review coverage

- Tokens (spec §Màu) → Task 1
- Typography serif (spec §Typography) → Task 1 (Step 2-3)
- Chrome gộp (spec §Chrome) → Task 2
- Từng trang (spec bảng phạm vi) → Task 3-9 (homepage, listing, pricing, tools, policy, blog, help, auth, dashboard, editor)
- Ràng buộc không đụng thiệp → nêu ở đầu + verify Task 10 Step 3
- i18n → verify Task 10 Step 4
- `npm run check` sạch → mọi task + Task 10 Step 1
