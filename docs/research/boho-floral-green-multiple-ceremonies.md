# Hoa Mộc Xanh — lễ bổ sung đúng section

## Phạm vi và tham chiếu

- Ngày kiểm tra: 2026-10-09.
- Thiệp: https://thiepmungonline.com/thiep/nhut-khanh-hoang-thi-07112026.
- Mẫu: `boho-floral-green` (Hoa Mộc Xanh).
- Phạm vi: danh sách lễ trong section Thông tin lễ cưới và vị trí của danh sách so với album/footer. Không redesign các section khác.
- Kiểm tra production ở 1440×900 và 390×900, zoom 100%, thiệp đã mở, dừng auto-scroll, reduced motion.

## Nguyên nhân

- Dữ liệu production chứa hai lễ: Vu Quy 07:00 và Tân Hôn 09:00 ngày 07/11/2026.
- `chungdoi-tpl-boho-floral-green.tsx` chỉ đọc các field `couple.ceremony*`, nên section native chỉ có lễ đầu tiên.
- Registry trong `chungdoi-demo.tsx` khai `post-template`, nên `AdditionalCeremonies` render `invitationCeremonies(content).slice(1)` sau footer.
- DOM production xác nhận `[data-additional-ceremonies]` ở sau footer trên cả hai viewport.
- Các mẫu Hoa Mộc Nâu/Song Hỷ đã dùng danh sách native và mode `inline-all`; bản sửa này áp dụng cùng hợp đồng cho Hoa Mộc Xanh.

## Hợp đồng section và cách sửa

- Owner: `BohoFloralGreenInvitation`, dùng `invitationCeremonies(content)` và `.map(...)`.
- Marker: `[data-boho-green-ceremonies]`, `[data-template-ceremonies]`, `[data-template-ceremony-item]`.
- Mỗi lễ lặp nguyên kiểu chữ/nền/cấu trúc của lễ chính: tiêu đề, Vào lúc, giờ, thứ/ngày/tháng, năm, ngày âm.
- Thứ tự: gia đình và tên đôi uyên ương → danh sách lễ → album → các phần còn lại → footer.
- Gia đình/tên chỉ xuất hiện một lần. Giữ thứ tự lễ đã lưu, ngày và giờ riêng từng lễ.
- Dữ liệu: `CeremonyItem` qua `toDemoContent`; tương thích field `couple.ceremony*` cũ qua helper. Không thay schema/API/URL/editor/save/publish/share hoặc quyền truy cập.
- Trường trống: bỏ từng phần không có dữ liệu; danh sách `ceremonies: []` không tạo khối trống. Lễ có tiêu đề/giờ nhưng chưa có ngày vẫn giữ nội dung có sẵn.
- Copy mới dùng `invitationTemplate.ceremonyAtTime`; nhãn tháng dùng `invitationTemplate.month`.
- Không thêm tương tác, control, modal, loading/error state riêng. Lễ là nội dung tĩnh; giữ nguyên control và form hiện có.

## Bố cục và asset

- Containing block: cột thiệp rộng tối đa 480px trên mobile, 900px từ breakpoint `md` (768px). Danh sách nằm trong section native có padding 16px / 40px, không nằm ngoài cột thiệp.
- Danh sách một cột ở mọi viewport, cách nhau 32px; chiều cao tự mở rộng theo nội dung. Các lễ cùng độ rộng; tiêu đề tự xuống dòng.
- Nền `#fffaf7`, chữ `#30530f`, accent `#6b8040`, font body Baskerville/Times New Roman kế thừa section. Font/title/time/date giữ class hiện hữu.
- Không đổi/thêm artwork hay vị trí absolute. Asset hiện hữu `public/chungdoi/images/themes/boho-floral-green/flower.webp`: WebP 1800×1800, hoa trang trí của rail/hero. `public/chungdoi/images/themes/_decor/boho-floral-green/decoration_bar.webp`: WebP 3304×421, thanh trang trí của hero/divider. Giữ nguyên provenance từ template clone hiện có, không tạo tài sản mới hoặc thay quyền sử dụng.

## Kiểm thử và bằng chứng

