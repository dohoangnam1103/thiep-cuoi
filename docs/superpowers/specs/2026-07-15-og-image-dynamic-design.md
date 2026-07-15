# Dynamic OG Image cho trang thiệp — Design

**Ngày:** 2026-07-15
**Trạng thái:** Đã chốt, chờ review

## Vấn đề

Trang thiệp publish (`/thiep/[slug]`) hiện dùng ảnh gallery đầu tiên làm ảnh preview khi share lên Facebook/Zalo (`generateMetadata` tại `src/app/thiep/[slug]/page.tsx:75-76`). Có 2 nhược điểm:

- Ảnh gallery gốc sai tỉ lệ (không phải 1200×630), preview bị crop xấu.
- Thiệp chưa có ảnh gallery → share ra trống trơn, không có tên cặp đôi / ngày cưới.

## Mục tiêu

Sinh ảnh OG động (1200×630 PNG) cho mỗi thiệp, mang:
- Tên cặp đôi + ngày cưới.
- Màu sắc + font + hoa văn khớp template của thiệp đó.

Card thuần theme (không dùng ảnh cưới của user) — luôn hoạt động kể cả thiệp chưa có ảnh gallery.

## Kiến trúc

Tạo 1 file mới theo chuẩn App Router của Next.js 16:

```
src/app/thiep/[slug]/opengraph-image.tsx
```

Next.js tự nhận file này trong route segment, tự sinh route ảnh, và tự chèn thẻ `og:image` + `twitter:image` (kèm width/height) vào trang thiệp.

**File exports:**
- `export const runtime = "nodejs"` — bắt buộc, vì cần Prisma/SQLite (`loadPublished`) và `fs.readFile` (font + decor). Không dùng Edge runtime.
- `export const size = { width: 1200, height: 630 }`
- `export const contentType = "image/png"`
- `export const alt` — text mô tả (tên cặp đôi), cho screen reader / fallback.
- `export default async function Image({ params })` → load data → trả `ImageResponse`.

**Thay đổi kèm theo trong `page.tsx`:**
- Xóa phần `images` thủ công trong `generateMetadata` (dòng ~75-76, 90, 96) để Next tự chèn ảnh từ `opengraph-image.tsx`, tránh trùng/xung đột.
- Giữ nguyên `title`, `description`, `robots`, `alternates`.

> **Lưu ý Next 16:** AGENTS.md cảnh báo bản Next này có breaking changes. Trước khi code phải đọc `node_modules/next/dist/docs/` phần metadata / opengraph-image để xác nhận API `ImageResponse`, chữ ký `Image({ params })`, và cách export `runtime`/`size`/`contentType` đúng với version đang dùng.

## Luồng dữ liệu

Trong `opengraph-image.tsx`:

1. Nhận `slug` từ `params` → `loadPublished(slug)` (dùng lại hàm sẵn có mà `page.tsx` đang dùng — cùng nguồn, không viết query mới).
2. Nếu không có / chưa publish → trả card **fallback** tối giản (logo + "Thiệp Mừng Online" trên nền trung tính) thay vì lỗi. Facebook/Zalo luôn nhận được ảnh hợp lệ.
3. Tra `chungdoiThemeConfig[invitation.templateId]` để lấy màu (`theme.background`, `theme.accent`, `theme.textPrimary`...), font (`fonts.couple`), và hoa văn (`decorations.cardImages`).
   - `templateId` chính là `slug` template và cũng là key của `chungdoiThemeConfig` — tra trực tiếp, không cần map trung gian.
   - Trống / không tra được → fallback theo `content.primaryColor` (đúng pattern `resolveTokens` trong `chungdoi-demo.tsx:281`).
4. Dựng chuỗi hiển thị:
   - **Tên:** `shortName` trước, trống thì `fullName`; thứ tự nhà trai/gái theo `content.brideFirst`; nối bằng `&`.
   - **Ngày:** lấy nguyên `content.date` như user nhập (tôn trọng đúng chuỗi họ gõ); trống thì ẩn hẳn dòng ngày.

