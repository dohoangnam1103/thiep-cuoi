# Hồng Vân — phối màu và hoa hồng trong detail

Ngày: 2026-09-06. Route local: http://localhost:3000/mau-thiep/hong-van-hoa-hong/demo

## Phạm vi
- Nền detail đỏ rượu vang liên tục, chuyển sắc nhẹ ở đầu trang cùng họ màu với bìa.
- Chữ kem, nhấn champagne; card trong suốt nhẹ để không tạo mảng nền kem bị chia cắt.
- Chín cụm hoa trong normal flow tại tiêu đề các phần và footer. Artwork tái sử dụng: brocade-flower-red/hoa-hong.webp (450px), hiển thị tối đa 80px ở cụm tiêu đề.
- Khoảng đệm hero mobile 170px bên dưới nội dung giúp hoa góc dưới không chạm lời mời.
- Phong bao xếp dọc; vẫn che QR cho đến khi bấm.

## Bằng chứng
- Desktop 1440×900, mobile 390×900 và 320×900: không tràn ngang; kiểm tra hero, album/timeline, phong bao đóng/mở qua ảnh PNG cùng thư mục.
- Kiểm tra thêm countdown, map heading/address, lời chúc và footer ở 1440 và 320px.
- 320-hero.png là bản sau sửa khoảng đệm mobile; lời mời không còn nằm trên hoa.
- Auto-scroll chuyển sang aria-pressed=true sau mở; đã dừng bằng nút trước khi chụp.
- GiftFlipCard data-flipped chuyển false → true sau click ở cả ba viewport. Ảnh mặt trước che QR, mặt sau hiển thị QR và tài khoản.
- Lint: 0 errors, 32 warnings. Typecheck: exit 0.

## Giới hạn kiểm tra
- Không gửi RSVP/lời chúc thật trong lần sửa giao diện. RSVP inline không xuất hiện ở demo này (provider không live).
- Ảnh bản đồ nhúng chưa tải trong ảnh chụp; chỉ kiểm tra bố cục địa chỉ/nút chỉ đường, không đánh dấu map tiles đã đạt.
- Không kiểm thử lại đầy đủ editor, lịch sáu hàng, nội dung dài và các template khác; các prop mới là opt-in, mặc định giữ nguyên.
- Tên ảnh calendar/album trong lần chụp đầu dựa trên chỉ số heading: *-calendar.png thể hiện album; *-album.png thể hiện lịch trình. Các ảnh countdown/map/ending đặt tên đúng nội dung.

## Bổ sung nền nhiều hoa hồng
- Hai lớp background repeat-y chạy toàn chiều cao column, lệch nhịp trái/phải; tự theo chiều dài nội dung. Asset giữ tỷ lệ tự nhiên và không blur. Chỉ CSS module Hồng Vân được thay đổi.
- Desktop: chiều rộng mỗi dải tối đa 200px, opacity 0.7. Mobile: rộng 26%, opacity 0.45. Lớp tối giữa và card đỏ gần đặc giúp nội dung đọc được trên ảnh nền.
- Ảnh nghiệm thu: *-rose-bg-hero/calendar/album/gift.png ở 1440, 390, 320px. Đã xem desktop album, mobile hero và gift; chữ và QR cover rõ, background nằm sau nội dung, không tràn ngang ở cả ba viewport.
- Chiều rộng column giữ 900px ở desktop, 390/320px ở mobile. Lint 0 errors/32 warnings; typecheck exit 0.

## Thay dải lặp bằng bó hoa — bản hiện tại
- Thay thế hoàn toàn nền repeat-y và cụm ba bông giống nhau ở detail. Dùng một artwork bó hoa nhiều lớp, có hoa nở, nụ và lá, nền alpha; các cụm gắn với tiêu đề từng phần, đổi bên/kích thước và có cụm kết trang ở giữa. Không còn tile hoa chạy đều hai bên.
- Asset mới: public/chungdoi/images/themes/hong-van-rose/rose-bouquet.webp, 1000×1000, alpha, 312850 bytes. Tạo bằng ImageGen ngày 2026-09-06; bản gốc: /Users/namdo/.codex/generated_images/01a07512-fef0-7a12-be78-71c79b9f7bea/exec-534cb4d6-68fd-44cc-b93d-554062913242.png. Chỉ chuyển định dạng/thu nhỏ bằng sharp.
- Chế độ bouquet là opt-in trong ArtInvitationConfig; các mẫu khác vẫn giữ SectionFlowers cũ. Bìa không đổi. Detail vẫn một cột tối đa 900px, nền đỏ liên tục và lề kem ngoài desktop.
- Ảnh *-bouquet-hero/calendar/album/gift.png chụp ở 1440×900, 390×900, 320×900. Đã xem desktop hero/album, mobile calendar/hero/gift. Không tràn ngang cả ba viewport. Hoa không che nội dung trong các trạng thái đã xem; mobile đặt hoa trong khoảng riêng trước tiêu đề. Tắt góc xoay hoa đầu hero để lá không vượt cạnh trên.
- Lint: 0 errors, 32 warnings có sẵn. Typecheck: pass. Các giới hạn kiểm tra editor, nội dung dài, RSVP và bản đồ ở trên vẫn áp dụng.
- Kiểm tra tương tác bản bouquet: auto-scroll bật sau mở (aria-pressed=true); phong bao data-flipped=false → true khi click, screenshot 390-bouquet-gift-open.png. Không gửi dữ liệu ra ngoài.

