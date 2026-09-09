# Minimalism Đỏ Đô — Văn Quốc & Hà Nhung — khoảng cách sổ lưu bút

## Cập nhật: thu gọn nền sổ lưu bút

Theo phản hồi tiếp theo ngày 2026-09-09, bản giữ toàn bộ chiều cao ảnh còn dư giấy dưới nút gửi. Bản hiện tại để form quyết định chiều cao khung; chừa khoảng 32px từ nút gửi đến mép giấy và tiếp tục giữ list cách đáy artwork 32px.

Dùng chính artwork cũ qua `border-image` ba dải ngang: 300px phía trên giữ góc giấy, 500px phía dưới giữ nguyên toàn bộ hoa; dải giữa co/giãn theo nội dung. Không đổi hay nén ảnh nguồn. Bốn file giấy của nhóm Đỏ Đô/Hồng Phấn/Xanh Ngọc/Xanh Bầu Trời có SHA-1 giống nhau `8133b5e7f4a0ae93ef3ecdd6fa35c6ee5013551e`, nên dùng cùng nguồn CSS. Containing block là frame rộng bằng section; artwork vẫn rộng min(120% frame,650px), offset trên -15px/mobile và -30px/desktop.

Ở439px, artwork gọn hơn khoảng80,45px; ở480px khoảng118,70px; ở1440px khoảng55,23px. Ở320px khung có thể cao thêm để giữ khoảng đệm dưới nút thay vì ép form vào artwork nhỏ. Validation tăng nội dung thì nền tự tăng chiều cao.

Ảnh hiện tại: [390px](minimalism-dark-red-390-compact.png), [439px](minimalism-dark-red-439-compact.png), [1440px](minimalism-dark-red-1440-compact.png). Bằng chứng đo hiện tại: [compact-measurements.json](compact-measurements.json). Các ảnh/table `after` ở phần dưới lưu bản trước khi thu gọn. Đã kiểm tra lại 320/390/439/480/1440px và empty-submit validation; source TS đã qua ESLint và typecheck. Riêng Đỏ Đô còn thử textarea cao440px + validation, giấy vẫn kín và list cách artwork32px.

Ngày: 2026-09-09. Tham chiếu: [http://localhost:3001/thiep/van-quoc-ha-nhung-20092026](http://localhost:3001/thiep/van-quoc-ha-nhung-20092026). Chỉ kiểm tra lỗi khoảng cách guestbook theo yêu cầu, không nghiệm thu clone toàn bộ mẫu.

Ảnh nền absolute không giữ chiều cao trong luồng bố cục; danh sách có thể đè giấy/hoa.

Đặt ảnh nền và form cùng ô grid; danh sách nằm sau chiều cao lớn hơn của ảnh/form. Giữ kích thước, containing block và offset artwork. Danh sách cách mép dưới toàn bộ ảnh nền 32px.

Dữ liệu thiệp local hiện có: 1 lời chúc.

| Bề rộng | Form → list | Artwork → list | Form → list khi báo lỗi |
| --- | ---: | ---: | ---: |
| 320 | 84.73px | 32.00px | 54.73px |
| 390 | 161.23px | 32.00px | 131.23px |
| 439 | 214.78px | 32.00px | 184.78px |
| 480 | 259.59px | 32.00px | 229.59px |
| 1440 | 206.00px | 32.00px | 176.00px |


Bằng chứng đo: [minimalism-measurements.json](minimalism-measurements.json). Ảnh đã xem: [mobile 390px](minimalism-dark-red-390-after.png), [desktop 1440px](minimalism-dark-red-1440-after.png).

- **Đã kiểm tra:** mở thiệp, dừng auto-scroll, font/ảnh nền tải xong, guestbook mobile/desktop, khoảng cách danh sách, empty-submit validation, không tràn ngang. Viewport 320×844, 390×844, 439×844, 480×844, 1440×1000; zoom 100%, Chromium; ảnh có thể chứa nút demo cố định, không phải preview marketing.
- **Không áp dụng:** thay copy/i18n, thay luồng submit, thay asset, tạo preview catalog, thay calendar/ceremonies.
- **Chưa kiểm tra:** gửi lời chúc hợp lệ tới DB; toàn bộ hero/album/calendar/gift modal/footer theo checklist clone. Không ghi các phần đó đạt trong lần sửa khoảng cách này.
- **Mã:** typecheck và ESLint 3 renderer sửa đạt. `npm run lint` toàn repo báo 1.043 errors / 30.383 warnings ngoài phạm vi lint 3 renderer. Không chạy build vì thay đổi chỉ ở bố cục component.
