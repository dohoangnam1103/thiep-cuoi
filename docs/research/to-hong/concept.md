# Tơ Hồng — Se duyên thành đôi

Ngày nghiên cứu: 06/09/2026. Phạm vi: phân tích số liệu trong ảnh admin được cung cấp, đối chiếu cấu hình/manifest hiện có và nguồn thiết kế công khai; đề xuất chủ đề mới. Chưa triển khai template, chưa kiểm tra demo trực tiếp trên desktop/mobile, chưa đo hiệu quả animation.

## 1. Dữ liệu sử dụng

Ảnh chụp có tiêu đề 66 demo nhưng chỉ thấy 11 dòng. Số dưới đây là snapshot trong ảnh, không phải truy vấn production hiện tại.

| Mẫu | Đã dùng |
|---|---:|
| Song Hỷ Đỏ | 72 |
| Song Hỷ Xanh | 50 |
| Romantic Đỏ | 43 |
| Song Phụng Đỏ | 26 |
| Long Phụng Đỏ | 24 |
| Én Đỏ | 19 |
| Song Long Đỏ | 18 |
| Thanh Diệp Xanh | 17 |
| Vườn Xuân Xanh | 10 |
| Cổ Truyền Đỏ | 7 |
| Chibi Đỏ Trung Hoa | 5 |

Tổng 11 dòng: 291. Nhóm tên có Đỏ: 214 (73,5%). Ba mẫu đầu: 165 (56,7%). Hai Song Hỷ: 122 (41,9%). Không lấy 291 làm tổng toàn bộ 66 demo.

`src/app/admin/demos/page.tsx` đếm invitation có `isDemo: false`, nhóm theo templateId, không lọc published/paid hoặc ngày tạo. UI trong ảnh cũng giải thích gồm nháp, xuất bản và thanh toán. Vì vậy đây là số thiệp hiện đang dùng mẫu; không đồng nghĩa doanh số, người dùng duy nhất hoặc xu hướng tăng gần đây. Thứ tự hiển thị có thể chỉnh tay. Chưa có mẫu số lượt xem, tuổi mẫu hoặc thông tin vị trí trưng bày để kết luận mẫu nào có tỷ lệ chuyển đổi tốt nhất.

## 2. Tín hiệu thiết kế

Đối chiếu `src/data/chungdoi-theme-config.ts`:

- Song Hỷ Đỏ: đỏ rượu, chữ kem, biểu tượng Hỷ làm điểm nhấn, font tên viết tay.
- Song Hỷ Xanh: cùng ngôn ngữ Hỷ nhưng xanh rừng; gợi ý bản sắc và bố cục cũng đáng thử nghiệm, không chỉ màu đỏ.
- Romantic Đỏ (`minimalism-dark-red`): nền đỏ sâu, giấy kem, hoa, vàng nhạt, typography mềm.
- Song Phụng Đỏ: giấy kem trên nền đỏ, artwork phượng đối xứng.

Suy luận định hướng: đỏ/kem, nghi lễ dễ nhận diện và tên cặp đôi nổi bật là nền tảng phù hợp để thử mẫu mới. Chưa có dữ liệu chứng minh animation là nguyên nhân các mẫu này được chọn nhiều.

Nguồn ngoài chỉ dùng tham khảo thiết kế, không dùng làm bằng chứng xếp hạng bán chạy:

