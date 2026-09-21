# Site 2 Home — review và hướng thiết kế đề xuất

Ngày review: 2026-09-17. Trạng thái: đề xuất, chưa triển khai.

## Phạm vi bằng chứng

- Mở trực tiếp Home site 1, Home site 2 và cả V1–V12 trên trình duyệt.
- Quan sát các trạng thái cuộn đại diện trên desktop; V9–V12 được xem thêm ở viewport mobile 390 × 844.
- Đọc cấu trúc nội dung live và một số mã nguồn lab để đối chiếu ý tưởng với implementation.
- Đây là review định hướng, không phải kiểm thử toàn bộ tương tác, hiệu năng hoặc nghiệm thu từng section. Chưa kiểm tra mobile V1–V8, thiết bị thật hoặc toàn bộ trạng thái animation.
- Không sửa mã ứng dụng và không triển khai lên production trong đợt review này.

## Hiện trạng

Site 1: https://thiepmungonline.com/

Nội dung chính: giới thiệu, mẫu thiệp, ba bước tạo thiệp, hướng dẫn, hỗ trợ, nhận xét cặp đôi, quản lý khách mời/RSVP, FAQ, liên kết bảng giá và tài nguyên.

Site 2: https://thiep.hoangnam.cloud/

Home hiện tại mang thương hiệu Thiệp Signature, có phong bì tương tác, nhập tên/ngày cưới xem trước, gallery, ba bước, khối tính năng và CTA cuối. Chưa có các khối hỗ trợ, nhận xét, FAQ tương đương Home site 1. Phong bì lớn nhưng hình ảnh sản phẩm xuất hiện muộn; màn đầu có nhiều khoảng trống.

## Đánh giá 12 ý tưởng

