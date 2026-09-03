# Quy trình clone thiệp và nghiệm thu giao diện

Áp dụng khi clone mẫu mới hoặc sửa độ giống mẫu gốc. Đọc trước khi thực hiện.
Mục tiêu là chủ động phát hiện sai lệch trước khi giao, không để người dùng phải chỉ từng lỗi.

## 1. Khảo sát đầy đủ trước khi code

- Mở thiệp và xem từ đầu đến cuối trên desktop và mobile. Kiểm tra cả phong bì đóng, thiệp đã mở và các hộp thoại.
- Lập danh sách các phần thực sự có trên mẫu: cover, tên rút gọn, cảnh đầu trang, gia đình, tên đầy đủ, ngày lễ, album, tiệc, đếm ngược, lịch, địa điểm, dress code, lịch trình, sổ lưu bút, quà mừng, footer.
- Lưu ảnh tham chiếu từng phần ở kích thước đủ đọc. Không chỉ chụp hero hoặc một ảnh toàn trang bị thu nhỏ.
- Ghi URL tham chiếu, ngày khảo sát, viewport và trạng thái trong `docs/research/<template-slug>.md`. Nếu tham chiếu thay đổi giữa các lần xem, ghi rõ phiên bản đang đối chiếu.
- Kiểm kê ảnh từ cả `img`, CSS background và các trạng thái chỉ hiện sau tương tác. Ghi URL nguồn, đường dẫn local, kích thước, tỷ lệ, độ trong suốt và vai trò của asset. Đặc biệt kiểm tra phong bao và cảnh cuối trang.
- Tải asset cần thiết về project; không sao chép API key hoặc cấu hình dịch vụ của website nguồn.

## 2. Đo bố cục, không ước lượng từ ảnh

Với mỗi cụm trang trí và cụm chữ, ghi các thông tin sau trước khi dựng:

| Thành phần | Thông tin cần đo |
| --- | --- |
| Khung chứa | Phần tử cha định vị, chiều rộng thực tế, `max-width`, padding, tỷ lệ và breakpoint |
| Ảnh nền/họa tiết | Offset, margin, width/height, `object-fit` hoặc background sizing, transform, thứ tự lớp, vùng bị cắt |
| Chữ | Font thực tế sau khi tải, cỡ chữ, line-height, weight, chiều rộng, khoảng cách với họa tiết |
| Mục nội dung | Khoảng cách đầu/cuối, vị trí tiêu đề, nền riêng hay nền của khung tổ tiên |

Lưu ý các lỗi đã gặp ở Mahal Vàng:

- **Hoa và chuông:** đặt trong khung 900px thay vì khung trong 680px khiến ảnh bị phóng lớn và cắt mất. Cùng một phần trăm không có nghĩa là cùng vị trí khi khung chứa khác nhau.
- **Tên trong vòm:** `top: 40%` khác `43.9%`; line-height và margin của dấu `&` cũng làm lệch cả cụm. Đo cả cụm, không chỉ một dòng tên.
- **Tiêu đề đè họa tiết:** thiếu margin âm của ảnh trang trí làm nét hoa văn nằm dưới chữ. Kiểm tra vùng có nét ảnh thực tế, không chỉ bounding box trong suốt.
- **Lịch:** khung quá thấp kết hợp ô ngày vuông khiến tháng có sáu hàng tràn vào viền. Đo khoảng đệm trên/dưới và chiều cao hàng; tránh tổ hợp class mâu thuẫn như `h-auto`/`h-full`, `object-contain`/`object-fill` trong helper ảnh.
- **Footer:** nền mờ và cảnh thành phố bên sông là hai lớp khác nhau. Cần đủ khoảng trống cuối trang để cảnh hiện đúng, kể cả ảnh absolute vượt ra ngoài footer.

## 3. Dựng giao diện riêng, tái sử dụng chức năng

- Giữ dữ liệu tên, ngày, gia đình, album, địa điểm, lời chúc và tài khoản quà mừng có thể chỉnh sửa. Copy giao diện đi qua catalog i18n; không hardcode vào renderer.
- Tái sử dụng xử lý album, QR, RSVP và gửi lời chúc, nhưng đối chiếu style trước khi dùng component mặc định.
- Đăng ký đúng asset phong bao trong bộ ánh xạ gift visual; kiểm tra không rơi vào hình phong bao đỏ tạo bằng CSS khi nguồn có ảnh riêng. Chọn biến thể chuyển động phù hợp với mẫu.
- Form sổ lưu bút phải khớp nền ô nhập, viền, font, chiều cao, khoảng cách, nút gửi, chiều rộng danh sách, nền và bo góc của từng lời chúc.
- Dùng prop/variant hoặc CSS có phạm vi riêng cho mẫu; không sửa style chung gây thay đổi các mẫu khác. Giữ label, validation, focus, trạng thái pending và binding gửi dữ liệu.
- Không dựng nút trông có chức năng nhưng không hoạt động. Nếu nguồn có chức năng chưa được app hỗ trợ, ghi rõ chênh lệch thay vì giả lập thành công.
- Đăng ký manifest/renderer/catalog theo pipeline hiện có; không sửa tay registry được sinh tự động. Chỉ seed demo đang làm, không ghi đè demo khác.
- Khi đưa mẫu mới lên production, phải tạo demo row trên **DB production**, không chỉ deploy renderer/assets hoặc seed local. Dùng `scripts/seed-demos.ts --missing --only=<slug>` qua runtime Prisma phù hợp sau khi backup; không chạy seed toàn bộ. Kiểm tra `Invitation.isDemo=true`, content và quan hệ của mẫu, rồi xác nhận mẫu có trong `/admin/demos`. Trang public có fallback nội dung tĩnh nên HTTP 200 của public **không chứng minh** admin đã có mẫu.

