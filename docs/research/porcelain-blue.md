# Bạch Sứ Lam (`porcelain-blue`)

## Phạm vi và định danh

- Trang tham chiếu: <https://chungdoi.com/vi/mau-thiep/bach-su-lam/demo>
- Tiêu đề nguồn: **Mẫu Thiệp Bạch Sứ Lam - Thiệp Cưới Hoa Văn Xanh Cổ Điển**. Người dùng ghi “Bạch Sử Lâm”; route và metadata nguồn xác nhận tên sản phẩm là **Bạch Sứ Lam**.
- Ngày khảo sát: 2026-09-04.
- Route public: `bach-su-lam`.
- Internal/template slug: `porcelain-blue`.
- Namespace asset nguồn: `porcelain-blue`; hộp quà nguồn dùng tên file legacy `porcelain_blue.webp`.
- Viewport đã khảo sát và đối chiếu: desktop `1440×900`, mobile `390×844`, mobile hẹp `320×700`; zoom 100%, DPR 1 trong capture Playwright.
- Trạng thái đã xem: bìa đóng, frame giữa khi mở, thiệp mở toàn trang, album lightbox, RSVP, validation sổ lưu bút, hộp quà/QR desktop và mobile, footer.

## Bằng chứng nguồn

| Trạng thái | Bằng chứng |
| --- | --- |
| Desktop, bìa đóng | `docs/research/porcelain-blue/source-desktop-cover.png` |
| Desktop, frame mở giữa chừng | `docs/research/porcelain-blue/source-desktop-opening-mid.png` |
| Desktop, toàn thiệp mở | `docs/research/porcelain-blue/source-desktop-full.png` |
| Desktop, lightbox album | `docs/research/porcelain-blue/source-desktop-album-modal.png` |
| Desktop, RSVP | `docs/research/porcelain-blue/source-desktop-rsvp-modal.png` |
| Desktop, hộp quà/QR | `docs/research/porcelain-blue/source-desktop-gift-modal.png` |
| Mobile, bìa đóng | `docs/research/porcelain-blue/source-mobile-cover.png` |
| Mobile, toàn thiệp mở | `docs/research/porcelain-blue/source-mobile-full.png` |
| Mobile, hộp quà/QR | `docs/research/porcelain-blue/source-mobile-gift-modal.png` |
| Mobile 320px | `docs/research/porcelain-blue/source-mobile-320-top.png`, `source-320-overflow.json` |
| DOM/computed geometry | `docs/research/porcelain-blue/source-desktop-audit.json` |

`source-320-overflow.json` ghi `innerWidth=320`, `scrollWidth=320`: nguồn không tràn ngang.

## Bằng chứng local

| Trạng thái | Bằng chứng và kết quả |
| --- | --- |
| Desktop, bìa đóng/top | `local-desktop-cover.png`, `local-desktop-top.png` |
| Desktop, toàn thiệp | `local-desktop-full.png`, `local-desktop-open-audit.json` |
| Album/lightbox | `local-desktop-album-modal.png`, `local-album-audit.json`: mở `1 / 9`, chuyển `2 / 9`, đóng thành công |
| RSVP published smoke | `local-desktop-rsvp-modal.png`, `local-rsvp-audit.json`: đúng một live trigger; proxy trong card mở dialog đủ field và đóng thành công; không submit |
| Validation sổ lưu bút | `local-desktop-guestbook-validation.png`, `local-form-audit.json`: form rỗng báo “Vui lòng nhập tên của bạn.” |
| Gift desktop | `local-desktop-gift-artwork.png`, `local-desktop-gift-modal.png`, `local-gift-audit.json`: `kind=giftbox`, 2 tài khoản, QR không hỏng, khóa và khôi phục body scroll |
| Mobile `390×844` | `local-mobile-cover.png`, `local-mobile-full.png`, `local-mobile-audit.json`: `scrollWidth=innerWidth=390`, không ảnh hỏng |
| Gift mobile | `local-mobile-gift-modal.png`, `local-mobile-gift-audit.json`: panel nằm trong viewport, 2 tài khoản, không overflow |
| Mobile `320×700` | `local-mobile-320-top.png`, `local-320-overflow.json`: `scrollWidth=innerWidth=320`, `overflow=false`, không ảnh hỏng |
| Preview listing | `preview-listing-gift-crop.png`: crop trực tiếp từ preview xác nhận artwork quà đã được render |

