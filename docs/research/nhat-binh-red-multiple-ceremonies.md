# Nhật Bình Đỏ — lễ bổ sung trong section gốc

## Phạm vi, nguồn và nguyên nhân

- Ngày: 2026-10-17. Thiệp được báo lỗi: https://thiepmungonline.com/thiep/thanh-thao-hong-duong-28102026.
- HTML public xác nhận `template_id: nhat-binh-red`, nhưng hiện chỉ hiển thị thông báo hết hạn dùng thử. Chưa xác minh được số lễ/nội dung thực của khách hoặc chụp bố cục thiệp này trên production.
- Code hiện hữu là tham chiếu giao diện cho bản sửa hành vi, không clone/redesign. `NhatBinhInvitation` chỉ đọc `couple.ceremonyDate/Time` và tiêu đề lễ đầu tiên; registry khai `post-template`, khiến `AdditionalCeremonies` nối các lễ còn lại sau renderer/footer.
- Đối chiếu bản sửa Hoa Mộc Xanh: cùng hợp đồng `invitationCeremonies(content)` và registry `inline-all`.

## Hợp đồng section và kế hoạch sửa

- Owner: `src/components/chungdoi-tpl-nhat-binh.tsx`; route public `src/app/thiep/[slug]/page.tsx`; registry runtime `src/components/chungdoi-demo.tsx`.
- Luồng: quan hệ `CeremonyItem` → `toDemoContent` (giữ `sortOrder`) → `ChungDoiDemoContent.ceremonies` → `invitationCeremonies` → danh sách native. Helper giữ tương thích `couple.ceremony*` khi chưa có danh sách.
- Section `data-template-ceremonies` / `data-nhat-binh-ceremonies` nằm sau gia đình, lời báo tin và tên cặp đôi, trước album, tiệc/lịch, bản đồ, lịch trình, sổ lưu bút, quà mừng và footer. Các phần tùy chọn tiếp tục dùng điều kiện hiện hữu.
- Mỗi lễ giữ title/date/time riêng; title, time, date vắng thì bỏ đúng phần đó, không tự thêm giờ 09:00. `ceremonies: []` không tạo danh sách trống. Dữ liệu cũ vẫn có một lễ.
- Dùng lại catalog `invitationTemplate.ceremonyAtTime` và `invitationTemplate.month`; không thêm copy mới.
- Cùng một cột tại desktop/tablet/mobile. Khung thiệp tối đa 480px, từ `md` là 900px; section padding ngang 24px/40px. Danh sách rộng bằng section trong, tự tăng chiều cao, khoảng cách giữa lễ 40px. Giữ khoảng cách đầu 40px và spacing từng lễ 16px/20px.
- Giữ nền kem `#F8F3E0`, chữ `#542E08`, accent `#c32a29`, HelveticaNeue, font/title/date hiện hữu, các vạch ngăn ngày và họa tiết góc. Không thêm border/radius/shadow hoặc animation.
- Nội dung tĩnh, không thêm control/loading/error/modal; quyền truy cập, editor/save/preview/publish/share, URL và media handling giữ nguyên. Không thay schema/API/data khách.

## Asset và phạm vi file

- Không thêm hoặc thay asset. `public/chungdoi/images/themes/nhat-binh-red/corner.webp` (WebP 854×854) neo theo section thông tin lễ; giữ bốn góc và containing block hiện tại.
- `paper.webp` (1656×4000) là nền toàn cột thiệp; `may.webp` (2560×1311) là nền mây trong body. Giữ tỷ lệ/vị trí/lớp và provenance clone hiện hữu; không phát sinh tài sản hoặc thay đổi giấy phép.
- Hai file runtime thay đổi: renderer Nhật Bình và một entry registry. Thêm unit test, E2E mục tiêu và research note này. Không sửa bản sao package đang không được route public import.

## Kiểm thử

- Trước sửa: unit test render SSR thực tế thất bại vì thiếu lễ thứ hai; case lễ chưa có ngày cũng thất bại. Sau sửa: 4/4 case Nhật Bình qua sau bổ sung case legacy rỗng; 10/10 test mục tiêu ban đầu cũng qua.
- Fixture: Vu Quy 07:00 ngày 07/11/2026 và Tân Hôn 09:15 ngày 08/11/2026, khác title/date/time; test xác nhận thứ Bảy/Chủ Nhật riêng và thứ tự trước album. Có case dữ liệu cũ, danh sách rỗng và trường ngày/giờ trống. Review độc lập phát hiện helper tự sinh tiêu đề khi toàn bộ legacy header/date/time trống; thêm guard theo dữ liệu thực và test red/green để trường hợp này tiếp tục ẩn.
- E2E dùng SQLite test riêng, tạo thiệp published và xóa fixture trong `finally`; không tác động production. Mục tiêu: hai lễ trong cùng section, không có `data-additional-ceremonies`, đúng ngày/giờ, trước album/footer, không tràn ngang, không `pageerror`.
- Viewport yêu cầu: 1440×900, 768×900, 390×900, 320×900, reduced motion, mở cover và dừng auto-scroll. Bằng chứng ảnh: `nhat-binh-red-ceremonies/local-{1440,768,390,320}-ceremonies.png` (chỉ ghi đạt sau khi test/chụp và xem ảnh).

## Trạng thái kiểm chứng