## Font

Satori (engine của `ImageResponse`) cần buffer font, không đọc `@font-face` trong CSS.

- Map tên font template → file, lấy từ khai báo `@font-face` sẵn có trong `src/app/globals.css`. Có 6 font được `chungdoiThemeConfig` dùng cho tên cặp đôi:
  - Fz Aghita → `FzAghita.ttf`
  - Fz Qellia → `Fz_Qellia_Fix.ttf`
  - UNI Chu truyen thong → `UNI_Chu_truyen_thong.ttf`
  - DFVN New Eddy → `DFVN-NewEddy-Regular.otf`
  - Pattaya → `Pattaya-Regular.woff`
  - 1FTV VIP Signora → `1FTV-VIP-Signora-Regular.otf`
- Mỗi request chỉ đọc **1 file font** của template đó bằng `fs.readFile` từ `public/chungdoi/fonts/`, truyền vào `ImageResponse({ fonts: [...] })`.
- Template để `fonts.couple = null` hoặc không tra được → dùng font serif mặc định `Lora-Regular.ttf` (có sẵn, phủ đủ dấu tiếng Việt).

## Hoa văn (decor)

`cardImages` trong theme-config là file `.webp`. **Satori không render `.webp`** (chỉ PNG/JPEG/SVG).

**Giải pháp (B1 — convert in-memory tại request-time):**
- Khi OG request tới, đọc 1-4 file webp của đúng template đó (theo `cardImages[].src`) → `sharp(buffer).png().toBuffer()` → nhúng vào layout Satori dạng data URI PNG.
- Không sinh file png trên đĩa, repo sạch, không cần script build.
- OG request rất hiếm (chỉ khi Facebook/Zalo/crawler quét link) → convert 1-4 ảnh in-memory + cache header là quá đủ, không lo latency.
- `sharp` đã có sẵn trong deps (`^0.35.3`).
- Vị trí/kích thước/opacity của decor: tham chiếu `cardImages[].className` để đặt ở góc card cho khớp tinh thần thiết kế, nhưng đơn giản hóa (Satori chỉ nhận flexbox + inline style, không nhận Tailwind class thô).

## Layout (kiểu A — card thuần theme)

- Nền: `theme.background` (gradient của template).
- Chính giữa: tên cặp đôi (font template, màu `textPrimary`, cỡ lớn) + dấu `&` + dòng ngày (nếu có).
- Hoa văn: 1-4 PNG đã convert, đặt ở góc, opacity thấp làm điểm nhấn.
- Toàn bộ style inline (Satori không nhận Tailwind class phức tạp).

## Error handling

- Thiệp không tồn tại / chưa publish → card fallback tối giản (không throw).
- Không tra được theme-config → fallback màu theo `primaryColor`.
- Không đọc được file font → fallback Lora.
- Không đọc được / convert lỗi file decor → bỏ qua decor đó (card vẫn render với nền + chữ), không để cả ảnh fail.

## Testing / verify

- `npm run typecheck` + `npm run build` phải pass.
- Verify thủ công: mở `http://localhost:3000/thiep/<slug>/opengraph-image` trên dev, kiểm tra ảnh render đúng với vài template khác nhau (có font riêng vs null font; có decor vs không) và trường hợp thiệp thiếu ngày.
- Kiểm tra thẻ `og:image` xuất hiện trong HTML trang thiệp.
- (User tự verify preview thật trên Facebook/Zalo sau khi deploy.)

## Ngoài phạm vi (YAGNI)

- Không làm layout B/C (ảnh cưới nền) — đã chốt kiểu A.
- Không pre-convert decor ra file đĩa (đã bỏ B2).
- Không cache ảnh sinh sẵn lúc publish.
- Không đổi nội dung/thiết kế trang thiệp, chỉ thêm OG image.
