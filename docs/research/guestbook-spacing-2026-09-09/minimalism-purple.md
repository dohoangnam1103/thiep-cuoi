# Elegant Tím Lavender — khoảng cách sổ lưu bút

Ngày: 2026-09-09. Tham chiếu: [http://localhost:3001/mau-thiep/elegant-tim-lavender/demo](http://localhost:3001/mau-thiep/elegant-tim-lavender/demo). Chỉ kiểm tra lỗi khoảng cách guestbook theo yêu cầu, không nghiệm thu clone toàn bộ mẫu.

Không thấy lỗi tương tự; form/list nằm trong normal flow, không có ảnh giấy absolute phía sau.

Không thay đổi thiết kế. Lavender dùng nhánh không có artwork của renderer Đỏ Đô; xác nhận lại sau thay đổi cấu trúc.

Dữ liệu demo hiện có 10 lời chúc.

Đo 320, 390, 439 và 1440px: form → list = 32px trước/sau validation; không tràn ngang.


Bằng chứng đo: [other-templates-measurements.json](other-templates-measurements.json). Ảnh đã xem: [mobile 390px](minimalism-purple-390-checked.png), [desktop 1440px](minimalism-purple-1440-checked.png).

- **Đã kiểm tra:** mở thiệp, dừng auto-scroll, font/ảnh nền tải xong, guestbook mobile/desktop, khoảng cách danh sách, empty-submit validation, không tràn ngang. Viewport 320×844, 390×844, 439×844, 1440×1000; zoom 100%, Chromium; ảnh có thể chứa nút demo cố định, không phải preview marketing.
- **Không áp dụng:** thay copy/i18n, thay luồng submit, thay asset, tạo preview catalog, thay calendar/ceremonies.
- **Chưa kiểm tra:** gửi lời chúc hợp lệ tới DB; toàn bộ hero/album/calendar/gift modal/footer theo checklist clone. Không ghi các phần đó đạt trong lần sửa khoảng cách này.
- **Mã:** typecheck và ESLint 3 renderer sửa đạt. `npm run lint` toàn repo báo 1.043 errors / 30.383 warnings ngoài phạm vi lint 3 renderer. Không chạy build vì thay đổi chỉ ở bố cục component.
