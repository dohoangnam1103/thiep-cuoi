# Hoa Mai Thủy Mặc — review trực quan 2026-09-09

**Kết luận: chưa đạt thiết kế.** Bản production giữ được chủ đề giấy kem/hoa vàng, nhưng đánh mất bố cục, tỷ lệ, cảnh thủy mặc và cảm giác thiệp thủ công của tám concept. Cần dựng lại phần trình bày; vài thay đổi màu hoặc spacing riêng lẻ không đủ.

Đợt này là review và lưu bằng chứng. Chưa chỉnh renderer/CSS/artwork hoặc triển khai bản giao diện mới. Mức 92% trong design spec là mục tiêu, không phải kết quả đã được chứng minh.

## Nguồn và cách kiểm tra

- Production: https://thiepmungonline.com/mau-thiep/hoa-mai-thuy-mac/demo
- Tám ảnh concept 1672×941 được liệt kê trong `design-spec.md`; đã mở và xem cả tám ảnh.
- Chụp Chromium ở viewport **1440×900** và **390×844**, device scale 1, zoom mặc định, reduced motion, sau khi font tải.
- Bìa, màn hình đầu sau mở, bản đồ và QR được chụp từ route demo thông thường. Dừng tự cuộn bằng nút có sẵn.
- Ảnh toàn section và lightbox được chụp từ route `/demo/capture` để bỏ lớp chuyển động/CTA của khung demo và đo bố cục ổn định. Nội dung và CSS section vẫn là của production. Không chỉnh CSS hay text trong DOM để làm đẹp ảnh.
- Bản đồ được chụp lại trên demo thông thường sau khi tải iframe. QR được chụp lại sau khi cả hai ảnh tải đủ. Các ảnh trống ở lượt chụp sớm đã được thay; không kết luận chúng là lỗi tải production.
- Concept và web khác viewport, dữ liệu và số lễ; đối chiếu bố cục/tỷ lệ/phong cách theo section, không gọi đây là pixel diff hay suy ra phần trăm giống.

## Những phần cần làm lại, theo ưu tiên

### 1. Bìa không giữ cấu trúc phong thư của concept

Concept là một phong thư giấy mép xơ nằm ngang, có chiều dày, dây buộc, dấu sáp terracotta và hoa/cảnh bao quanh ngoài phong thư. Production là khung bo góc trên nền beige trơn, có nút tim vàng phía trên và một dấu sáp mờ nằm dưới chữ ngày tháng. Trên mobile, phần lớn cành hoa của bìa bị cắt khỏi khung. Chữ tên nhỏ; font sans của lời mời và nút không hòa với phần tên.

- Bằng chứng: `review-1440-before-cover.png`, `review-390-before-cover.png`.
- Điểm sửa: `src/data/templates/hoa-mai-thuy-mac.manifest.ts:112` chọn seal tim, `:117` dùng artwork opacity 35%; bìa dùng bố cục tên/ngày/khách chung trong `src/components/chungdoi-demo.tsx:980`.
- Đích sửa: bìa riêng đúng hình học phong thư; dấu sáp gắn vào dây ở mép nắp, vùng tên sạch, hoa bám vào nền ngoài phong thư. Giữ dữ liệu khách và hành vi mở thiệp hiện có.

### 2. Gia đình và nghi lễ bị chia thành chuỗi hộp dài

Concept là bố cục báo hỷ liền mạch với hoa và núi hai bên. Production chia nhà gái, tên đôi, mỗi nghi lễ và nhà trai thành năm hộp có vòm, nền trắng, viền và bóng. Chữ “Ông Bà” đạt 52px trên desktop trong khi tên cha mẹ nhỏ hơn nhiều; tên đôi cũng chỉ 52px, nên thứ bậc thông tin bị đảo.

Khối hiện cao **2.730px desktop / 2.024px mobile**. Hai nghi lễ cần thêm chỗ so với concept một lễ, nhưng không cần năm card và khoảng rỗng lặp lại như hiện tại.

- Bằng chứng: `review-{1440,390}-before-families-section.png`.
- Điểm sửa: `src/components/chungdoi-hoa-mai-thuy-mac.module.css:176` và renderer `:249`.
- Đích sửa: bỏ vòm/viền/bóng của các khối thông tin; dùng divider mảnh, tên đôi làm trọng tâm, cha mẹ đọc được; giữ đầy đủ hai lễ trong một section.

### 3. Lịch, lịch trình, dress code phình thành ba màn hình

