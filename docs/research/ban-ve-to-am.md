# Vườn Kính Ngày Thương — Art Direction và Visual QA

## Mục tiêu

`ban-ve-to-am` giữ nguyên slug nội bộ và URL review, nhưng giao diện công khai được thiết kế lại hoàn toàn thành **Vườn Kính Ngày Thương**. Đây là mẫu original lấy cảm hứng từ ảnh cưới nhà kính sáng mà người dùng cung cấp trong hội thoại; không clone một website nguồn và không có URL tham chiếu bên ngoài.

Mẫu phải gợi cảm giác ngày cưới ngay từ bìa: ivory, vòm nhà kính trắng, cây xanh sage, hoa trắng, champagne gold và blush. Bìa dùng renderer 2D chung, không WebGL, không folio, không kéo xoay và không replay vật thể.

## TemplateArtDirection

- **Narrative:** hai người gặp nhau giữa một khu vườn ngập nắng và cùng bước qua mọi mùa yêu thương.
- **Cover object:** thẻ cưới 2D nền ivory đặc, khung vòm botanical, seal trái tim và hạt lá nhẹ.
- **Palette:** ivory `#FAF7F0`, deep garden green `#315445`, sage `#778B7C`, pale sage `#DFE8DF`, champagne gold `#C7A96B`, blush `#D8B5AA`.
- **Typography:** Cormorant Garamond cho tên/heading; Be Vietnam Pro cho nhãn và nội dung.
- **Motif vocabulary:** nhà kính trắng, vòm cao, vellum, lá sage, hoa ivory, đường botanical mảnh và ánh sáng trong trẻo.
- **Forbidden:** blueprint, lưới kỹ thuật, hồ sơ kiến trúc, folio 3D, compass/revision mark, chìa khóa ngôi nhà, copy về thi công/nền móng/bản vẽ.

## AssetBible

| Asset | Containing block và vai trò | Runtime |
| --- | --- | --- |
| `cover/garden-frame.svg` | Inset 2% trong shared cover 3:4.5; khung full-card. Trong hero nằm inset 2.3% của copy pane | SVG 1000×1500 |
| `ornaments/botanical-divider.svg` | Divider giữa section heading và nội dung, max-width 34rem | SVG 1200×180 |
| `gift/garden-envelope.svg` | Artwork riêng, max-width 30rem, nằm giữa intro và QR grid | SVG 1000×800 |
| `gallery/arch-sage/photo-1..8.webp` | Hero, section photo, full-bleed ceremony/footer và album; ảnh first-party có sẵn trong project | WebP |

Ba SVG là artwork first-party, text-free, không trace và không dùng nguồn web. Text động luôn là DOM.

## Storyboard

### Cover 2D

1. Nền xanh sage có hạt lá nhẹ.
2. Thẻ ivory nằm giữa viewport, khung nhà kính/botanical bao quanh tên, ngày cưới, lời mời và nút mở.
3. Seal trái tim dùng behavior chung; khi mở, cover bay ra rồi handoff trực tiếp sang hero DOM.
4. Không mount `Envelope3D`, không có drag/back-face/replay.

### Opened invitation

1. Hero split-card: copy ivory bên trái và ảnh nhà kính bên phải trên desktop; ảnh trên/copy dưới ở mobile.
2. Lời ngỏ + ảnh vòm, hai gia đình trong card arch mềm.
3. Ngày chung đôi trên nền ảnh nhà kính full-bleed với card kính mờ.
4. Countdown + calendar, album, lịch trình, địa điểm, dress code, sổ lưu bút, quà mừng.
5. Footer full-bleed ảnh cưới với lời cảm ơn và tên đôi uyên ương.

### Responsive và reduced motion

- Desktop target: 1440×900; body max-width 74rem.
- Mobile target: 390×844; kiểm tra thêm 320px nếu có dấu hiệu tràn.
- Hero mobile chuyển thành 54svh ảnh + copy; card nội dung xếp một cột.
- Shared cover và các transition hiện có phải tôn trọng `prefers-reduced-motion`; mẫu không thêm animation dài hoặc scroll-scrub.

## Capture map fallback

Route kết thúc bằng `/capture` dùng bản đồ botanical tĩnh thay vì iframe Google Maps vì API key local bị giới hạn origin. Runtime bình thường vẫn dùng `InvitationMap`; fallback chỉ tránh lỗi ngoại vi trong preview, không che lỗi nội dung.

## Visual acceptance record

| Hạng mục | Trạng thái | Bằng chứng / ghi chú |
| --- | --- | --- |
| Cover 2D và mở thiệp | Chưa kiểm tra | Phải xác nhận `[data-envelope-renderer="2d"]`, không WebGL/replay |
| Hero desktop/mobile | Chưa kiểm tra | Đối chiếu split-card, crop ảnh, safe zone tên và botanical frame |
| Section spacing/decoration | Chưa kiểm tra | Kiểm tra toàn trang ở cùng viewport/zoom |
| Calendar sáu hàng | Chưa kiểm tra | Demo 27/12/2026; xác nhận không tràn card |
| Album/lightbox | Chưa kiểm tra | Kiểm tra mở/đóng và ảnh không hỏng |
| Map/directions | Chưa kiểm tra | Capture dùng fallback; runtime dùng iframe/link thật |
| Dress code/wish form | Chưa kiểm tra | Kiểm tra style, focus và validation local |
| Gift envelope/QR | Chưa kiểm tra | Xác nhận đúng artwork, không fallback phong bao đỏ |
| Footer | Chưa kiểm tra | Kiểm tra crop ảnh và khoảng trống cuối trang |
| Catalog/editor/custom data | Chưa kiểm tra | Sau `templates:register` và build |
| Preview cuối | Chưa kiểm tra | Sinh lại PNG/listing/portrait/landscape và thumbnails |
| Overflow 1440/390/320 | Chưa kiểm tra | Ghi kết quả ở lượt visual QA |

Không đánh dấu đạt bằng lint/typecheck. Task visual QA phải cập nhật bảng này bằng viewport, trạng thái và đường dẫn ảnh thực tế trước khi báo hoàn tất.
