# Bằng chứng clone Bạch Sứ Đỏ (`porcelain-red`)

- Nguồn: `https://chungdoi.com/vi/mau-thiep/bach-su-do/demo`
- Route nội bộ: `porcelain-red` / route tiếng Việt `bach-su-do`
- Ngày audit: 2026-09-04
- Viewport nguồn: desktop `1440×900`, mobile `390×844`, narrow mobile `320×700`

## Kết quả audit nguồn

| Hạng mục | Kết quả |
|---|---|
| Cover/opening | Nút nguồn là thẻ `<a>` có text `Mở thiệp`; nền nút `rgb(175, 62, 66)` |
| Khung nội dung desktop | Rộng `900px`; toàn trang cao `6004px` |
| Mobile | Cao `5150px` ở `390px`; không overflow ngang (`scrollWidth = innerWidth = 390`) |
| Narrow mobile | Cao `5104px` ở `320px`; không overflow ngang (`scrollWidth = innerWidth = 320`) |
| Hero | Artwork classic `frame-decoration.webp`, kích thước quan sát `489.44×610.58px` |
| Cards | Ceremony/reception rộng `556px`; kiểu classic, không bo tròn V2 |
| Album | Section rộng `898px`; lưới `2×2` có overlay số ảnh; lightbox hiển thị `1 / 7` |
| Lịch trình | Bộ icon riêng `cake.webp`, `home.webp`, `music.webp` |
| Gift | Envelope riêng `porcelain_red.webp`; modal desktop `576×410`, mobile bottom sheet `390×626`; khóa overflow trên `html` |
| RSVP | Nút `XÁC NHẬN THAM DỰ` không mở overlay tại demo standalone (`overlays: []`), giữ proxy behavior hiện có của app |
| Footer | Có lời cảm ơn, `chungdoi.com` và trigger `Nhấn để mở` |
| Broken image | Chỉ pixel tracking Bing thất bại; không có theme/gallery asset lỗi |

Màu chủ đạo quan sát là `rgb(175, 62, 66)`; nền hoa văn dùng `floral-tile.webp`. So với Bạch Sứ Lam, cấu trúc classic có thể tái dùng nhưng phải thay palette, khung hero, toàn bộ gallery, icon lịch trình và envelope.

## Asset local

- Theme: `public/chungdoi/images/themes/porcelain-red/` (`frame-decoration.webp`, `floral-tile.webp`, `cake.webp`, `home.webp`, `music.webp`).
- Gallery: `public/chungdoi/images/gallery/porcelain-red/01.webp` … `07.webp`, đúng thứ tự lightbox nguồn.
- Gift: `public/chungdoi/images/envelope/porcelain_red.webp`.
- URL nguồn đầy đủ nằm trong `source-desktop-audit.json`; mapping local được ghi tại `docs/research/asset-provenance.md`.

## Evidence

- Cover/full page: `source-desktop-cover.png`, `source-desktop-full.png`, `source-mobile-cover.png`, `source-mobile-full.png`, `source-320-top.png`.
- Opening states: `source-desktop-opening-mid.png`, `source-mobile-opening-mid.png`.
- Interactions: `source-desktop-album-modal.png`, `source-desktop-rsvp-modal.png`, `source-desktop-map.png`, `source-desktop-gift-modal.png`, `source-mobile-gift-modal.png`, `source-desktop-footer.png`.
- Machine-readable: `source-desktop-audit.json`, `source-mobile-audit.json`, `source-320-overflow.json`, `source-interactions-audit.json`, `source-layout-audit.json`.

## Chưa xác minh

Google Maps ở nguồn trả `403` không ổn định trong một số lượt audit; không sao chép API key nguồn. Vị trí section và trạng thái click đã ghi nhận, nhưng tile/map rendering không được coi là visual pass. Screenshot so sánh local tại cùng viewport và interaction state sẽ được bổ sung sau triển khai; hiện chưa đánh dấu clone visual hoàn tất.
