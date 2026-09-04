# Bằng chứng clone Bạch Sứ Nâu (`porcelain-brown`)

- Nguồn: `https://chungdoi.com/vi/mau-thiep/bach-su-nau/demo`
- Route nội bộ: `porcelain-brown` / route tiếng Việt `bach-su-nau`
- Ngày audit: 2026-09-04
- Viewport nguồn: desktop `1440×900`, mobile `390×844`, narrow mobile `320×700`

## Kết quả audit nguồn

| Hạng mục | Kết quả |
|---|---|
| Cover/opening | Nút nguồn là thẻ `<a>` có text `Mở thiệp`; nền nút `rgb(141, 111, 50)` |
| Khung nội dung desktop | Rộng `900px`; toàn trang cao `6100px` |
| Mobile | Cao `5205px` ở `390px`; không overflow ngang (`scrollWidth = innerWidth = 390`) |
| Narrow mobile | Cao `5159px` ở `320px`; không overflow ngang (`scrollWidth = innerWidth = 320`) |
| Hero | Artwork classic `frame-background.webp`, kích thước quan sát `440×607.97px` |
| Cards | Ceremony/reception rộng `556px`; kiểu classic, không bo tròn V2 |
| Calendar | Có texture riêng `calendar-texture.webp`, không được fallback sang classic variant khác |
| Album | Section rộng `898px`; lưới `2×2` có overlay số ảnh; lightbox hiển thị `1 / 6` |
| Lịch trình | Bộ icon riêng `cake.webp`, `home.webp`, `music.webp` |
| Gift | Envelope riêng `porcelain_brown.webp`; modal desktop `576×410`, mobile bottom sheet `390×626`; khóa overflow trên `html` |
| RSVP | Nút `XÁC NHẬN THAM DỰ` không mở overlay tại demo standalone (`overlays: []`), giữ proxy behavior hiện có của app |
| Footer | Có lời cảm ơn, `chungdoi.com` và trigger `Nhấn để mở` |
| Broken image | Chỉ pixel tracking Bing thất bại; không có theme/gallery asset lỗi |

Màu chủ đạo quan sát là `rgb(141, 111, 50)`. So với Bạch Sứ Lam/Đỏ, biến thể này vẫn dùng layout classic nhưng khác artwork hero, texture lịch, gallery JPEG, palette và envelope; các khác biệt này phải nằm trong config riêng thay vì fallback.

## Asset local

- Theme: `public/chungdoi/images/themes/porcelain-brown/` (`frame-background.webp`, `floral-tile.webp`, `calendar-texture.webp`, `cake.webp`, `home.webp`, `music.webp`).
- Gallery: `public/chungdoi/images/gallery/porcelain-brown/01.jpg` … `06.jpg`, đúng thứ tự lightbox nguồn.
- Gift: `public/chungdoi/images/envelope/porcelain_brown.webp`.
- URL nguồn đầy đủ nằm trong `source-desktop-audit.json`; mapping local được ghi tại `docs/research/asset-provenance.md`.

## Evidence

- Cover/full page: `source-desktop-cover.png`, `source-desktop-full.png`, `source-mobile-cover.png`, `source-mobile-full.png`, `source-320-top.png`.
- Opening states: `source-desktop-opening-mid.png`, `source-mobile-opening-mid.png`.
- Interactions: `source-desktop-album-modal.png`, `source-desktop-rsvp-modal.png`, `source-desktop-map.png`, `source-desktop-gift-modal.png`, `source-mobile-gift-modal.png`, `source-desktop-footer.png`.
- Machine-readable: `source-desktop-audit.json`, `source-mobile-audit.json`, `source-320-overflow.json`, `source-interactions-audit.json`, `source-layout-audit.json`.

## Kiểm tra hồi quy hero ngày 2026-09-04

Đã đối chiếu riêng lỗi nền ở bốn vai quanh khung tên viết tắt tại cùng kích thước desktop và mobile qua `source-desktop-full.png` ↔ `local-desktop-full.png`, cùng `source-320-top.png` ↔ `local-320-top.png`. Asset `frame-background.webp` vốn đã chứa nền ngà đúng silhouette và vùng alpha bên ngoài; lớp `.heroPanel` hình chữ nhật nằm phía sau mới là phần lộ qua alpha, tạo bốn mảng trắng sai so với nguồn.

Fix được giới hạn ở biến thể nâu bằng `.brown .heroPanel { display: none; }` trong `src/components/chungdoi-tpl-porcelain-family.module.css`. Không thay đổi geometry, artwork hay các biến thể porcelain khác. Lượt kiểm tra này chỉ xác nhận defect bốn góc hero và ảnh preview mới tạo; không được hiểu là audit lại toàn bộ clone hoặc xác nhận mọi interaction state.

## Chưa xác minh

Google Maps ở nguồn trả `403` không ổn định trong một số lượt audit; không sao chép API key nguồn. Vị trí section và trạng thái click đã ghi nhận, nhưng tile/map rendering không được coi là visual pass. Screenshot so sánh local tại cùng viewport và interaction state sẽ được bổ sung sau triển khai; hiện chưa đánh dấu clone visual hoàn tất.