Concept gom ngày cưới lớn, lịch nhỏ, timeline và dress code thành một composition. Production có ba card riêng; chỉ calendar đã rất cao vì ô ngày có `aspect-ratio: 1` trong một khung rộng. Ngày cưới lớn của concept biến mất, thay bằng tiêu đề trang trí “Hẹn nhau ngày hoa nở”. Hoa canopy chạy sau tiêu đề; chấm vàng đổ bóng thay cho vòng đánh dấu ngày màu terracotta.

Khối cao **2.290px desktop / 1.753px mobile**. Trên desktop 900px cao, riêng khối này chiếm khoảng 2,5 màn hình.

- Bằng chứng: `review-{1440,390}-before-date-section.png`.
- Điểm sửa: CSS `:351–480`; renderer `:379–451`.
- Đích sửa: lịch 340–380px trên desktop, hàng ngày khoảng 28–34px, timeline khoảng 34–40px mỗi dòng; bỏ card riêng và dùng nhịp dọc cô đọng. Giữ tháng sáu hàng và đủ lịch trình.

### 4. Artwork không tạo được không gian thủy mặc của concept

Concept có núi đá nhiều lớp, làng/đình bên sông, cầu và thuyền, nét loang hòa vào giấy. Asset hiện tại là đồi cây và dải hồ ngang thấp; kéo to hoặc giảm opacity không tạo ra các cảnh đang thiếu. Phần gia đình và lịch không có cảnh núi/sông tương ứng; footer chỉ có canopy hoa.

Canopy giống nhau bị phóng lớn và lặp ở đầu thiệp, lịch và footer. Texture giấy hiện dày, vàng và có dấu lặp dễ nhận hơn nền nhẹ của concept. CSS áp tile trực tiếp với kích thước 1024px, khác hướng dẫn tile 768px có lớp opacity trong design spec.

- Bằng chứng: `review-1440-before-{hero,story-section,date-section,map-section,footer-section}.png`.
- Đích sửa: tạo lại tranh cảnh đúng bố cục và chất liệu; cành hoa hiện có có thể tái dùng có chọn lọc sau khi đổi tỷ lệ/vị trí. Không cần vứt toàn bộ bộ hoa.
- Lưu ý: viền màu lạ nhìn thấy khi mở ảnh alpha trên nền đen phần lớn nằm ở pixel gần như trong suốt. Không coi đó là lỗi hiển thị trên web khi screenshot không chứng minh.

### 5. Mobile có hoa đi vào vùng chữ và ảnh bị crop sai

Ở 390px, hoa giao với tiêu đề “Hai nhà se duyên”, cụm chữ nhà trai và tiêu đề “Từ hôm ấy, mùa xuân ở lại”. Nền card bán trong suốt khiến họa tiết vẫn cạnh tranh với chữ. Đây là lỗi vùng an toàn, dù trang không tràn ngang.

Ảnh dọc đầu album đang được dùng lại cho hero, story và khung album ngang. `object-fit: cover` cắt sát/mất phần đầu cô dâu trong hero và album; story dùng khung vòm dọc hoàn toàn khác ảnh ngang viền màu nước của concept. Khác người trong ảnh là khác dữ liệu; crop mất chủ thể và đổi hình khung là lỗi trình bày.

- Bằng chứng: `review-390-before-{hero,families-section,story-section,gallery-section}.png`.
- Đích sửa: đặt containing block/vùng an toàn riêng từng breakpoint; cành hoa nằm ngoài chữ; điều chỉnh khung và vị trí ảnh để giữ khuôn mặt. Tiêu đề nhiều dòng cần line-height tối thiểu khoảng 1–1,1 thay vì 0,86 hiện tại.

### 6. Form, quà mừng và footer mất cùng một phong cách

Concept dùng dải giấy mép thô cho lời chúc, nhãn form rõ, nút terracotta; production dùng card bo góc, câu trích dẫn lớn, form/nút nhỏ màu vàng nâu. Modal QR là panel phẳng với header sans đậm, khác dải giấy giữa cảnh sông của concept. Phong bao đóng có asset riêng và tải đúng; không có lỗi rơi về phong bao generic.

Gift và footer hiện tách thành **1.645px desktop / 1.553px mobile**; footer lặp canopy và thiếu cảnh sông/cầu kết thúc. Cần một cảnh kết trang liên tục và style riêng cho form/modal, giữ cơ chế mở QR sau click.