## Bố trí bó hoa đa dạng theo tham chiếu lâu đài tình yêu
- Bổ sung hai artwork alpha mới: `rose-bouquet-round.webp` (bó tròn dày) và `rose-bouquet-cascade.webp` (cành rủ chéo). Section bouquet luân phiên ba dáng, không còn 3 ảnh giống nhau cùng lúc.
- Trên desktop, vùng bó hoa mở rộng sát hai biên của cột 900px và đặt lệch trái/phải; trung tâm tiêu đề giữ nền đỏ sạch. Mobile thu về 180px trong vùng riêng để không che chữ.
- Ảnh kiểm tra: `1440-bouquet-borders.png`. Typecheck pass; không tràn ngang.
- Hero mở rộng theo yêu cầu “bọc quanh thiệp”: 6 vị trí bó hoa ở hai biên desktop, ba vị trí thoáng hơn trên mobile; dùng asset luân phiên và giữ vùng chữ trung tâm trống. Ảnh kiểm tra: `1440-bouquet-wrap.png`, `390-bouquet-wrap.png`; không tràn ngang.

## Phong bao mừng cưới — bản hiện tại
- Đã thay thẻ lật QR riêng của Hồng Vân bằng luồng dùng chung `GiftEnvelope`: mặt trước là một ảnh phong bao duy nhất, bấm vào mở modal QR. Template slug `hong-van-rose` dùng artwork phong bao đỏ hoa văn có sẵn.
- Modal có nút đóng, khóa cuộn nền, hiển thị toàn bộ tài khoản/QR và nút lưu QR. Đã kiểm tra desktop 1440px và mobile 390px: `1440-gift-modal.png`, `390-gift-modal.png`; `data-gift-visual-kind=layered-image`, modal và QR đều xuất hiện sau click.
- Bổ sung mật độ hoa: desktop mỗi section detail có cặp bụi hoa hai bên, đẩy sát biên bằng pseudo-artwork + artwork luân phiên; vùng giữa được dịch vào trong để không chạm tiêu đề. Mobile vẫn dùng một cụm/section để giữ khoảng thở. Ảnh kiểm tra `1440-bouquet-density.png`, không tràn ngang.
- Phân bố lại theo review: mật độ cao tập trung ở hero/banner (8 cụm desktop, 3 cụm mobile ở hai biên); detail chỉ giữ hoa ở lời mời, countdown, album và footer, ẩn khỏi timeline/map/dresscode/guestbook. Mobile không tràn ngang.
- Bổ sung một cụm hồng dày ở giữa mép trên hero desktop và tăng cụm cuối footer lên 360px (250px mobile). Hero mobile ẩn cụm giữa để không chồng nút thao tác cố định; vẫn giữ các cụm góc. Kiểm tra `1440-banner-end-clusters.png`, `390-banner-end-clusters.png`, không tràn ngang.

## Cụm hoa footer dạng tròn — bản hiện tại
- Footer chuyển sang `rose-bouquet-round.webp`, chỉ hiển thị biến thể tròn thay cho cành cascade chéo; bỏ góc xoay để tâm cụm cân với khối chữ.
- Kích thước desktop 320px trong vùng cao 320px; mobile 230px trong vùng cao 230px. Bó hoa nằm giữa, hiện đủ hình và không đè lên lời cảm ơn/tên đôi.
- Ảnh kiểm tra: `/tmp/hong-van-desktop-footer-final.png`, `/tmp/hong-van-mobile-footer-final.png`. Đã kiểm tra biến thể hiển thị và bounding box ở 1440px/390px; không tràn ngang.

## Nhật ký lỗi để tái sử dụng

Các lỗi đã gặp trong quá trình làm mẫu và cổng phòng lỗi cho mẫu tiếp theo được tổng hợp tại [`lessons-learned.md`](lessons-learned.md). Checklist chung áp dụng cho mọi template nằm trong [`docs/template-clone-quality.md`](../../template-clone-quality.md).