| Bản | Giá trị nên giữ | Điểm cần cân nhắc |
| --- | --- | --- |
| [V1](https://thiepmungonline.com/home-2/lab/v1) | Mở phong bì giúp người xem hiểu sản phẩm bằng chuyển động | Đoạn diễn trước nội dung dài; nên rút thành một khoảnh khắc |
| [V2](https://thiepmungonline.com/home-2/lab/v2) | Một tấm thiệp xuyên qua các tính năng tạo tính liên tục | Cần chất liệu và hình ảnh cưới để có bản sắc |
| [V3](https://thiepmungonline.com/home-2/lab/v3) | Album ngang có cá tính | Không phù hợp làm cơ chế cuộn cho toàn bộ Home; chỉ dùng cho một gallery ngắn |
| [V4](https://thiepmungonline.com/home-2/lab/v4) | Tơ hồng làm đường dẫn nhẹ và hợp chủ đề | Không đủ làm điểm nhấn chính |
| [V5](https://thiepmungonline.com/home-2/lab/v5) | Hai người tiến về nhau có câu chuyện dễ hiểu | Nhân vật hoạt hình hiện tại thiên về dễ thương hơn cao cấp |
| [V6](https://thiepmungonline.com/home-2/lab/v6) | Kết hợp nhân vật, sợi chỉ, thiệp, phong bì | Nhiều cơ chế cạnh tranh sự chú ý |
| [V7](https://thiepmungonline.com/home-2/lab/v7) | Có nội dung thật và mạch cưới đầy đủ | Đoạn hành trình trước catalog dài, cần biên tập mạnh |
| [V8](https://thiepmungonline.com/home-2/lab/v8) | Chuyển sáng–tối gắn với lịch trình ngày cưới | Có thể khiến Home giống một thiệp cụ thể; trạng thái desktop đã xem có vùng trống lớn |
| [V9](https://thiepmungonline.com/home-2/lab/v9) | Mạch chọn mẫu → cá nhân hoá → kỷ niệm → RSVP → gửi rõ nhất | Ngôn ngữ hộ chiếu, trạm dừng khá đậm, dễ nghiêng sang du lịch |
| [V10](https://thiepmungonline.com/home-2/lab/v10) | Chọn mẫu, nhập tên, hành trình người nhận làm sản phẩm dễ hiểu | Hiệu ứng kính và nhiều panel lớn kéo dài trang |
| [V11](https://thiepmungonline.com/home-2/lab/v11) | Ảnh, typography, chất giấy và bố cục có cảm giác cao cấp; hero mobile tốt | Cần rút nhịp, bảo đảm chữ xuất hiện chắc chắn khi cuộn nhanh |
| [V12](https://thiepmungonline.com/home-2/lab/v12) | Kho mẫu thật tạo thành hình Song Hỷ, gallery giàu chiều sâu, dễ nhớ | Thiếu phần lớn nội dung bán hàng; thumbnail đè lên chữ ở trạng thái đã xem, CTA hero chưa rõ |

## Hướng đề xuất

Ưu tiên: phong cách hình ảnh V11 + một điểm nhấn kho mẫu V12 + cách giải thích sản phẩm của V9/V10. V4 chỉ là nét nối phụ; V1 là tương tác phong bì ngắn. Không ghép nguyên các trang với nhau.

Hai hướng khác có thể chọn:

1. Lấy triển lãm V12 làm toàn bộ ngôn ngữ: nhận diện mạnh, sản phẩm là nhân vật chính; cần thiết kế lại nhiều để nội dung và CTA dễ đọc.
2. Lấy hành trình V9 làm trục chính: giải thích dễ hiểu, chuyển động thống nhất; ít cảm giác thời trang/cao cấp hơn hướng V11.

## Mạch Home dự kiến

1. Hero: thông điệp rõ về thiệp cưới online; ảnh cưới, giấy, một thiệp thật; CTA tạo thiệp và xem mẫu xuất hiện ngay. Thiệp mở/rút nhẹ và các lớp chuyển động theo cuộn.
2. Bộ sưu tập: nhiều mẫu tụ thành hình Song Hỷ rồi mở ra thành các mẫu có thể chọn. Cảnh ngắn; tiêu đề có vùng riêng, không đặt thumbnail chạy xuyên chữ. Số lượng lấy từ catalog site 2.
3. Cá nhân hoá: nhập tên/ngày cưới, thiệp cập nhật ngay; chọn một vài phong cách đại diện. Nếu chưa chuyển dữ liệu sang editor thì không hứa lưu hoặc điền sẵn.
4. Ba bước tạo thiệp: một thiệp chuyển trạng thái chọn mẫu → điền thông tin → gửi link. Hướng dẫn hoặc video theo nội dung thực tế của site 2.
5. Trải nghiệm khách mời: tin nhắn → mở thiệp → xem lịch trình/bản đồ → xác nhận tham dự; điện thoại demo và nội dung ngắn đồng bộ.
6. Quản lý RSVP: minh hoạ khách xác nhận và danh sách cập nhật; đánh dấu dữ liệu demo rõ ràng.
7. Hỗ trợ và lời nhận xét: giữ vai trò nội dung tương tự site 1, dùng thông tin có thể xác minh và phù hợp site 2.
8. FAQ, liên kết bảng giá và CTA cuối: đóng câu chuyện bằng lời mời đã sẵn sàng gửi.

Màu dự kiến: giấy ngà, hồng phấn tiết chế, đỏ rượu làm điểm nhấn. Chữ serif giàu cảm xúc đi cùng sans dễ đọc. Ưu tiên ảnh và thiệp thật, bố cục có khoảng thở nhưng không tạo vùng cuộn rỗng.

## Chuyển động và tiêu chí nghiệm thu đề xuất

- Một cảnh chính tại mỗi thời điểm; khoảng 2–3 cao trào trên toàn trang, các đoạn khác chuyển động nhẹ.
- Desktop có thể pin ngắn và dùng parallax; mobile có bố cục và nhịp riêng, giảm số thiệp và tránh pin dài.
- CTA và thông điệp đầu trang không phụ thuộc việc xem xong animation.
- Nội dung hiển thị khi JS/animation chưa sẵn sàng; hỗ trợ reduced-motion, bàn phím, focus và cảm ứng.
- Kiểm tra viewport 390, 768, 1440; cuộn chậm/nhanh/ngược, resize, back navigation; không chữ bị che hoặc vùng nội dung biến mất.
- Đo hiệu năng trên bản triển khai trước khi kết luận mượt; chưa có số đo trong review này.
- So sánh nội dung với Home site 1 bằng checklist nhưng chỉ quảng bá các khả năng thực có của site 2. Không sao chép các con số hay cam kết trong lab mà chưa xác minh.

## Ranh giới bảo vệ site 1

- Home site 2 nằm ở `apps/site-2/src/app/(marketing)/page.tsx`; component ở `apps/site-2/src/components/marketing/home/`; CSS và catalog tiếng Việt của site 2 cũng nằm trong app riêng.
- Chỉ thay đổi Home/component/CSS/copy/assets riêng của site 2 cùng test và tài liệu trong phạm vi site 2.
- Không sửa `src/`, `messages/`, `public/` ở root, package dùng chung hoặc cấu hình triển khai site 1 để phục vụ Home này.
- Source lab ở site 1 chỉ dùng để tham khảo; không kéo dependency ngược từ app site 2 vào source root.
- Có thay đổi Home site 2 chưa commit từ trước phiên review; cần giữ lại baseline trước khi triển khai.
- Repo có boundary test, nhưng test xét cả untracked files. Hiện `.dsh/` và `master-public/` đã tồn tại ngoài phạm vi; cần phân biệt baseline với thay đổi mới, không xoá hoặc đổi allowlist chỉ để làm test xanh.
- Kiểm tra lint/typecheck app site 2, test Home và cô lập đường dẫn, build app site 2, rồi visual QA. Đọc tài liệu deploy site 2 trước bước triển khai; không chạy pipeline deploy site 1.
