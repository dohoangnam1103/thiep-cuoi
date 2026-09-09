# Botanic Kem — khoảng cách sổ lưu bút

Ngày: 2026-09-09. Tham chiếu: [http://localhost:3001/mau-thiep/botanic-kem/demo](http://localhost:3001/mau-thiep/botanic-kem/demo). Chỉ kiểm tra lỗi khoảng cách guestbook theo yêu cầu, không nghiệm thu clone toàn bộ mẫu.

Ảnh nền absolute không giữ chiều cao trong luồng bố cục; danh sách có thể đè giấy/hoa.

Đặt ảnh nền và form cùng ô grid; danh sách nằm sau chiều cao lớn hơn của ảnh/form. Giữ kích thước, containing block và offset artwork. Giữ khoảng cách form cũ khi đã đủ rộng, bảo đảm ít nhất 24px dưới artwork; phần padding bổ sung chỉ có khi có lời chúc.

Dữ liệu thiệp local hiện có: 10 lời chúc demo; list giữ giới hạn cao 500px và cuộn nội bộ.

| Bề rộng | Form → list | Artwork → list | Form → list khi báo lỗi |
| --- | ---: | ---: | ---: |
| 320 | 65.00px | 87.73px | 65.00px |
| 390 | 65.00px | 36.27px | 65.00px |
| 439 | 88.77px | 24.00px | 65.00px |
| 480 | 118.91px | 24.00px | 88.91px |
| 1440 | 130.00px | 47.11px | 130.00px |


Bằng chứng đo: [brown-green-measurements.json](brown-green-measurements.json). Ảnh đã xem: [mobile 390px](minimalism-brown-390-after.png), [desktop 1440px](minimalism-brown-1440-after.png).

- **Đã kiểm tra:** mở thiệp, dừng auto-scroll, font/ảnh nền tải xong, guestbook mobile/desktop, khoảng cách danh sách, empty-submit validation, không tràn ngang. Viewport 320×844, 390×844, 439×844, 480×844, 1440×1000; zoom 100%, Chromium; ảnh có thể chứa nút demo cố định, không phải preview marketing.
- **Không áp dụng:** thay copy/i18n, thay luồng submit, thay asset, tạo preview catalog, thay calendar/ceremonies.
- **Chưa kiểm tra:** gửi lời chúc hợp lệ tới DB; toàn bộ hero/album/calendar/gift modal/footer theo checklist clone. Không ghi các phần đó đạt trong lần sửa khoảng cách này.
- **Mã:** typecheck và ESLint 3 renderer sửa đạt. `npm run lint` toàn repo báo 1.043 errors / 30.383 warnings ngoài phạm vi lint 3 renderer. Không chạy build vì thay đổi chỉ ở bố cục component.
