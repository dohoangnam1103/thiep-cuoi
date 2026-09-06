# Hỷ Ước — bộ asset v1
Ngày: 05/09/2026. Trạng thái: asset đã tạo; chưa tích hợp renderer, chưa nghiệm thu giao diện/chuyển động thực tế.

## Quyết định đã được người dùng duyệt
- Bìa đỏ LIỀN MẶT, không đường cắt giữa. Cả bìa trượt lên để lộ trang kem.
- Tên chú rể / & / tên cô dâu là ba dòng riêng, căn giữa; hai tên cùng cỡ chữ.
- Mặc định thấy MẶT TRƯỚC phong bao. QR chỉ hiện sau thao tác mở.
- Một ảnh đôi ở đầu, ảnh thứ hai chuyển xuống album.
- Palette: đỏ son #990F16, ivory #F8F0DF, vàng #B58A4B, mực nâu #34251F.

## File và nguồn
Runtime: `public/chungdoi/images/themes/hy-uoc/` — 6 WebP + 11 SVG.
Master PNG: `docs/research/hy-uoc-assets/` — 6 file gốc để chỉnh tiếp.
Prompt ban đầu và đường dẫn nguồn: [hy-uoc-asset-generation.json](hy-uoc-asset-generation.json).
Raster được tạo bằng built-in image_gen; SVG hình học được viết riêng, không phụ thuộc font hay ảnh ngoài.
WebP quality 88, alphaQuality 100; không đổi bố cục bằng xử lý ảnh. Bản PNG gốc giữ nguyên.
Lần chỉnh cuối: hoa góc bỏ mảng kem; phong bao chuyển thành mặt chữ nhật phủ kín canvas, bỏ nền ngoài. Mặt trước/sau KHÔNG có alpha và không cần alpha khi hiển thị như túi chữ nhật.
Các file lỗi nền giả caro không được đưa vào bộ giao.

## Bảng sử dụng
Kích thước dưới đây là canvas, KHÔNG phải kích thước hiển thị CSS. Mọi artwork trang trí dùng alt rỗng và pointer-events none khi tích hợp.

| Asset | Canvas | Dùng ở đâu / làm gì | Cách đặt |
|---|---|---|---|
| paper-red.webp | 1254×1254 | Nền bìa; có thể lặp lại ở đoạn thông tin tiệc | Background cover trong khung section; không có đường cắt. Có thể phủ lớp đỏ #990F16 mỏng nếu cần giảm độ sáng khi đối chiếu. Không mặc định repeat vì chưa kiểm tra seamless. |
| paper-ivory.webp | 1254×1254 | Nền toàn bộ phần trong, gia đình, lịch, album, địa điểm, sổ lưu bút, quà, footer | Background theo từng section để tránh kéo giãn texture theo cả trang. Nội dung dài tự tăng chiều cao. |
| peony-corner-gold.webp | 1254×1254, alpha | Hoa góc bìa trên trái / dưới phải; góc phần mừng cưới và footer | Parent là khung bìa/section, không phải viewport. Dưới phải xoay 180°. Mobile bắt đầu ở 120–155px rộng, opacity khoảng .35–.55 trên đỏ; phải đối chiếu vì nét asset dày hơn concept. Không phủ tên. |
| peony-sprig-gold.webp | 1254×1254, alpha | Góc dưới phải khung ảnh đầu; một điểm nhấn album | Parent là wrapper ảnh. Mobile rộng khoảng 78–100px, right -10px, bottom -8px. Giữ khoảng đệm ngoài wrapper. Asset này có cánh ivory, chủ ý dùng trên nền ivory; không dùng thay hoa nét bìa đỏ. |
| envelope-front.webp | 971×1619 | Mặt trước cả hai phong bao, trạng thái mặc định; lớp túi che phần thẻ chưa rút ra | Wrapper aspect-ratio 971/1619, object-fit contain. Không mirror cả ảnh vì sẽ đảo hoa/viền; dùng cùng một ảnh cho hai tài khoản. Chữ Hỷ và nhãn tên là lớp riêng. |
| envelope-back.webp | 971×1619 | Mặt sau có nắp đóng, dự phòng nếu sau này cần trạng thái lật | Cùng wrapper với mặt trước. Không tải eager và không hiện mặc định. Là ảnh nguyên mặt sau, không thể tự xoay riêng nắp trong ảnh này. |
| double-happiness-cream.svg | 200×184 | Chữ Hỷ bìa đỏ | SVG path độc lập font; mobile rộng khoảng 112–135px. |
| double-happiness-red.svg | 200×184 | Chữ Hỷ đầu thiệp / lịch / cuối thiệp | 24–38px tùy ngữ cảnh; không thay bằng emoji. |
| double-happiness-gold.svg | 200×184 | Chữ Hỷ trên mặt trước hai phong bao | Parent là wrapper phong bao; center x 50%, top 16%, rộng khoảng 36% wrapper. |
| cover-border.svg | 390×780 | Viền bìa đỏ liền mặt | Đặt theo khung bìa. Đây là tỷ lệ tham chiếu 1:2; khi chiều cao thay đổi, dựng lại cùng path bo góc hoặc dùng border responsive, không kéo méo góc quá mức. |
| nameplate-ivory.svg | 320×88 | Nhãn khách bìa, nhãn tên trên phong bao | Text HTML phủ lên vùng giữa x 10–90%, y 22–78%. Trên phong bao: center x 50%, top 77%, width 66%. Tên dài phải giảm cỡ / tăng chiều cao nhãn hợp lý. |
| date-band-red.svg | 640×140 | Dải ngày dưới ảnh đầu; có thể dùng cho tiêu đề tiệc | Chỉ là nền, ngày/thứ là text thật ở giữa; không nhúng ngày vào ảnh. |
| divider-gold.svg | 360×28 | Ngăn mục gia đình, lời chúc, cảm ơn | Giữ tỷ lệ, width tối đa khoảng 280px mobile. Dùng tiết chế. |
| photo-arch-frame.svg | 300×330 | Viền đôi ảnh đầu | Wrapper tỷ lệ 300/330; ảnh crop bên trong cùng hình vòm bằng CSS; viền SVG overlay. Không phải ảnh có lỗ cắt để tự che mọi ảnh chữ nhật. |
| qr-card-ivory.svg | 300×420 | Tờ thẻ được rút ra khỏi phong bao | Tên ngân hàng, chủ TK, QR và nút là HTML/ảnh QR thật phủ trên. QR trắng riêng và giữ quiet zone; không ép QR vào nền hoa. |
| envelope-liner.svg | 300×500 | Lớp lòng túi phía sau thẻ khi rút lên | Layer z0, scale theo wrapper mặt trước; nằm sau QR card. |
| envelope-flap.svg | 300×145 | Nắp riêng dự phòng cho bản mở phía sau nếu về sau cần | Parent phải là wrapper túi, transform-origin top center. Không ghép chồng lên envelope-back nguyên ảnh; mặc định hiện mặt trước nên chưa cần dùng. |