- Unit render SSR thực tế với provider ngôn ngữ và router context: fixture có hai lễ khác title/date/time; cả hai xuất hiện đúng thứ tự trước album, ngày/giờ không dùng lẫn nhau.
- Test đã thất bại trước sửa vì renderer bỏ qua danh sách lễ; sau sửa cả hai unit case qua.
- Unit case bổ sung: tương thích lễ cũ; danh sách rỗng không render lễ.
- E2E dùng SQLite riêng `tests/e2e/.data/test.db`, fixture published tạo/xóa qua helper hiện hữu. Không ghi vào thiệp production.
- Fixture E2E: Vu Quy 07:00 ngày 07/11/2026; Tân Hôn 09:15 ngày 08/11/2026. Khác production ở ngày/giờ lễ thứ hai có chủ ý để kiểm tra binding độc lập.
- E2E kiểm tra hai lễ trong native section, không có `[data-additional-ceremonies]`, không tràn ngang, thứ tự trước album, cùng độ rộng, và không có `pageerror`.
- Ảnh production: `boho-floral-green-ceremonies/live-{1440,390}-ceremony.png` và `live-{1440,390}-after-footer.png`.
- `npm run check`: đạt (lint 0 lỗi, 412 cảnh báo có sẵn; typecheck; typecheck:tests; 933/933 unit tests và deploy-fast safety tests; build:local).
- `E2E_PORT=3115 npx playwright test tests/e2e/boho-floral-green-ceremonies.spec.ts --project=chromium`: 4/4 đạt trên production build chạy local, database test riêng.
- Ảnh local: `boho-floral-green-ceremonies/local-{1440,768,390,320}-ceremonies.png`.
- Đã xem trực tiếp ảnh desktop 1440px, mobile 390px và 320px: hai lễ cùng bố cục chữ/nền với lễ chính trên reference; gap tách hai lễ rõ, title xuống dòng ở 320px, không đè chữ/âm lịch. 768px có bằng chứng ảnh và E2E layout.
- DOM/E2E xác nhận lễ thứ hai nằm sau lễ thứ nhất nhưng trước album, cùng độ rộng; không có card generic sau footer; không có lỗi `pageerror` ở cả 4 viewport.

## Giới hạn

- Không tuyên bố đối chiếu lại toàn bộ thiệp: cover, calendar, guestbook/gift modal, RSVP và footer không có thay đổi trong task này.
- Không kiểm tra gửi form hoặc upload trên production; không chỉnh dữ liệu khách hàng.
- Production đã được triển khai theo yêu cầu tiếp theo của người dùng; kết quả ở mục dưới.

## Deploy được người dùng yêu cầu

- Nguồn triển khai được dựng riêng từ source production đang chạy, không từ toàn bộ workspace đang có nhiều thay đổi khác.
- So sánh SHA-256 của 4.470 input production (src/packages/scripts/prisma/messages/public, bỏ generated/test/runtime uploads) xác nhận chỉ ba file runtime đổi: `src/components/chungdoi-demo.tsx`, `src/components/chungdoi-tpl-boho-floral-green.tsx`, `messages/vi.json`.
- Package/lock và cấu hình build lấy đúng bản production; không thay dependency hoặc schema.
- Kiểm thử render mục tiêu 7/7 và typecheck qua trên nguồn release riêng. Test SEO cũ từ commit gốc được đồng bộ với test hiện có để khớp API SEO đang chạy; file test không thuộc runtime deploy.
- Pipeline: `scripts/deploy-vps.sh` → frozen build context → gate i18n/browser → build/backup/stage → promote/health/rollback guard. Không bỏ qua gate.
- Lần gate đầu: 129/131 đạt; hai test `retired demo is unavailable: thanh-duong-anh-sang` và `retired demo is unavailable: thap-nhi-chi-do` dùng kỳ vọng 404 cũ trong khi production đã dùng 301 về danh sách mẫu. Đồng bộ `tests/e2e/i18n-coverage.spec.ts` từ workspace (đã có kiểm tra 301/location và 404 cho capture), rồi chạy lại toàn bộ gate. Không đổi code route production để xử lý test cũ.
- Deploy thành công: `20261009163010`, release source `candidate-20261009163010-84641`, image `sha256:a5eeca9e590c9c905f16bbf0544bcfe64bfede07e14e286ebf680d49b3949f19`.
- Gate cuối: 11/11 i18n unit checks, 131/131 browser checks. Production build, backup quick_check, image assembly, origin health/asset/database, public URLs và scheduler verification đều đạt. Không migration; không seed lại danh sách nhạc có sẵn.
- Kiểm tra chính link khách hàng sau deploy tại 1440×900 và 390×900, zoom 100%, reduced motion, mở thiệp bằng control bàn phím rồi dừng auto-scroll: hai lễ có giờ 07:00 và 09:00, cùng section native, trước album và footer; 0 `[data-additional-ceremonies]`; không tràn ngang; không `pageerror`.
- Đã xem ảnh mobile production sau sửa; hai lễ giữ bố cục gốc và ngày/giờ thật của khách hàng.
- Bằng chứng: `boho-floral-green-ceremonies/production-fixed-{1440,390}-ceremonies.png` và `production-fixed-verification.json`.
- Script kiểm tra ban đầu dùng click DOM ngay sau tải đã không mở bìa; kiểm tra cuối dùng focus + Enter trên control sẵn có và thành công. Không sửa behavior mở bìa trong release.