- Bằng chứng: `review-{1440,390}-before-{wishes-section,gift-section,gift-modal,footer-section}.png`.
- Điểm sửa: CSS `:537–715`, renderer `:490–607` và props/variant của shared form/gift.

## Số đo production

| Phần | Desktop 1440px | Mobile 390px |
| --- | ---: | ---: |
| Hero | 1.387px | 822px |
| Gia đình và nghi lễ | 2.730px | 2.024px |
| Chuyện đôi mình | 1.615px | 1.159px |
| Album | 1.116px | 689px |
| Lịch, lịch trình, dress code | 2.290px | 1.753px |
| Địa điểm | 1.301px | 1.069px |
| RSVP demo | 748px | 629px |
| Lời chúc | 1.159px | 932px |
| Quà mừng | 925px | 833px |
| Footer | 720px | 720px |
| Toàn trang capture | 13.991px | 10.631px |

Số đo làm tròn từ bounding box. Chi tiết font, tọa độ, chiều rộng và opacity từng artwork: `review-before-metrics.json`.

## Bằng chứng đối chiếu theo section

Ảnh concept giữ nguyên ở đường dẫn trong `design-spec.md`; screenshot có tiền tố `review-1440-before-` hoặc `review-390-before-`:

| Concept | Screenshot tương ứng |
| --- | --- |
| 1 — Bìa | `cover.png`, `hero.png` |
| 2 — Gia đình, lễ cưới | `families-section.png` |
| 3 — Chuyện đôi mình | `story-section.png` |
| 4 — Album | `gallery-section.png`, `lightbox.png` |
| 5 — Ngày cưới | `date-section.png` |
| 6 — Địa điểm | `map-section.png` |
| 7 — Lời chúc | `wishes-section.png` |
| 8 — Quà/QR/footer | `gift-section.png`, `gift-modal.png`, `footer-section.png` |
| Chưa có concept RSVP riêng | `rsvp-section.png` |

## Kiểm tra đã thực hiện và giới hạn

| Hạng mục | Trạng thái |
| --- | --- |
| Xem cả tám concept desktop | Đã kiểm tra |
| Chụp/xem tất cả section 1440 và 390 | Đã kiểm tra; thiết kế chưa đạt |
| Mở thiệp, dừng tự cuộn | Đã kiểm tra |
| Không tràn ngang tại hai viewport | Đã kiểm tra; không đồng nghĩa không chồng artwork |
| Album mở/đóng | Đã kiểm tra |
| Gift mở/đóng, cả hai QR tải đủ | Đã kiểm tra; `review-delayed-media.json` |
| Bản đồ sau khi tải trên demo thường | Đã kiểm tra và chụp lại, không trống |
| Hai nghi lễ và lịch tháng 11/2026 sáu hàng | Đã nhìn thấy trên desktop/mobile |
| Form demo | Đã kiểm tra hình thức; preview bị vô hiệu hóa theo thiết kế app |
| Gửi RSVP/lời chúc, guest media, thanh toán, quét QR | Chưa kiểm tra trong review này; không gửi dữ liệu thử lên production |
| Âm thanh thực nghe, toàn bộ keyboard/zoom album | Chưa kiểm tra đầy đủ |
| 320px, 768px và stress nội dung dài | Chưa chạy lại trong review này |
| Lint/typecheck/unit/build | Không chạy: đợt này chỉ tạo bằng chứng review, không thay mã ứng dụng |
| Mobile/RSVP reference riêng và nghiệm thu cũ | Không tìm thấy trong thư mục nghiên cứu mẫu |

## Nguyên nhân quy trình và tiêu chí sửa

Implementation đã dịch concept thành các section/card thông dụng thay vì dựng theo bố cục của từng ảnh. Tests hiện tại kiểm tra sự có mặt của helper, metadata asset, đủ lễ và không tràn; không kiểm tra hình thức phong thư, chiều cao section, vùng hoa sạch quanh chữ hoặc vị trí khuôn mặt. Vì vậy test chức năng có thể đạt trong khi thiết kế vẫn lệch xa.

Lần sửa cần đi theo bốn nhóm: **bìa và cảnh nền → gia đình/ngày cưới phẳng, cô đọng → ảnh và mobile → form/quà/footer**. Giữ một cột, dữ liệu chỉnh được và các tương tác chung. Mỗi nhóm phải có ảnh concept đặt cạnh screenshot đúng section trước khi chuyển tiếp. Không đổi concept để hợp thức hóa bản dựng, không tuyên bố phần trăm giống khi chưa có phương pháp/bằng chứng.