- Lint: đạt, 0 lỗi / 412 cảnh báo có sẵn.
- Typecheck: đạt sau khôi phục liên kết dependency/workspace đã có trên đĩa trong `node_modules`; không sửa package/lock/config để xử lý môi trường.
- Typecheck tests: đạt. Toàn bộ unit suite: 937/937 đạt, kèm deploy-fast-safety. Lint riêng các file renderer/test vừa sửa: đạt.
- Production build: chưa đạt do lỗi ngoài phần sửa. Turbopack panic khi NFT đọc thư mục `sharp-libvips-darwin-arm64` như file; thử Webpack thì vướng `node:crypto` từ `src/lib/payment.ts` trong client `PaymentPanel.tsx`. Không sửa payment/config để mở rộng phạm vi task.
- E2E: 4/4 kiểm tra phần lễ đạt ở 1440, 768, 390 và 320px trên server dev Webpack, Chrome hệ thống và `localhost:3120`. Chromium revision yêu cầu của Playwright 1.61.1 chưa có trong cache. DB test đặt bìa 2D trước khi boot; không thay cài đặt hay dữ liệu production. Không tính kết quả này là production build đã qua.
- Đã xem trực tiếp cả bốn ảnh `nhat-binh-red-ceremonies/local-{1440,768,390,320}-ceremonies.png`: hai lễ liên tiếp trong cột gốc, cùng font/nền/kiểu ngày; tiêu đề dài xuống dòng tại 320px, thứ/tháng của ngày Chủ Nhật cũng xuống dòng, không chồng nội dung. DOM/geometry cùng frame xác nhận mỗi lễ trước album/footer và không có `[data-additional-ceremonies]`; không tràn ngang và không `pageerror` ở cả bốn viewport.
- Quá trình kiểm tra: dev origin `127.0.0.1` bị chặn HMR, đổi riêng môi trường kiểm tra sang `localhost`; xóa cache dev cũ để fixture bìa 2D được áp dụng. Chờ toàn bộ asset bìa không phù hợp cho test phần lễ trên mobile, nên test mở bằng control có sẵn và retry đến khi section lễ hiện để chịu được hydration. Đo tất cả bounding box trong cùng một frame để không so tọa độ từ các thời điểm cuộn khác nhau. Không sửa logic runtime của bìa/auto-scroll.
- Console dev có cảnh báo React state update trước mount trong lượt mobile trước; chưa điều tra vì ngoài renderer phần lễ. Không tuyên bố toàn bộ thiệp không có console warning; chỉ khẳng định không có `pageerror` trong các case đạt.
- Review độc lập: đã xử lý phát hiện legacy rỗng; reviewer kiểm tra lại guard và không còn phát hiện cần sửa. Config/script kiểm tra tạm được xóa sau chạy; giữ spec E2E dùng cấu hình dự án bình thường.
- Chưa kiểm tra lại toàn bộ cover, gallery interaction, calendar, guestbook/gift modal; các phần này không đổi trong task. Không tuyên bố hoàn tất đối chiếu toàn bộ thiệp.
- Chưa deploy. Thiệp khách hết hạn nên chưa thể xác minh nội dung/bố cục production.

## Đối chiếu toàn catalog (2026-10-18)

- Mục tiêu: chắc chắn không còn mẫu nào đẩy lễ bổ sung xuống sau footer. Phạm vi là 112 mẫu trong `src/data/chungdoi.ts`, không chỉ Nhật Bình.
- Hợp đồng registry: `TemplateCeremonyRendering` chỉ còn `"inline-all"`, toàn bộ entry trong `chungdoi-demo.tsx` và `generated/template-renderers.tsx` dùng `inline-all`. Test manifest chỉ chấp nhận `inline-all`, nên một mẫu khai `post-template` sẽ đỏ ngay ở typecheck/test.
- Guard SSR mới `src/components/chungdoi-all-ceremonies.test.ts`: render renderer thật của từng mẫu với 3 lễ khác title/ngày/giờ, case legacy một lễ, danh sách rỗng và các lễ chỉ có title/giờ/ngày. Assert đúng một vùng `data-template-ceremonies`, đủ 3 item, đúng thứ tự, mỗi lễ trước mọi footer, không còn giờ legacy.
- Kết quả: 112/112 mẫu đạt; `detective-conan-casebook` skip SSR vì chương lễ chỉ mount sau tương tác, được phủ bởi browser audit (mở chương "Thời gian thành hôn" rồi kiểm tra 3 lễ).
- Helper đo ngày được sửa để không tạo âm tính giả: tách text node React và `<br>` trước khi đọc số; năm chỉ bắt buộc khi chính renderer đó in năm ở lễ legacy. Bốn mẫu từng đỏ vì helper, không phải vì vị trí lễ: `sunflower`, `hoa-kho-orange` (mất khoảng trắng giữa "Tháng 01" và năm), `hy-uoc`, `rap-hy-sai-gon` (thiết kế chỉ in ngày.tháng).
- Browser audit: script chụp bằng chứng được retry khi section bị thay thế giữa lúc đo và chụp. Đã chạy lại các mẫu từng đỏ; các lỗi còn lại là page error/HMR của dev server và một lần timeout click ở Côn An, không phải assertion vị trí lễ. Production build cục bộ vẫn lỗi sharp/node:crypto nên chưa chạy được toàn bộ 112 mẫu ở chế độ production.
- Cổng kiểm tra: `npm run test:unit` 1051 test, 1050 đạt, 1 skip (Côn An), 0 lỗi; `typecheck`, `typecheck:tests`, lint các file đã sửa đều đạt.
