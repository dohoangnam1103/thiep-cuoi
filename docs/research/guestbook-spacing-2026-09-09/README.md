# Sửa khoảng cách danh sách lời chúc — 2026-09-09

**Bản hiện tại:** đã thu gọn thêm phần giấy thừa dưới nút gửi cho nhóm Đỏ Đô/Hồng Phấn/Xanh Ngọc/Xanh Bầu Trời. Xem ảnh `*-compact.png` và `compact-measurements.json`; các ảnh `*-after.png` giữ bản của lần sửa overlap đầu tiên.

Nguồn yêu cầu: thiệp Văn Quốc – Hà Nhung trên localhost:3001 và ảnh người dùng ở viewport 439×765.

Đã sửa 6 mẫu: Minimalism Đỏ Đô, Hồng Phấn, Xanh Ngọc, Xanh Bầu Trời, Botanic Kem, Minimal Xanh Sage. Tối Giản Đỏ và Elegant Tím Lavender không thấy lỗi tương tự.

Nguyên nhân: ảnh giấy/hoa đặt absolute có chiều cao vượt khối form; margin tĩnh của list không theo chiều cao ảnh khi đổi viewport. Dùng grid chung ô cho ảnh/form, để list theo sau chiều cao thật. Giữ palette, artwork, chiều rộng form/list và binding submit. Thêm kích thước ảnh để giữ chỗ trước lazy load.

Trước sửa ở 439px, list Đỏ Đô bắt đầu cao hơn đáy ảnh 150,78px. Botanic Kem và Sage ở 480px chồng lên bounding box ảnh lần lượt 29,91px / 51,25px; ảnh trước sửa xác nhận họa tiết chạm/đè card. Sau sửa, Đỏ Đô và 3 biến thể giữ 32px dưới ảnh, Botanic/Sage tối thiểu 24px (giữ margin cũ khi đã đủ). Form validation vẫn có khoảng trống. Tối Giản Đỏ không có wish thật ở demo; populated-list check dùng fixture DOM tạm, không ghi DB.

## Ghi chú từng mẫu

- [Minimalism Đỏ Đô — Văn Quốc & Hà Nhung](minimalism-dark-red.md)
- [Minimalism Xanh Ngọc](minimalism-jade.md)
- [Minimalism Xanh Bầu Trời](minimalism-sky-blue.md)
- [Minimalism Hồng Phấn](minimalism-powder-pink.md)
- [Botanic Kem](minimalism-brown.md)
- [Minimal Xanh Sage](minimalism-green.md)
- [Tối Giản Đỏ](minimalism-red.md)
- [Elegant Tím Lavender](minimalism-purple.md)