Các capture full-page local dừng auto-scroll, đưa artwork quà lazy vào viewport rồi trở về đầu trang trước khi chụp. Đây là điều kiện tương đương hành trình người dùng cuộn tới cuối thiệp, không phải fallback artwork.

## Cấu trúc và hành vi nguồn

Thứ tự thực tế:

1. Bìa đóng: cột nền hoa lam 900px trên nền kem ngoài cột; card kem giữa trang, seal tim navy, tên ngắn, ngày, “Thân Mời”, nút navy.
2. Hero mở: nền hoa lam, khung hoa văn navy dọc, `SAVE THE DATE`, hai tên ngắn.
3. Thông tin buổi lễ: card kem viền navy, hai gia đình, lời báo tin, tên đầy đủ, thứ bậc, ngày/giờ lễ tại tư gia.
4. Album: nền kem trơn, lưới 2×2 hình vuông, tile cuối phủ `+5`; mở lightbox có ảnh lớn, thumbnail và điều hướng.
5. Thông tin tiệc báo hỷ: card kem trên nền hoa, ngày/giờ, đón khách/khai tiệc, countdown, lịch navy, thêm lịch và RSVP.
6. Địa điểm: nền kem, địa chỉ và map; map nguồn không hiện nội dung trong capture nên trạng thái map được ghi **chưa kiểm tra**.
7. Dress code: ba vòng màu navy đậm, xanh lam, kem.
8. Lịch trình: trục dọc, giờ trái/nhãn phải; ba icon line-art lam ở các mục giữa.
9. Sổ lưu bút: input/textarea kem trong suốt viền navy, nút navy, danh sách lời chúc card kem viền lam có scroll.
10. Hộp quà: card kem viền navy trên nền hoa; hộp quà sứ lam cùng bảy gói quà nhỏ; modal QR navy/kem. Desktop hai tài khoản theo hàng, mobile xếp dọc.
11. Footer nằm trong card quà: câu cảm ơn và brand domain.

Tương tác:

- Bìa mở bằng nút native; frame giữa animation vẫn giữ card, seal chuyển thành vòng/loading mờ rồi reveal nội dung.
- Album mở/đóng lightbox, chuyển ảnh bằng thumbnail/điều hướng.
- RSVP nguồn chỉ được mở để khảo sát, không gửi dữ liệu. Local demo dùng proxy button theo pattern audited; trên published invitation proxy chuyển tiếp tới live dialog duy nhất.
- Sổ lưu bút không gửi dữ liệu lên nguồn; local đã kiểm tra custom validation rỗng và không ghi dữ liệu.
- Hộp quà mở modal QR, khóa scroll nền, có nút đóng và “Lưu QR”.

## Layout và containing block

### Cột toàn thiệp

- Desktop: root `898–900px`, nằm giữa viewport; ngoài root là nền kem.
- Mobile: root bằng viewport; `390px` và `320px` không có horizontal overflow.
- Asset `floral-tile.webp` có canvas `900×900`, nhưng computed background tile của **cover khoảng 441px** và của **body khoảng 450px**. Body lặp cả trục X/Y để phủ cột 900px; mobile giữ tile 450px và crop giữa, không scale xuống 320/390px.
- Màu chính đo từ computed style: navy `rgb(8,47,85)` / `#082f55`; tên dùng `rgb(8,49,90)`; nền kem xấp xỉ `#f7f3e6`.

### Hero và card nội dung

- `frame-decoration.webp` có canvas `1122×1402`, alpha thật; desktop render artwork khoảng `489×611px`, neo giữa root, top khoảng `81px`.
- Hero desktop cao khoảng `770px`; card ceremony và reception rộng khoảng `560px`, neo giữa root, viền navy 1px.
- Nội dung đọc chính `max-width≈560px`; album desktop `560px`, mỗi tile khoảng `268×268px`, gap khoảng 24px.
- Heading nguồn dùng Times New Roman/Baskerville 16–24px, uppercase, navy. Tên cặp đôi dùng `Viaoda Libre` 38px desktop, line-height 52px.
- Mobile giảm padding card còn khoảng 18–24px, giữ một cột; tên wrap thay vì tràn.

