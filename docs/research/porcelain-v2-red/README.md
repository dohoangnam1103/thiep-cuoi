# Bằng chứng clone Bạch Sứ V2 Đỏ (`porcelain-v2-red`)

- Nguồn: `https://chungdoi.com/vi/mau-thiep/bach-su-v2-do/demo`
- Route nội bộ: `porcelain-v2-red` / route tiếng Việt `bach-su-v2-do`
- Ngày audit: 2026-09-04
- Viewport nguồn: desktop `1440×900`, mobile `390×844`, narrow mobile `320×700`

## Kết quả audit nguồn

| Hạng mục | Kết quả |
|---|---|
| Cover/opening | Nút nguồn là thẻ `<a>` có text `Mở thiệp`; nền nút secondary `rgb(101, 78, 47)` |
| Khung nội dung desktop | Rộng `900px`; toàn trang cao `6337px` |
| Mobile | Cao `5505px` ở `390px`; không overflow ngang (`scrollWidth = innerWidth = 390`) |
| Narrow mobile | Cao `5525px` ở `320px`; không overflow ngang (`scrollWidth = innerWidth = 320`) |
| Hero | `hero-frame.webp`, kích thước quan sát `400×680.125px` |
| Cards | Ceremony/reception/schedule rộng `558px`, bo tròn; có flower decoration oversized ở nhiều section |
| Album | Section rộng `898px`; carousel phối cảnh thay vì lưới classic; lightbox hiển thị `1 / 8` |
| Lịch trình | Bộ icon riêng `ring.webp`, `cake.webp`, `lamp.webp` |
| Gift | Envelope riêng `porcelain_v2_red.webp`; modal desktop `576×410`, mobile bottom sheet `390×626`; khóa overflow trên `html` |
| RSVP | Nút `XÁC NHẬN THAM DỰ` không mở overlay tại demo standalone (`overlays: []`), giữ proxy behavior hiện có của app |
| Footer | Có lời cảm ơn, `chungdoi.com` và trigger `Nhấn để mở` |
| Broken image | Chỉ pixel tracking Bing thất bại; không có theme/gallery asset lỗi |

Primary quan sát là `rgb(143, 38, 45)`, secondary là `rgb(101, 78, 47)`. Đây không phải đổi màu của layout classic: V2 cần nhánh DOM/style rõ ràng cho hero-frame, flower decorations, carousel album, rounded cards và schedule pattern.

## Asset local

- Theme: `public/chungdoi/images/themes/porcelain-v2-red/` (`hero-frame.webp`, `floral-tile.webp`, `flower.webp`, `ring.webp`, `cake.webp`, `lamp.webp`).
- Gallery: `public/chungdoi/images/gallery/porcelain-v2-red/01.webp` … `08.webp`, đúng thứ tự lightbox nguồn.
- Gift: `public/chungdoi/images/envelope/porcelain_v2_red.webp`.
- URL nguồn đầy đủ nằm trong `source-desktop-audit.json`; mapping local được ghi tại `docs/research/asset-provenance.md`.

## Evidence

- Cover/full page: `source-desktop-cover.png`, `source-desktop-full.png`, `source-mobile-cover.png`, `source-mobile-full.png`, `source-320-top.png`.
- Opening states: `source-desktop-opening-mid.png`, `source-mobile-opening-mid.png`.
- Interactions: `source-desktop-album-modal.png`, `source-desktop-rsvp-modal.png`, `source-desktop-map.png`, `source-desktop-gift-modal.png`, `source-mobile-gift-modal.png`, `source-desktop-footer.png`.
- Machine-readable: `source-desktop-audit.json`, `source-mobile-audit.json`, `source-320-overflow.json`, `source-interactions-audit.json`, `source-layout-audit.json`.

## Chưa xác minh

Google Maps ở nguồn trả `403` không ổn định trong một số lượt audit; không sao chép API key nguồn. Vị trí section và trạng thái click đã ghi nhận, nhưng tile/map rendering không được coi là visual pass. Screenshot so sánh local tại cùng viewport và interaction state sẽ được bổ sung sau triển khai; hiện chưa đánh dấu clone visual hoàn tất.
