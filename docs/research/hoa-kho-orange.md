# Hoa Khô Cam — đối chiếu mẫu gốc

Khảo sát và dựng ngày 2026-09-03 theo `docs/template-clone-quality.md`.

- Nguồn: https://chungdoi.com/vi/mau-thiep/hoa-kho-cam/demo
- Slug nội bộ: `hoa-kho-orange`; route tiếng Việt: `hoa-kho-cam`.
- Local: http://localhost:3000/mau-thiep/hoa-kho-cam/demo
- Trạng thái: đã có renderer, manifest, assets, ba preview và demo trong DB local. Chưa deploy.
- Đối chiếu desktop 2560px (thiệp rộng 900px, lòng 898px), mobile 390px (lòng 375px khi có scrollbar), thêm fixture 320px. Preview chụp ở 480px.

## Asset và số đo

`hoa-kho-orange/assets.json` ghi URL nguồn, đường dẫn local, kích thước và alpha của ảnh; `reference-measurements.json` lưu hình học các khung và 16 lớp hoa. Thư mục cùng tên chứa ảnh đối chiếu từng phần.

Đã tải nền giấy, ba bó hoa, trái tim lịch, ba icon lịch trình, tám ảnh album, phong bao `hoa_kho_orange.webp`, font Carattere và Whisper. Phong bao là ảnh có alpha dùng hai lớp, không dùng phong bao đỏ procedural. Font và asset đều phục vụ từ project.

| Phần | Cấu trúc cần giữ |
| --- | --- |
| Nền | Giấy lặp 752×752, opacity .35, nền trắng; khung ngoài max 480px / 900px |
| Hero | Khung trong max 440px / 620px; padding trên 21.82%, dưới 20.68%; vòm rộng 71.59%, tỷ lệ 315/452 |
| Chữ hero | Save The Date ở 18.92%, tên đầu 38.72%, dấu & 54.42%, tên sau 72.68%; tọa độ tương đối với vòm |
| Hoa hero | Hai lớp sau, hai lớp trước; giữ đúng khung trong và từng góc xoay trong CSS module |
| Khung nội dung | Rộng 86%, max 366px / 560px, viền xanh 2px, padding 32px 20px, nền #fdf7ed |
| Lịch | Nền xanh, bo góc, max 280px / 360px; hàng ngày cao 30px / 34px; chiều cao theo số hàng |
| Sổ lưu bút | Nằm trong cùng khung với lịch trình; input nền trong suốt, viền xanh; lời chúc cuộn tối đa 500px |
| Footer | Nguồn chỉ có nền giấy, phong bao, lời cảm ơn và thương hiệu. Không có cảnh thành phố/sông như Mahal |

Không lấy chung một tỷ lệ hoa cho mọi phần: mỗi cụm có khung cha, breakpoint, góc xoay và lớp riêng. Không dịch toàn bộ text bằng transform để bù sai hình học.

## Kết quả kiểm tra

| Mục | Trạng thái / bằng chứng |
| --- | --- |
| Cover | Đã kiểm tra desktop, tên bằng font script, hai cụm hoa và seal xanh; bấm mở chuyển sang thiệp. `local-cover-desktop.png` |
| Hero | Đã so sánh desktop và mobile; chiều cao desktop 1018.53px trùng nguồn. `source-desktop-0.png`, `local-desktop-0.png`, `preview-hero.png` |
| Gia đình, tên, lễ | Đã kiểm tra tiêu đề, khung và hoa; FitText giữ tên dài trong khung. `source-desktop-1.png`, `local-desktop-1.png` |
| Tiệc và lịch | Đã kiểm tra; tháng 11/2026 có sáu hàng ở 320px, số 30 và dấu trái tim nằm trong nền lịch. `local-calendar-six-rows-320.png` |
| Album | Đã mở ảnh 1, chuyển ảnh 2 và đóng lightbox; ảnh gốc tải được. `local-desktop-2.png` |
| Địa điểm | Đã kiểm tra địa chỉ, query chỉ đường và URL thêm lịch. Map iframe bị Chrome chặn ở local; chưa xác nhận tile bản đồ |
| Dress code, lịch trình | Đã đối chiếu swatch, vị trí icon cạnh giờ, đường nối và hoa. `local-desktop-5.png`, `local-desktop-6.png` |
| Sổ lưu bút | Đã đối chiếu ô nhập, nút và danh sách; submit trống hiển thị “Vui lòng nhập tên của bạn.” Không gửi dữ liệu lên nguồn. `local-mobile-guestbook.png`, `reference-mobile-guestbook.png` |
| Quà và footer | Đã so đúng ảnh gốc, mở/đóng hộp QR; cuộn tới phần quà để ảnh lazy load trước khi chụp. `local-desktop-gift-footer.png`, `reference-desktop-gift-footer.png` |
| Nội dung biến đổi | Fixture tên dài, tháng sáu hàng, album/map/dress code rỗng tại 320px: không tràn ngang; tên đầy đủ vẫn vừa khung. Route QA tạm đã xóa |
| Tích hợp | Registrar đã chạy; sáu manifest tests đạt; chỉ seed demo mới bằng `--missing --only=hoa-kho-orange`, không thay demo khác. Chưa thử hành trình tạo/lưu thiệp trong editor qua tài khoản người dùng |
| Preview | Đã tạo listing, portrait, landscape từ phần hero local cuối. **Preview tạm chỉ có hero**, không phải full-page; chưa chụp full-page vì map đang bị chặn |
| Kiểm tra code | Lint các file mới/chỉnh liên quan đạt; `npm run typecheck` đạt; 6/6 manifest tests đạt. Full lint có lỗi tồn tại ở `chungdoi-tpl-shared.tsx:278` (setState trong effect), không do template mới |

## Những khác biệt có chủ đích và phần cần kiểm tra tiếp

- Dùng cover tương tác chung của app (tên khách, ngày, nút mở, hiệu ứng), phối màu/hoa/font theo nguồn; kích thước và nội dung cover không sao chép tuyệt đối.
- Giữ chức năng album, form, QR và RSVP của app. Nút AI tạo lời chúc của nguồn chưa được app hỗ trợ nên không dựng nút giả. Chưa kiểm chứng gửi lời chúc lên DB qua thiệp người dùng.
- RSVP dùng `PublicRsvpDialog`; trong capture/demo không có live binding thì không hiện. Vì vậy phần sau khung tiệc có thể ngắn hơn nguồn; cần kiểm tra thêm trên thiệp đã xuất bản có RSVP.
- Lời chúc mẫu do project cung cấp; không nhập lời chúc hay tài khoản ngân hàng thật từ nguồn. Thương hiệu footer dùng thiepmungonline.com. Nhạc theo mặc định của app.
- Giờ đón khách dùng `venue.welcomeTime`; khi dữ liệu DAL không giữ trường này, lấy giờ khai tiệc trừ một giờ (18:30 trước 19:30 trong demo). Lịch trình mẫu giữ các giờ như nguồn.
- Khi có môi trường Maps hợp lệ, chụp lại full-page theo `docs/template-preview-capture.md`, kiểm tra ảnh map và thay preview tạm. Không dùng API key của nguồn hoặc che bản đồ lỗi để tuyên bố đạt.

Ảnh chụp có thể khác vị trí cánh hoa động và thời gian đếm ngược. Đối chiếu theo từng section, không kết luận từ độ lệch tọa độ toàn trang do nội dung lời chúc/địa chỉ hoặc RSVP.
