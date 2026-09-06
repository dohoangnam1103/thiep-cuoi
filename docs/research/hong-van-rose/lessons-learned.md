# Hồng Vân — Hoa Hồng: nhật ký lỗi và nguyên tắc tái sử dụng

Ngày ghi chú: 2026-09-07.

Tài liệu này tổng hợp các vấn đề đã xuất hiện qua nhiều vòng review. Đây là checklist phòng lỗi cho những mẫu sau, không phải yêu cầu thay đổi nội dung của mẫu hiện tại.

## Các vấn đề đã gặp

| Vấn đề | Nguyên nhân chính | Quy tắc cho mẫu sau |
| --- | --- | --- |
| Bìa desktop bị dựng thành dọc hoặc sai kích thước | Dùng một tỉ lệ cho mọi viewport, không đo mẫu có sẵn | Đo riêng desktop ngang, tablet, mobile dọc và màn hình ngang; đặt kích thước theo containing block của bìa |
| Bìa bị lệch, có khung thừa và nút sai vị trí | Offset theo toàn trang, chồng renderer/control chrome, không đối chiếu với mẫu chuẩn | Đo tâm khung bằng bounding box; kiểm tra trạng thái chưa mở và đã mở; đặt nút sử dụng ở vị trí chuẩn; bỏ control không có vai trò |
| Dây tơ hồng trông như ống nước, quá thẳng hoặc animation quá nhanh | Dùng nét CSS/SVG thiếu texture và timing chưa được kiểm tra | Với dây là artwork chính, dùng ảnh RGBA có chi tiết; nếu chuyển động thì kiểm tra ở tốc độ chậm và có fallback tĩnh |
| Asset hoa bị cắt đột ngột ở mép | Ảnh nguồn bị crop tại canvas, không kiểm tra alpha và mép ngoài | Kiểm tra alpha bbox, bốn cạnh và trạng thái render trên nền thật trước khi đăng ký asset |
| Vòng hoa chỉ phủ nửa bìa hoặc để khoảng trống quanh ảnh | Lỗ trong artwork không khớp khung ảnh; dùng scale để bù sai tỉ lệ | Tạo asset theo đúng tỷ lệ lỗ ảnh; hoa chạm đủ bốn cạnh; chỉ tinh chỉnh scale nhỏ trong containing block |
| Hoa che mặt, chữ hoặc nút | Chưa có vùng an toàn, z-index và vị trí hoa được kiểm tra theo nội dung thật | Đặt ảnh dưới hoa, nhưng giữ khuôn mặt/vùng chữ an toàn; chụp screenshot với ảnh upload thật và nội dung dài |
| Detail bị chia mảng, khác phong cách cover | Nền và chất liệu được dựng riêng từng phần | Chốt palette, texture, radius và nền xuyên suốt trước khi dựng section; dùng card trong suốt vừa đủ |
| Hoa detail lặp lại vô cảm hoặc đặt sai chỗ | Tăng mật độ bằng cách nhân bản một bó hoa | Chuẩn bị nhiều biến thể; đặt cụm theo vai trò của section; top banner/footer cần mật độ cao, vùng chữ cần khoảng thở |
| Ảnh mở đầu quá lớn hoặc sai hướng | Không tham chiếu kích thước ảnh của các mẫu đang có; không tính ảnh upload bất kỳ | Dùng khung dọc 3:4 cho mẫu này, `object-cover`, thử ảnh ngang/dọc và nội dung dài ở 390/320px |
| Ảnh và hoa sai thứ tự lớp | Đặt artwork trước ảnh hoặc dùng z-index không cùng containing block | Ảnh ở lớp nền, hoa ở lớp phủ; `position`, `isolation` và z-index phải nằm trong cùng `data-portrait-frame` |
| QR bị lộ ngay trên thiệp | Dùng trực tiếp mã QR thay vì luồng phong bao chung | Mặt trước luôn là ảnh phong bao; click mới mở modal QR; đóng modal phải trả focus và khóa/mở cuộn đúng |
| Auto-scroll không chạy hoặc khó dừng | Chưa kiểm tra trạng thái sau hiệu ứng mở và chưa mô phỏng wheel/touch | Sau click mở, xác nhận auto-scroll bật; thử wheel/touch, nút toggle và tốc độ chậm; kiểm tra `aria-pressed` |
| Thiếu tính năng của mẫu chuẩn | Chỉ review hero, bỏ qua calendar, album, gift, map, guestbook, footer | Dùng checklist đầy đủ của `docs/template-clone-quality.md`; mỗi mục ghi đã kiểm tra/không áp dụng/chưa kiểm tra |

## Cổng kiểm tra trước khi bắt đầu mẫu mới

1. Khảo sát mẫu nguồn trên desktop và mobile, ghi viewport, trạng thái tương tác, containing block và asset của từng phần.
2. Dựng cover và một detail section hoàn chỉnh trước. Không nhân bản hoa hoặc animation khi luồng mở thiệp, auto-scroll và ảnh upload chưa ổn.
3. Chốt bảng vùng an toàn: tên, ngày, lời mời, nút, mặt người trong ảnh và QR không được bị artwork che.
4. Chụp cùng một bộ trạng thái ở 1440, 768, 390 và 320px. Kiểm tra ảnh hỏng, tràn ngang, crop, z-index, chữ dài và section trống.
5. Click toàn bộ hành vi: mở cover, dừng auto-scroll, mở album, mở/đóng phong bao QR, focus, form validation và các nút điều hướng.
6. Chỉ báo hoàn thành sau khi review hình ảnh; lint/typecheck là điều kiện mã nguồn, không thay thế kiểm tra trực quan.

## Trạng thái hiện tại của mẫu này

- Khung ảnh mở đầu dùng `portrait-rose-frame-v4.webp`, ảnh nằm dưới hoa và artwork thu về scale native để ôm sát ảnh.
- Đã kiểm tra frame ở 1440, 768, 390 và 320px; không tràn ngang. Bằng chứng nằm trong cùng thư mục với tiền tố `portrait-frame-final-`.
- Các giới hạn còn lại của lần review (bản đồ local, form demo và dữ liệu mẫu) được ghi trong `visual-review.md`; không coi phần chưa kiểm tra là đã đạt.