- [ChungDoi Double Happiness Red](https://chungdoi.com/templates/double-happiness-red): mô tả chữ Hỷ làm điểm nhấn, ảnh vòm, phong bì mở và đủ các phần RSVP/album/bản đồ/QR. Chỉ đối chiếu mô tả công khai; không xác nhận slug này tương đương hoàn toàn bản local.
- [Greenvelope Double Happiness Branches](https://www.greenvelope.com/designs/invitations/double-happiness-branches/red/wedding/1040): tham khảo phối chủ đề Hỷ với nhánh hoa; trang không công bố lượt dùng.
- [Greenvelope Double Happiness Medallion](https://www.greenvelope.com/designs/invitations/wedding/double-happiness-medallion): tham khảo điểm nhấn huy hiệu trang trọng; không có số liệu doanh số đã xác minh.

## 3. Chọn chủ đề

**Tơ Hồng — Se duyên thành đôi.** Một sợi tơ đỏ dẫn khách qua thiệp giấy cắt nhiều lớp, từ nút thắt mở thiệp đến lời chúc cuối.

Các hướng đã cân nhắc:

| Hướng | Điểm hấp dẫn | Quyết định |
|---|---|---|
| Tơ Hồng, giấy nhiều lớp | Sợi chỉ nối câu chuyện và tương tác; có thể nhận diện ở thumbnail | Chọn phát triển |
| Sơn son thếp vàng | Trang trọng, hợp nhóm đỏ | Repo đã có Sơn Mài Vàng Son và Hỷ Ước; dễ gần các mẫu hiện hữu |
| Vườn đêm xanh ngọc | Có căn cứ từ Song Hỷ Xanh; hợp ảnh thiên nhiên | Giữ làm hướng thử nghiệm sau, khi có thêm dữ liệu chuyển đổi |

Repo hiện có Hỷ Ước (đỏ/ngà, Hỷ, mẫu đơn vàng, bìa trượt), Uyên Ương (hồ sen, đôi chim, nét khắc), Sơn Mài (đen/vàng, sơn mài), Rạp Hỷ Sài Gòn (sân khấu, rèm/đèn). Tơ Hồng khác ở cấu trúc giấy có chiều sâu và sợi chỉ thực sự nối các phần nội dung. Đây là khác biệt theo manifest đã đọc, không phải tuyên bố độc quyền trên thị trường.

## 4. Mỹ thuật

- Bìa đỏ rượu #780F23; giấy ngà #F7EFDF; chỉ đỏ son #B52632; vàng lì #B99A62 dùng rất ít.
- Khung ảnh oval với 4–5 lớp giấy cắt. Hoa giấy đồng màu ngà, bóng đổ mềm; giảm chi tiết ở những nơi đặt chữ.
- Ảnh cặp đôi là trung tâm. Tên viết tay lớn, còn lịch/địa chỉ/nút dùng font dễ đọc hỗ trợ dấu tiếng Việt.
- Nội dung dài chuyển sang nền ngà để dễ đọc; đỏ dùng cho mốc và hành động chính.
- Thumbnail tập trung ba yếu tố: nút chỉ đỏ, lớp giấy nổi và ảnh đôi; phải thử ở kích thước danh sách thực tế.
- `concept.png` là hình concept tĩnh được tạo bằng imagegen tích hợp, ảnh đôi là ảnh minh họa sinh bởi AI. Hình mô tả mỹ thuật bìa; không coi là thiết kế hoàn chỉnh hay bằng chứng animation hoạt động. Bản triển khai cần tách chữ, ảnh, lớp giấy và chỉ; không dùng nguyên hình làm giao diện.

## 5. Kịch bản chuyển động đề xuất

| Phần | Chuyển động | Nhịp dự kiến |
|---|---|---|
| Bìa chờ mở | Đầu chỉ khẽ chuyển động, nút mở có phản hồi nhẹ | Chu kỳ chậm, biên độ nhỏ |
| Mở thiệp | Chạm nút hoặc nút thắt; dây tháo vòng, hai lớp giấy tách ra, ảnh hiện ở giữa | Khoảng 1,6–2 giây; có bỏ qua |
| Hero | Các lớp giấy mở lệch nhịp; tên và ngày xuất hiện sau ảnh | Lệch nhau 80–120 ms; chạy một lần |
| Lời ngỏ / hai gia đình | Hai đầu chỉ đi từ hai phía, gặp tại một nút; thông tin hiện theo nhóm | 400–600 ms khi vào khung nhìn |
| Chuyện tình | Đường tơ được vẽ tiếp khi cuộn qua 3–4 mốc; ảnh mở bằng mặt nạ mềm | Theo tiến độ cuộn, không khóa cuộn |
| Album | Từng ảnh hiện sau mép giấy; vuốt xem, chạm mở ảnh lớn | 250–450 ms; không xoay ảnh liên tục |
| Lịch cưới | Sợi chỉ vẽ vòng quanh đúng ngày, kết thành một nút nhỏ | 600–800 ms, một lần |
| Địa điểm | Thẻ giấy mở nhẹ khi người xem mở thông tin; đường đi minh họa ngắn | Không trì hoãn nút bản đồ |
| RSVP | Sau khi gửi thành công, đầu chỉ khép thành một nút và hiện xác nhận | 400–600 ms; không xác nhận trước khi máy chủ thành công |
| Mừng cưới | Chạm phong bao: mở nắp, thẻ QR trượt lên; QR dừng hoàn toàn | 500–700 ms |
| Lời chúc / kết | Lời chúc mới hiện nhẹ sau khi lưu; sợi tơ kết thúc ở nút đôi | Chạy một lần |

Ba khoảnh khắc chính: mở thiệp, sợi tơ nối câu chuyện, phong bao mở QR. Các phần còn lại làm nhịp phụ, tránh để mọi thứ chuyển động cùng lúc. Không cần pháo hoa, chữ Hỷ rơi toàn màn hình hay zoom liên tục.

## 6. Nguyên tắc triển khai sau khi chọn concept

- Thiết kế mobile trước; không bắt kéo chính xác nút thắt, luôn có nút chạm tương đương.
- Giữ ngày, địa chỉ, RSVP truy cập nhanh; mở thiệp không chặn đọc kéo dài.
- Không ép bật nhạc; âm thanh do khách chủ động chọn.
- Có chế độ giảm chuyển động; không chạy vòng lặp ngoài viewport. Animation hỗ trợ đọc nội dung và không quyết định nội dung có truy cập được hay không.
- Dùng artwork giấy tách lớp, SVG riêng cho sợi chỉ và chữ HTML để sửa tên/ngày trong editor. Đánh giá thư viện animation đang có trước khi thêm dependency.
- Cần thử tên dài, không có ảnh, nhiều sự kiện, màn hình hẹp, trình duyệt trong Zalo và máy Android phổ thông. Đây là các kiểm tra dự kiến, chưa thực hiện.

## 7. Cách kiểm chứng sức hút

So sánh với Song Hỷ Đỏ ở vị trí hiển thị tương đương và cùng khoảng thời gian. Theo dõi lượt xem thumbnail → mở demo → tạo thiệp → xuất bản → thanh toán, cùng tỷ lệ bỏ ở màn mở. Báo cáo tỷ lệ theo lượt xem đủ điều kiện, tách khách quay lại khi có thể. Chưa đặt ngưỡng thắng hoặc cỡ mẫu trước khi biết lưu lượng và tỷ lệ nền.

Đề xuất làm một bản đỏ/ngà trước. Nếu có tín hiệu tích cực mới thử biến thể xanh ngọc; dữ liệu hiện có chưa đủ để cam kết mẫu mới sẽ bán chạy.