## Xếp lớp và chuyển động dự kiến
### Bìa
Nền đỏ → hoa góc → viền → chữ Hỷ → cụm tên 3 dòng → ngày → nhãn khách → nút mở.
Tất cả nằm trong MỘT lớp cover. Khi chạm: cover translateY(-100%) trong khoảng 650–800ms, phần trong hiện nhẹ. Không tách tên, không cắt bìa giữa, không tự cuộn.
Đây là mô tả thiết kế; chưa có animation chạy để xác nhận.

### Mừng cưới
Mỗi tài khoản là một nút mở riêng, chỉ artwork/text phía trong nút mới pointer-events none.
Lớp lòng túi z0 → thẻ QR z1 → mặt trước túi z2 → chữ Hỷ và nhãn tên z3.
Khi mở, thẻ di chuyển lên sau túi trong vùng được chừa khoảng trống. Trên mobile, QR đọc thực tế cần hộp xem đủ rộng (khoảng 280–320px); không bắt khách quét QR bé trong phong bao 140px.
Không bắt buộc lật sang mặt sau. Bản mặt sau và nắp riêng chỉ là dự phòng, tránh kéo dài hiệu ứng.
prefers-reduced-motion: mở trực tiếp hộp QR, bỏ động tác trượt.

## Bao phủ các phần còn lại
- Gia đình / lịch / thông tin tiệc: paper-ivory, date-band, divider, chữ Hỷ; chữ và ô lịch dựng bằng HTML/CSS.
- Album: ảnh đôi từ dữ liệu invitation, không tạo ảnh cưới giả thành dữ liệu thật.
- Lịch trình / bản đồ / trang phục: dùng nền chung, divider và icon hiện có; không cần ảnh screenshot bản đồ.
- Sổ lưu bút: nền ivory, nhãn và đường kẻ CSS; giữ form thật.
- Footer: hoa góc, divider, chữ Hỷ đỏ, tên 3 dòng.
- Nút, trạng thái focus, validation, tên, ngày, địa chỉ, lời chúc: text/catalog và code; không đốt vào raster.
- QR: tạo từ dữ liệu tài khoản thật qua pipeline hiện có; không có QR giả trong bộ asset.
- Không tạo nhạc mới hoặc ảnh cô dâu chú rể mới trong phạm vi này.

## Kiểm tra và giới hạn
- Đã mở xem raster; nền bìa không có đường chia; phong bao mặt trước không có nắp/seam.
- Hoa có alpha thật, kiểm tra bằng metadata/stats. Sprig có phần cánh ivory, không phải outline thuần.
- Mặt phong bao full-bleed cùng kích thước; không còn nền ngoài/caro trong bản chọn.
- SVG không text/font/network; kiểm tra decode bằng sharp.
- Có bản master và WebP; inventory ghi kích thước/dung lượng thật.
- Nét hoa và vân giấy chưa giống tuyệt đối concept: phải đối chiếu khi ghép ở cỡ mobile, điều chỉnh opacity/scale phù hợp.
- Chưa tích hợp app, chưa kiểm tra mobile/desktop/animation/QR trong renderer. Không gọi đây là thiệp hoàn chỉnh.
