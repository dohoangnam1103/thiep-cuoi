# Thiết kế Home page v6 — "Hành trình về chung một nhà"

- Ngày: 2026-08-22
- Trạng thái: đã duyệt qua hội thoại (user chọn "OK hết — ghi spec")
- Phạm vi: **chỉ lab variant mới**. Không sửa production Home Page (`src/app/[locale]/page.tsx`) hay bất kỳ variant cũ nào.

## 1. Bối cảnh

Lab `/home-2/lab` có 5 wireframe variant (V1 thiệp mở ra, V2 thiệp du hành, V3 album lật ngang, V4 tơ hồng, V5 hai người đi về phía nhau). Quyết định của user: ghép điểm mạnh nhiều variant thành **một** biến thể mới **v6**, dùng bộ kit lo-fi như các variant khác — chỉ cấu trúc + chuyển động, chưa đắp art direction thật.

- Xương sống: **V5** (kịch bản 5 hồi scroll-driven).
- Sợi chỉ đỏ: lớp tơ hồng của **V4** chạy xuyên suốt, nối các hồi.
- Nhịp thông tin: kiểu **V2** — mỗi màn đúng một tính năng, panel xen kẽ trái/phải.
- Hồi kết: kiểu **V1** — mở phong bì trước khi hiện link chia sẻ.

## 2. Bản đồ 5 hồi (xương V5)

Toàn trang là 1 stage scroll-driven dùng `useStageProgress`; progress `p ∈ [0,1]`. Chibi cô dâu/chú rể dùng contract sẵn có (`ChibiBride`, `ChibiGroom`, FIG_W/FIG_H/HAND_Y).

| p | Hồi | Chuyển động | Payload info (kiểu V2) |
|---|-----|-------------|------------------------|
| 0.00–0.10 | Mở màn | Hai người đứng ở hai đầu, hai nền màu khác nhau (SIDE_A/SIDE_B), tên sự kiện | Hero text block |
| 0.10–0.50 | Đi lại | Hai người đi từ hai mép về trung tâm; mỗi người mang payload | 4 milestone xen kẽ trái/phải: 01 Mẫu thiệp · 02 Tạo trong vài phút · 03 QR + nhạc + album · 04 Gửi bằng một link |
| 0.50–0.62 | Gặp | Dừng tại điểm gặp, nắm tay (HAND_Y), nhãn "Đã gặp" | Milestone 05: "Một câu chuyện — hai nửa" |
| 0.62–0.76 | Thiệp mọc | Từ điểm gặp mọc lên khung thiệp lo-fi | TextBlock mô tả editor |
| 0.76–1.00 | Phong bì + chia sẻ | Phong bì đứng (portrait) mở nắp, thiệp trượt ra, rồi hiện FakeButton link chia sẻ | CTA cuối |

Màn hẹp (<768px) dùng bố cục chéo của V5 (~16% offset, budget 844px); payload info chuyển thành block xếp dọc giữa các hồi. `useReducedMotion`: chibi + phong bì hiển thị ở tư thế cuối, không animate; milestone vẫn hiện tuần tự theo scroll.

## 3. Lớp tơ hồng (V4)

SVG full-page `preserveAspectRatio="none"`, `vector-effect="non-scaling-stroke"`, `pathLength={1}`; `strokeDashoffset = 1 − p` nên sợi chỉ đỏ vẽ dần theo toàn bộ hành trình, băng qua mọi hồi. Đường bezier chữ S dựng bằng `buildThread()` (UNIT=100, AXIS=11, SWING=8). Không sticky, không JS đo từng frame ngoài progress sẵn có — mobile-friendly.

## 4. Phong bì hồi kết (V1)

Giữ nguyên invariants geometry của V1:

- Phong bì **đứng** (portrait).
- CARD_W < ENV_W và CARD_H + CARD_INSIDE_Y < ENV_H — thiệp không lòi ra sau khi trượt vào.
- 3 lớp tối dần vào trong: ENV_BACK #dcd4c6 → ENV_FRONT #d0c7b6 → ENV_FLAP #c2b8a4; thiệp sáng nhất.
- Trình tự: nắp gập mở (0.76–0.84) → thiệp trượt lên (0.84–0.92) → FakeButton chia sẻ fade in (0.92–1.00).

## 5. Cấu trúc file

```
src/components/home2/lab/v6-merged.tsx      # component chính ("use client"), mirror pattern v5-approach
src/app/[locale]/home-2/lab/v6/page.tsx     # route: metadata noindex + setRequestLocale, return <V6Merged />
src/app/[locale]/home-2/lab/page.tsx        # thêm entry V6 vào VARIANTS registry
```

Nếu `v6-merged.tsx` phình (>~900 dòng như v5), tách module con cùng thư mục `src/components/home2/lab/` (ví dụ `v6-thread.tsx`, `v6-envelope.tsx`) — quyết định khi viết plan, không phải giờ.

Copy hiển thị: hardcode tiếng Việt trong lab được (các variant hiện tại cũng vậy), vì đây là wireframe noindex, không phải production copy.

## 6. Kiểm thử & xác nhận

- `npm run lint` + `npm run typecheck` pass.
- `npm run build:local` pass.
- Kiểm tra tay trên dev server: cuộn hết hành trình ở cả viewport rộng/hẹp; bật reduced-motion xem fallback.
- Không thêm E2E mới — lab variant, user tự xem UI (đúng precedent feedback_clone_verify).

## 7. Ngoài phạm vi

- Art direction thật (font, ảnh, màu thương hiệu) — đắp sau khi chốt wireframe.
- Sửa production Home Page, listing/pricing/stats commercial sections.
- i18n catalog cho copy lab.
