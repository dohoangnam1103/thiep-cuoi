# Hồng Vân — kích thước bìa responsive

Ngày kiểm tra: 2026-09-06. Phạm vi: bìa chưa mở và chuyển tiếp vào detail trên renderer 2D đang bật ở local.

## Tham chiếu đã đo

- http://localhost:3000/mau-thiep/song-hy-do/demo
- http://localhost:3000/mau-thiep/gam-hoa-do/demo
- Mẫu sửa: http://localhost:3000/mau-thiep/hong-van-hoa-hong/demo

Đo sau khi font tải xong, cùng viewport, zoom mặc định. Song Hỷ Đỏ và Gấm Hoa Đỏ cho cùng kích thước khung. Số đo đầy đủ và ảnh trước sửa nằm trong `cover-sizing-before.json`, `cover-before-*.png`.

| Viewport | Bìa tham chiếu | Hồng Vân sau sửa |
| --- | --- | --- |
| 1440 × 900 | 732 × 517.5 | 732 × 518 |
| 1024 × 768 | 732 × 517.5 | 732 × 518 |
| 768 × 1024 | 640 × 517.5 | 640 × 518 |
| 640 × 960 | 340 × 556 | 340 × 556 |
| 390 × 844 | 310 × 537.5 | 310 × 538 |
| 320 × 568 | 253.53 × 439.59 | 253.53 × 440 |

## Nguyên nhân và thay đổi

- Hồng Vân tự đặt khung ngoài rộng 980px và khung trong theo 82vw, nên hai khung khác kích thước ở tablet/desktop nhỏ; bộ fit viewport đo khung ngoài khiến bìa thật co lệch.
- Bìa mobile cũ dùng tỷ lệ 4:5, chỉ cao khoảng 419px ở viewport 390px; nhánh ngang còn kích hoạt từ 640px, sớm hơn mẫu chuẩn (768px).
- Bỏ nhánh chiều rộng riêng, dùng khung chung `310 / 340 / 640 / 732px` với `fitEnvelopeWidth` hiện có. Bìa con `w-full` khớp khung đo.
- Chiều cao tối thiểu theo các mẫu chuẩn: khoảng 538px mobile, 556px ở 640–767px, 518px từ 768px. Nội dung vẫn ở normal flow để tên dài làm bìa cao lên khi cần; bộ fit chung thu cả bìa khi viewport thấp.
- Đưa bố cục trang trí ngang sang breakpoint 768px; điều chỉnh cỡ chữ/khoảng cách theo chiều rộng khung thay cho viewport.

## Nghiệm thu

- Đã đo 12 viewport, gồm 1920, 1440, 1280, 1024, 768, 767, 640, 639, 390, 375, 320px và màn hình ngang 844 × 390. Xem `cover-sizing-after.json`.
- Tất cả đều nằm giữa (sai số dưới 0.001px), bìa/nút nằm trong viewport, không tràn ngang. Hai phía của breakpoint 640px và 768px đúng chiều dọc/ngang.
- Đã xem ảnh desktop, mobile, tablet và ảnh thử tên dài. `cover-after-*.png`; `cover-long-names-390.png` thử chuỗi dài trực tiếp trong DOM, không ghi dữ liệu người dùng.
- Ảnh bìa tải đủ, bấm Mở thiệp gỡ bìa và hiện detail ở desktop/mobile. Chi tiết tương tác: `cover-opening-check.json`.
- Lint: 0 lỗi, 32 cảnh báo có sẵn. Typecheck: đạt. `git diff --check`: đạt.

Không kiểm thử lại WebGL 3D (local đang dùng renderer 2D) hay toàn bộ form/editor: thay đổi lần này chỉ thuộc kích thước bìa và bố trí nội dung bìa.
