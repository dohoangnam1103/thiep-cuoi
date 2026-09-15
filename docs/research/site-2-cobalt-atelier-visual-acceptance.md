# Site 2 Cobalt Atelier Visual Acceptance

Ngày: 2026-09-15. Phạm vi: Task 12 trong
`docs/superpowers/plans/2026-09-14-site-2-cobalt-atelier-redesign.md`.
Thực hiện trên build local + SQLite tách biệt, ảnh preview chỉ copy tạm
7 mẫu để chụp rồi xóa (prod sync từ master public qua Dockerfile).

## 1. Matrix trang và viewport

Chạy `tests/e2e/site-2-visual.spec.ts` trên 4 projects
(visual-desktop 1440x900, visual-mobile 390x844, visual-dark,
visual-reduced): 36/36 pass sau khi sửa các mục dưới.

| Trang | Desktop | Mobile | Dark | Reduced | Ghi chú |
|---|---|---|---|---|---|
| `/` homepage | pass | pass | pass | pass | Nav <= 72px, H1 vừa viewport đầu, CTA nowrap, 1 eyebrow |
| `/mau-thiep` catalog | pass | pass | pass | pass | Header gọn, grid 1/2/3/4, drawer mobile |
| `/bang-gia` pricing | pass | pass | pass | pass | 1 CTA, giá Liên hệ, FAQ keyboard |
| `/dang-nhap` auth | pass | pass | pass | pass | 0 input thiếu label, form-first mobile |
| `/huong-dan` | pass | pass | pass | pass | Search + pills, anchor `#slug` |
| 3 trang policy | pass | pass | pass | pass | TOC sticky desktop, khổ đọc 68ch |
| 404 | pass | pass | pass | pass | 1 CTA về catalog, recovery bằng bàn phím |
| Dashboard trống/có việc | pass | - | pass | pass | Sidebar sticky desktop, drawer mobile |
| Editor | pass | pass (sheet) | pass | pass | 3 cột xl, sheet full-screen mobile |
| Guest manager | pass | pass (cards) | - | - | Table desktop, cards mobile, overflow 0 |
| RSVP overview | pass | - | - | - | Counts + rows, empty dẫn về guest |
| Payment sandbox | pass | - | - | - | QR 240px quét được, polling có chặn |

Overflow ngang = 0 trên mọi trang ở 390px, 1440px và 320px (check thủ công
editor/guest ở 320: flex + truncate, không scroll).

## 2. Tương phản (tính tay từ token, chưa đo bằng axe)

| Cặp | Ratio | Kết luận |
|---|---|---|
| Trắng `#f8f9ff` trên cobalt `#2946D3` (light CTA) | ~7.2 | Pass AAA |
| Trắng trên cobalt sáng `#4c68f0` (dark CTA) | ~4.6 | Pass AA |
| Ink `#121a2c` trên canvas `#f3f5fa` | ~15 | Pass AAA |
| Muted `#687084` trên canvas (light body phụ) | ~4.6 | Pass AA |
| Muted `#9aa3b8` trên canvas `#10182e` (dark) | ~6.8 | Pass AA |
| Success `#177245` / danger `#c0362c` / warning `#9a5b00` trên surface sáng | 5.4-5.6 | Pass AA |

## 3. Fidelity mẫu thiệp

- Không commit nào chạm renderer: `git diff BASE..HEAD -- packages src` rỗng
  đối với mọi file đã commit (dirt site-1 trong worktree là có sẵn từ trước,
  không thuộc diff).
- Bìa jasmine-white và silk-flora-brown chụp desktop + mobile: serif/olive
  (jasmine) và nâu/kem (silk) nguyên vẹn, không leak font/màu/spacing Cobalt.
- Trạng thái mở (calendar, guestbook entries, gift, footer) verify chức năng
  trên prod build qua E2E (mở bìa, tên cặp đôi, footer) cho cả hai mẫu.
- Dev (Turbopack) không mở được cover nhưng prod build mở được: quirk môi
  trường, hai mẫu như nhau, không phải regression.

## 4. Performance (Lighthouse 13.4.1 + RUM script, local)

| Trang | LCP | CLS | TBT / tương tác |
|---|---|---|---|
| `/` desktop | 1.05s | 0 | 0ms |
| `/mau-thiep` desktop | 0.75s | 0 | 0ms |
| `/` mobile (Moto G chậm) | 5.5s | 0 | 23ms |
| `/dashboard` | 0.04s | 0 | - |
| `/editor` | 0.25s | 0 | 24ms (gõ tới paint) |

Ngoại lệ duy nhất: LCP mobile homepage 5.5s > 2.5s. Nguyên nhân: 2 ảnh hero
(~230KB) + cards gallery cạnh tranh băng thông trên 4G giả lập. Đã làm:
bỏ trùng pixel hero/gallery, gallery lazy + fetchPriority low (4.3s bản đầu
đo thiếu ổn định 4.3-6.1s, không cải thiện căn bản). Issue riêng: sinh crop
responsive cho hero theo aspect hiển thị thay vì ảnh listing full.
Môi trường đo thiếu đa số preview assets nên số prod có thể lệch.

## 5. Sửa từ audit đợt này (file site-2)

- Marketing nav/footer + demo top bar chuyển sang token `--s2-*` (dark mode
  hết trắng toát).
- Homepage gallery bỏ trùng pixel với hero (curated 2 + 5 riêng).
- Gallery lazy toàn bộ + fetchPriority low.
- Copy em dash: pricing/catalog (shared catalog descriptions chuẩn hóa ở
  tầng hiển thị site-2, không đụng data site-1).
- `error.tsx` thêm `"use client"` (nút Thử lại trước đó chết).

## 6. Khuyết điểm đã biết, ngoài Task 12

- Nút upload ảnh khách (media dialog trong renderer) POST tới endpoint chưa
  có → 404 cho tới task media riêng. Copy mediaLabels đã trung tính, không
  bịa giới hạn.
- Shared catalog descriptions nhắc brand lạ ("Thiệp Mừng Online") và đã
  chuẩn hóa dash ở tầng hiển thị. Viết lại data gốc thuộc về roadmap template.
- Dark mode theo system preference + `[data-s2-theme]`; toggle tay trong
  workspace chưa có (hẹn Task 7 đợt sau hoặc polish).