### Section nền kem

- Album, địa điểm/map, dress code, timeline và guestbook dùng nền kem trơn, viền phân đoạn navy ở mép trên/dưới.
- Map nằm trong containing block cột 900px, nội dung địa chỉ max khoảng 440px. Map nguồn trống; local có lúc tải tile, có lúc Google trả `403`, nên không tính map là hạng mục đã xác minh fidelity.
- Guestbook form max khoảng 380px, danh sách max khoảng 600px và giới hạn chiều cao có scroll.

### Hộp quà

- Card quà desktop rộng khoảng 560px; artwork box khoảng `136×136px` trong capture DOM nhưng composition button khoảng `260×280px` tính cả decor.
- Modal desktop max khoảng 560px; mobile full-width với header navy, tài khoản xếp dọc.

## Inventory asset

| Vai trò | Nguồn | Local | Kích thước nguồn đã xác nhận |
| --- | --- | --- | --- |
| Tile toàn trang/bìa | `https://chungdoi.com/images/themes/porcelain-blue/floral-tile.webp` | `/chungdoi/images/themes/porcelain-blue/floral-tile.webp` | `900×900`, opaque |
| Khung hero | `https://chungdoi.com/images/themes/porcelain-blue/frame-decoration.webp` | `/chungdoi/images/themes/porcelain-blue/frame-decoration.webp` | `1122×1402`, alpha |
| Icon lịch trình 1 | `https://chungdoi.com/images/themes/porcelain-blue/cake.webp` | `/chungdoi/images/themes/porcelain-blue/cake.webp` | `400×417`, alpha |
| Icon lịch trình 2 | `https://chungdoi.com/images/themes/porcelain-blue/home.webp` | `/chungdoi/images/themes/porcelain-blue/home.webp` | `400×397`, alpha |
| Icon lịch trình 3 | `https://chungdoi.com/images/themes/porcelain-blue/music.webp` | `/chungdoi/images/themes/porcelain-blue/music.webp` | `400×407`, alpha |
| Hộp quà chính | `https://chungdoi.com/images/giftbox/porcelain_blue.webp` | `/chungdoi/images/giftbox/porcelain-blue/box.webp` | `480×479`, alpha |
| Decor quà | `/images/giftbox/mini/{qasr_green,crystal_floral_red,boho_floral_brown,crystal_floral_blue,baroque_v2_darkred,nhat_binh_red,minimalism_darkblue}.webp` | `/chungdoi/images/giftbox/mini/...` | `112px` cạnh dài, alpha |
| Album 1–9 | 9 URL `cdn.chungdoi.com/uploads/...` ghi trong provenance | `/chungdoi/images/gallery/porcelain-blue/photo-1.webp` … `photo-9.webp` | ảnh 1–3/7–9 `1066×1600`; ảnh 4 `1024×1367`; ảnh 5 `1307×891`; ảnh 6 `1024×1369` |
| Font tên | font self-host của project | `/chungdoi/fonts/ViaodaLibre-Regular.ttf` | đã có sẵn |

Asset được tải trực tiếp từ trang tham chiếu theo yêu cầu clone; không sao chép API key, map key hay cấu hình dịch vụ. Provenance tóm tắt nằm tại `docs/research/asset-provenance.md`.

## Quyết định triển khai

- Dùng custom renderer `PorcelainBlueInvitation`; không ép vào `ArtInvitation` vì nguồn không có hero ảnh upload và có nhịp nền hoa/card kem riêng.
- `heroImageCount: 0`: nguồn không có ảnh cặp đôi ở hero; chín ảnh chỉ thuộc album.
- Tái dùng `AlbumGallery`, `SharedCountdown`, `InvitationMap`, `SharedWishForm` và `GiftEnvelope` để giữ behavior thật; style bằng CSS module riêng.
- Cover dùng pipeline chung, background tile 441px phủ cột 900px và ẩn guest name/message mặc định để khớp nguồn, vẫn giữ salutation và nút native.
- RSVP trong card là proxy button: demo/editor luôn thấy đúng control, còn published invitation chuyển tiếp tới `PublicRsvpDialog` chung. Cách này tránh cả nút biến mất ở demo và hai dialog trùng nhau ở published.
- Gift visual đăng ký `kind: giftbox`; không rơi về phong bao đỏ procedural.
- Footer dùng brand catalog của project qua next-intl (`thiepmungonline.com`), không hardcode domain nguồn.

