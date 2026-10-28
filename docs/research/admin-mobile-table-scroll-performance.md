# Nghiên cứu cuộn ngang bảng admin trên mobile

Ngày: 2026-10-21. Phạm vi: đọc mã nguồn và đo thao tác cuộn; chưa thay đổi implementation.

Người dùng đã xác nhận: Chrome, vuốt trực tiếp lên bảng, xảy ra trên cả Android
và iOS. Chưa có tên bảng cụ thể hoặc trace trên thiết bị gặp lỗi.

## Kết luận

Điểm cần kiểm tra đầu tiên là `AdminTableScroller`, dùng chung bởi các bảng danh
sách trong admin. Component có hai vùng cuộn độc lập: bảng và thanh cuộn phụ ghim
dưới màn hình. Khi kéo thanh phụ, bảng được di chuyển bằng JavaScript trong
`onBarScroll`, qua phép gán `viewport.scrollLeft = bar.scrollLeft`. Chiều còn lại
cũng có listener đồng bộ.

Đây là một phụ thuộc vào main thread có thể làm bảng theo tay chậm khi main
thread bận. Cuộn trực tiếp lên bảng cho trình duyệt xử lý chuyển động của chính
bảng. Tài liệu [RenderingNG của Chrome](https://developer.chrome.com/docs/chromium/renderingng-architecture)
mô tả JavaScript chạy trên main thread, còn compositor có thể xử lý scrolling độc lập.

**Chưa tái hiện được tình trạng giật mạnh mà người dùng báo.** Không đủ bằng chứng
để kết luận có vòng lặp ghi ngược vị trí hoặc lỗi momentum trên thiết bị thực.
Không được coi việc bỏ thanh phụ là bản sửa đã được chứng minh.

Với thao tác người dùng đã xác nhận, lập luận "bảng chỉ di chuyển sau khi handler
của thanh phụ chạy" không áp dụng: chính bảng đang nhận native scrolling. Vấn đề
cần kiểm tra là công việc phụ trong handler của bảng và chi phí rendering chung.
Không được kết luận lỗi nắm thanh nhỏ hoặc lỗi riêng Safari từ báo cáo hiện tại.

## Bằng chứng từ mã nguồn

- `src/components/admin-table-scroller.tsx:77–84`: đồng bộ từ bảng sang thanh phụ;
  listener scroll của bảng đã dùng `passive: true`.
- `src/components/admin-table-scroller.tsx:99–105`: đồng bộ từ thanh phụ sang bảng
  bằng `scrollLeft`. Có epsilon 0.5px để tránh ghi lại khi hai vị trí gần bằng nhau,
  nhưng không có cơ chế xác định vùng nào đang được người dùng điều khiển.
- `src/components/admin-table-scroller.tsx:124–138`: thanh phụ hiện cả trên mobile,
  cao 16px, ghim đáy, có backdrop blur. Vùng chạm thấp là vấn đề thao tác cần
  kiểm tra riêng bằng ngón tay; synthetic swipe ngang không xác minh điều này.
- `src/app/globals.css:495–502`: thanh cuộn gốc bị ẩn khi bật thanh phụ.
- `src/app/globals.css:541`: cột ghim chỉ bật từ 48rem. Ở viewport 390px, cột ghim
  không phải yếu tố gây chi phí cuộn.
- `readEdges` có so sánh hai giá trị trước khi thay đổi state. Không có cơ sở nói
  rằng cả bảng React bị render lại ở mọi frame chỉ vì có lệnh `setEdges`.
  Tuy nhiên phép đọc kích thước, tạo object và gọi setter vẫn chạy mỗi sự kiện.
  Hai data attribute này chỉ được CSS của bảng sử dụng trong media query từ
  48rem trở lên (`globals.css:575–594`), nên việc tính chúng dưới ngưỡng đó là dư.
- Admin vẫn render 12 cánh hoa chuyển động. Backdrop blur và cánh hoa là yếu tố
  phụ cần A/B trên thiết bị thực; chưa đo được phần tác động riêng của chúng.
- Riêng bảng demo: nút sắp xếp trong `DemoOrderManager.tsx:208–214` dùng
  `touch-none`. Vuốt bắt đầu trên nút này dành cho sắp xếp, khác với cuộn bảng.

## Phép đo local

Môi trường: Next dev tại cổng 3210, Chromium 149 headless qua Playwright/CDP,
viewport 390 × 844, DPR 3, mobile + touch. Dùng dữ liệu local hiện có, chỉ đọc.
Không phải phép đo Android hoặc iPhone thật, cũng không phải production build.

Trang: `/admin/invitations?perPage=100` và `perPage=200`.
Khung bảng rộng 356px; nội dung lần lượt rộng 962px và 999px.
Bảng 200 dòng có khoảng 3.510 DOM elements toàn trang.

Thao tác: CDP `Input.synthesizeScrollGesture`, touch, dịch ngang 260px,
tốc độ 700px/s, cho phép fling; đo cả trên bảng và thanh phụ. Thử CPU mặc định
và slowdown 6 lần. Chờ trang ổn định trước khi đo.

| Quan sát | Kết quả |
| --- | --- |
| Một swipe, cơ chế hiện tại | Khoảng 85–89 lệnh ghi đồng bộ, 170–178 sự kiện scroll của hai vùng |
| A/B chặn lệnh ghi đồng bộ khi vuốt trực tiếp bảng, CPU ×6 | 87 sự kiện scroll; lệnh setter bị chặn trước khi ghi DOM |
| Ghi ngược vào vùng đang thao tác | Không ghi nhận trong các mẫu |
| Vị trí bảng lùi lại giữa các mẫu rAF | Không ghi nhận |
| Khoảng cách rAF lớn nhất, CPU mặc định | Khoảng 9–10ms |
| Khoảng cách rAF lớn nhất, CPU ×6 | Khoảng 9–18ms |

Trace CDP CPU ×6 có 176 sự kiện scroll ở mẫu đồng bộ so với 87 ở mẫu chặn ghi.
Trong các trace đã xem, không có sự kiện `Layout` hay `Paint` trên renderer main
thread; không phát hiện tác vụ main thread trên 50ms. Không diễn giải điều này
thành không có raster/GPU work. `ScrollJankV4` không đánh dấu janky ở 95 mẫu của
mỗi trace đã xem. rAF cũng không đại diện đầy đủ cho frame thực sự được hiển thị.

A/B chặn ghi ngược vào vùng đang thao tác không tạo cải thiện rõ ràng vì ở
baseline không quan sát được các lệnh ghi ngược này. Giả thuyết "hai thanh kéo
giành quyền rồi liên tục kéo bảng ngược lại" chưa được chứng minh.

Thử khởi chạy Playwright WebKit thất bại trong môi trường hiện tại; không có
kết quả Safari/iOS. Các script chẩn đoán và trace nằm tại
`/tmp/admin-scroll-audit/`, không thêm screenshot/dữ liệu khách hàng vào repo.

## Kiểm tra tiếp theo sau khi xác nhận vuốt trực tiếp

Dùng `Input.dispatchTouchEvent` tạo touchStart/touchMove/touchEnd thay cho chỉ
synthesizeScrollGesture. Mỗi lượt gồm 4 lần kéo đổi chiều, 12 touchMove/lần,
dịch 17px/bước, có lệch dọc ±5px; giữ CPU slowdown ×6. Bảng 100 dòng.

So sánh luân phiên 3 lượt cho mỗi điều kiện:

| Điều kiện | Sự kiện scroll / 4 lần kéo | rAF gap lớn nhất ở các lượt lặp |
| --- | --- | --- |
| Hiện tại | 266–270 | Khoảng 9.4ms |
| Chặn ghi đồng bộ sang thanh phụ | 132–134 | Khoảng 9.3–9.4ms |
| Dừng animation cánh hoa và bỏ backdrop filter của thanh phụ | 268–272 | Khoảng 9.4ms |

Không ghi nhận lệnh đồng bộ ngược vào bảng trong các lượt này. ScrollY không
thay đổi khi kéo có lệch dọc nhẹ. Lượt thử đầu có khoảng rAF gap 16ms ở baseline,
nhưng khác biệt này không lặp lại; không dùng nó để tuyên bố tăng FPS.

Kết quả xác nhận công việc dư do đồng bộ thanh phụ, nhưng **chưa chứng minh công
việc này hoặc hai hiệu ứng trên gây ra mức lag thực tế người dùng gặp**. Chưa
đo được riêng lợi ích của việc bỏ readEdges trên mobile. Không sửa ứng dụng dựa
trên giả định rằng nguyên nhân đã được xác định.

## Bước tiếp theo để chốt nguyên nhân

1. Đã biết Chrome trên cả Android/iOS và vuốt trực tiếp bảng. Cần tên bảng,
   số dòng đang hiển thị và trace trên thiết bị/bản production gặp lỗi.
2. A/B mobile bỏ thanh phụ cùng listener đồng bộ, dùng cuộn trực tiếp của bảng;
   giữ thanh phụ cho desktop. Đây là thử nghiệm ưu tiên, chưa phải bản sửa đã xác nhận.
3. Nếu phải giữ thanh phụ trên mobile, kiểm tra vùng chạm và chuyển động chéo;
   xác định vùng cuộn chủ động để tránh ghi ngược trong lúc touch/momentum.
   Không mặc định thêm requestAnimationFrame: nó có thể thêm độ trễ một frame.
4. A/B tắt blur và cánh hoa để tách chi phí compositing. Chỉ xem xét virtualize
   nếu phép đo thiết bị thực cho thấy số dòng là yếu tố chi phối.

Không chạy lint/build vì chưa sửa mã ứng dụng. Kiểm chứng ở đây là thao tác trình
duyệt và trace; lint/build không xác minh được độ mượt cuộn.