## 4. Đối chiếu trực quan trong khi làm

Hoàn thiện và đối chiếu từng phần, sau đó rà toàn bộ một lần nữa:

1. Dùng cùng kích thước viewport và mức zoom cho nguồn/local. Kiểm tra chiều rộng thiệp thực tế, tránh nhầm do thanh cuộn hoặc tỷ lệ ảnh chụp.
2. Đợi font và ảnh tải xong; dừng auto-scroll bằng điều khiển sẵn có. So sánh cùng trạng thái mở/đóng và thời điểm chuyển động tương đương.
3. Chụp từng phần, đặt cạnh nhau; dùng ảnh chồng hoặc diff khi cần xác định độ lệch. Phân biệt khác biệt dữ liệu với lỗi bố cục; không coi diff pixel do animation là lỗi tự động.
4. Kiểm tra cả tọa độ theo trang và tọa độ theo viewport khi crop ảnh. Xác nhận ảnh chụp thực sự chứa phần định kiểm tra.
5. Sửa và chụp lại phần lỗi cùng các phần liền kề bị ảnh hưởng. Không suy ra phần còn lại đúng chỉ vì hero đã khớp.

Tối thiểu kiểm tra một desktop và mobile 390px; thêm 320px khi có rủi ro tràn. Thử nội dung có tên/địa chỉ dài, lịch sáu hàng (ví dụ tháng 11/2026), nhiều lời chúc và phần tùy chọn trống. Nội dung dài phải vẫn đọc được, không chạm viền hoặc che thao tác.

## 5. Checklist trước khi báo hoàn thành

Ghi kết quả từng mục trong research note, kèm đường dẫn ảnh hoặc bằng chứng đo. Dùng trạng thái **đã kiểm tra / không áp dụng / chưa kiểm tra** và lý do; không ghi đạt cho phần chưa xem.

- [ ] Cover và hiệu ứng mở; tất cả ảnh tải thành công.
- [ ] Hero: vị trí hoa, chuông, khung vòm, tên, cảnh nhiều lớp trên desktop/mobile.
- [ ] Các tiêu đề và nội dung không đè lên họa tiết; khoảng cách giữa các mục đúng.
- [ ] Lịch: tháng, thứ, đủ sáu hàng ngày, ngày nổi bật và khoảng đệm đều nằm trong viền.
- [ ] Album mở/đóng, chuyển ảnh; địa điểm và liên kết lịch/chỉ đường đúng.
- [ ] Sổ lưu bút đúng style; kiểm tra validation. Chỉ thử gửi trên môi trường local/test phù hợp, không gửi lời chúc thử lên website nguồn.
- [ ] Phong bao đúng asset, đúng lớp/animation; mở và đóng hộp QR hoạt động.
- [ ] Footer đủ nền mờ, cảnh chính, lời cảm ơn và khoảng trống; không bị cắt mất cảnh sông.
- [ ] Mẫu xuất hiện trong catalog/demo/editor, dữ liệu tùy chỉnh được hiển thị đúng.
- [ ] Ảnh preview phản ánh bản cuối; không chứa lỗi bản đồ, ảnh hỏng hoặc công cụ debug.
- [ ] Chạy lint rồi typecheck và kiểm tra chức năng liên quan theo hướng dẫn project. Phân biệt lỗi có sẵn với lỗi mới; không dùng kết quả lint/typecheck thay cho nghiệm thu hình ảnh.

Nếu bản đồ hoặc phần khác bị chặn ở local, tiếp tục hoàn thành các phần có thể kiểm tra và nêu rõ giới hạn. Không che lỗi để tạo ảnh nghiệm thu, không dùng key của nguồn để vượt hạn chế. Preview tạm chỉ chụp hero phải được ghi rõ, không gọi là preview toàn trang đã hoàn tất.

Chỉ báo clone hoàn thành khi đã đối chiếu toàn bộ các phần có trong mẫu. Nếu còn chênh lệch hoặc chưa kiểm chứng, báo đúng phần đã làm và phần còn lại. Mục đích của checklist là kiểm chứng công việc, không tạo thêm bước xin phép cho việc đã được người dùng giao.