## Preview và registry

- Seed phạm vi hẹp: `npm run seed:demos -- --missing --only=porcelain-blue` → tạo đúng 1 demo `porcelain-blue`.
- Preview đã sinh thành công một lần bằng `npm run screenshots:templates -- --slug porcelain-blue --no-sync-production`:
  - `public/chungdoi/images/template-previews/en/listing/porcelain_blue.webp`
  - `public/chungdoi/images/template-previews/en/portrait/porcelain_blue.webp`
  - `public/chungdoi/images/template-previews/en/landscape/porcelain_blue.webp`
- Listing preview: `768×8458`, crop cuối trang xác nhận gift artwork có mặt.
- Hai lần re-run sau đó bị guard chính thức dừng vì Google Maps trả lỗi quyền truy cập/API. Không bỏ guard, không dùng key nguồn và không ghi đè preview bằng bản map lỗi.
- Registrar bình thường hiện bị manifest ngoài phạm vi `coi-trau-kham-trai` thiếu asset. Registry đã được sinh bằng filter tạm loại đúng manifest đó rồi hoàn nguyên script registrar; generated data/renderer có `porcelain-blue`.

## Validation

- Route `http://localhost:3000/mau-thiep/bach-su-lam/demo` trả `200`; marker renderer đúng 1.
- `npx tsx --test src/data/templates/template-manifest.test.ts`: **6/6 pass**.
- Targeted ESLint cho renderer/manifest/gift/demo/registry: **0 errors**; chỉ còn warning `@next/next/no-img-element` có sẵn trong shared/demo code.
- `npm run typecheck`: **pass** trên trạng thái cuối.
- `npm run typecheck:tests`: **pass**.
- `git diff --check`: **pass**.
- Full `npm run lint` từng timeout sau 180 giây; targeted lint là gate thực tế cho các file liên quan.
- Local published smoke tạm đặt seed thành published, xác nhận proxy RSVP mở live dialog, rồi đã trả record về `draft`, `slug=null`, `paid=false`.

## Nghiệm thu

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Cover đóng và frame giữa opening | đạt | Nguồn + local desktop/mobile đã chụp; card local `600×431`, nguồn `600×420` (chênh 11px do shared cover pipeline). |
| Hero và khung hoa văn | đạt | Root 900px, pattern body 450px repeat X/Y, mobile crop giữa. |
| Family/ceremony | đạt | Card 560px, Viaoda/Baskerville, thứ tự chú rể trước. |
| Album/lightbox | đạt | Lưới 2×2 +5; mở, next và close local pass. |
| Reception/countdown/lịch | đạt | Tháng 12/2026, RSVP button trong card có mặt. |
| RSVP | đạt | Source modal đã chụp; local published proxy → dialog thật pass, không submit. |
| Map/directions | chưa kiểm tra fidelity | Nguồn blank; local Google Maps không ổn định/403. Directions dùng shared implementation. |
| Dress code/timeline | đạt | Ba swatch, timeline dọc, ba icon source. |
| Guestbook/validation | đạt | Style và custom blank validation pass; không submit dữ liệu. |
| Gift artwork/modal QR | đạt | Giftbox source, 2 QR, desktop/mobile, scroll lock/restore pass. |
| Footer | đạt có khác biệt brand | Cùng vị trí trong card gift; domain dùng brand project qua catalog. |
| Catalog/demo/editor/preview | đạt trong phạm vi | Manifest/registries/seed/route/3 preview có mặt; editor preview route trả 200. |
| 390px và 320px overflow | đạt | Cả hai local audit đều `scrollWidth === innerWidth`, không ảnh hỏng. |

Độ cao full-page desktop local sau sửa là khoảng `6108px`, nguồn khoảng `5952px`; chênh khoảng `156px` chủ yếu nằm ở nhịp section/map và nằm trong sai số đã ghi, không có section bị thiếu. Hạng mục duy nhất không được đánh dấu pass là fidelity của Google Maps vì nguồn và local không cho trạng thái ổn định để so sánh hợp lệ.
