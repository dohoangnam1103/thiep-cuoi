# Revamp UI toàn project — hướng "Sáng & sang" (Sage & Cream)

**Ngày:** 2026-07-04
**Trạng thái:** Đã duyệt thiết kế, chờ viết plan triển khai

## Mục tiêu

Revamp toàn bộ giao diện của project sang hướng "Sáng & sang" với bảng màu **Sage & Cream** (kem ngả xanh sage + vàng đất, botanical thanh lịch). **Chỉ thay đổi giao diện, không thay đổi chức năng.**

## Ràng buộc tuyệt đối (KHÔNG đụng)

- **`src/components/chungdoi-demo.tsx`** — render cả trang demo (`/mau-thiep/[slug]/demo`) lẫn thiệp đã publish (`/thiep/[slug]`). Giữ nguyên **từng chi tiết**, không sửa một dòng nào.
- **`src/app/thiep/layout.tsx`** và toàn bộ trang thiệp đã publish.
- Trang thiệp chi tiết đã immersive sẵn (layout chỉ có `html/body`, không có chrome sáng để ẩn) → revamp tự nhiên không chạm tới.

## Ngôn ngữ thiết kế

### Màu (design tokens — `src/app/globals.css`)
- Chuyển toàn bộ token oklch từ dark → light: nền kem ngả sage, chữ nâu đậm, accent vàng đất + sage.
- **Giữ nguyên tên biến** (`--primary`, `--background`, `--foreground`, `--card`, `--border`…) để component kế thừa mà không phải sửa từng chỗ.
- Thumbnail thiệp trong listing **giữ nền tối** cố ý — làm cầu nối trực quan sang trang thiệp detail immersive.

### Typography
- Tiêu đề: **serif cổ điển** (line-height rộng, letter-spacing nhẹ ở heading).
- Body: **sans thoáng**.

### Component
- Nút: bo **viên thuốc** (pill).
- Card: bo mềm + **shadow ấm**, viền mảnh tông sage.

## Chrome dùng chung

Hiện có **2 bộ header/footer trùng lặp**:
- Homepage (`chungdoi-clone.tsx`) tự viết header/footer/nav **inline**.
- Các trang còn lại (listing, pricing, tools, blog, help, policy) dùng `SiteHeader`/`SiteFooter` trong `chungdoi-chrome.tsx`.

**Sau revamp:** gộp về **một bộ** trong `chungdoi-chrome.tsx`, style Sage & Cream. Homepage bỏ phần inline (~120 dòng) và dùng chung. Giữ nguyên toàn bộ chức năng: link nav (templates/pricing/tools/blog/help), chuyển ngôn ngữ, nút chat nổi, mobile bottom nav.

## Phạm vi từng trang (revamp — dựng lại bố cục thoải mái, chỉ giao diện)

| Trang | File | Ghi chú |
|---|---|---|
| Homepage | `chungdoi-clone.tsx` | Hero serif, lưới mẫu nổi bật, tính năng, CTA sage. Bỏ chrome inline. |
| Listing `/mau-thiep` | `chungdoi-listing.tsx` | Hero + chip filter, lưới card sáng, thumbnail thiệp giữ nền tối. |
| Pricing | `chungdoi-pricing.tsx` | Toggle chu kỳ, 3 card giá. **Giữ nguyên nội dung/giá hiện có.** |
| Tools | `chungdoi-tools.tsx` | Áp tông + typography + card mới. |
| Policy | `chungdoi-policy.tsx` | Áp tông + typography. |
| Blog | `blog/page.tsx`, `blog/[slug]/page.tsx` | Áp tông + typography + card. |
| Help | `help/page.tsx` | Áp tông + typography. |
| Auth | `(auth)/login`, `(auth)/signup` | Form nền sáng, nút pill. |
| Dashboard | `dashboard/`, `[id]/guests`, `[id]/rsvp` | Bảng/list/card tông sáng. |
| Editor | `editor/[id]` | Chỉ áp tông sáng cho khớp. Giữ nguyên logic upload/toast/sticky bar (đã nâng cấp đợt trước). |

### KHÔNG đụng
- `chungdoi-demo.tsx` (demo + published invitations).
- Layout `thiep/` + trang thiệp đã publish.
- `/mau-thiep/[slug]/demo` (trang thiệp chi tiết). Lưu ý: `/mau-thiep/[slug]` chỉ redirect sang `/demo`, không có UI riêng.

## Kiểm thử & rủi ro

- **Verify:** sau mỗi trang, `npm run dev` mở trực tiếp trên trình duyệt kiểm tra golden path + responsive (mobile-first). Cuối cùng `npm run check` (lint + typecheck + build) sạch.
- **i18n:** mọi copy mới qua message catalog (`messages/*.json`), không hardcode. Phần lớn chỉ đổi style nên ít chuỗi mới.
- **Không còn bug chặn build:** bug `useLightboxSwipe` trong `chungdoi-demo.tsx` (ghi chú cũ) đã không còn — `npx tsc --noEmit` chạy sạch. Không cần đụng file này.

## Thứ tự triển khai

1. Design tokens (`globals.css`)
2. Chrome dùng chung (`chungdoi-chrome.tsx`) + homepage bỏ inline
3. Homepage (`chungdoi-clone.tsx`)
4. Listing (`chungdoi-listing.tsx`)
5. Pricing (`chungdoi-pricing.tsx`)
6. Tools / Policy / Blog / Help
7. Auth (login, signup)
8. Dashboard (page, guests, rsvp)
9. Editor (áp tông)
10. `npm run check` sạch + verify tổng thể trên trình duyệt

## Mockup tham khảo

Đã duyệt trong phiên brainstorm (visual companion): `direction`, `transition`, `visual-language` (palette Sage & Cream), `homepage`, `listing`, `pricing` — lưu ở `.superpowers/brainstorm/` (gitignored).
