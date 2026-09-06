# Hỷ Ước — kế hoạch dựng thiệp và nghiệm thu

Ngày lập: 05/09/2026. Trạng thái: **kế hoạch triển khai; chưa viết renderer**.

## 1. Mục tiêu và phạm vi

Dựng mẫu thiệp mới **Hỷ Ước**, dựa trên concept đỏ son / giấy ivory đã được duyệt và bộ asset riêng đã tạo. Mẫu cần có bố cục rõ, ảnh đầu vừa phải, mở thiệp ngắn gọn và phong bao mừng cưới có artwork thật.

- Slug đề xuất: `hy-uoc`; renderer: `HyUocInvitation`; route demo dự kiến: `/mau-thiep/hy-uoc/demo`. Kiểm tra trùng trước khi đăng ký.
- Tạo mẫu mới độc lập. Không tự xoá hoặc thay dữ liệu các thiệp Nguyệt Bạch đang có.
- Turn hiện tại chỉ tạo tài liệu này. Các checkbox triển khai bên dưới đều chưa thực hiện.
- Asset đã tồn tại không đồng nghĩa giao diện đã nghiệm thu. Các phần chưa có hình thiết kế phải được dựng bản xem trước để người dùng duyệt kỹ.
- Deploy là giai đoạn riêng sau nghiệm thu và khi người dùng yêu cầu; không chạy deploy chỉ vì hoàn tất các task local.

### Nguồn thiết kế

- [Hướng dẫn bộ asset](research/hy-uoc-assets.md).
- [Bảng xem 17 asset](research/hy-uoc-assets/index.html).
- [Inventory kích thước/dung lượng](research/hy-uoc-assets/inventory.json).
- [Prompt và nguồn ảnh](research/hy-uoc-asset-generation.json).
- [Quy trình kiểm tra thị giác của dự án](template-clone-quality.md).
- Bản hình đã duyệt: bìa liền mặt, phong bao mặt trước, tên chia ba dòng. Khi triển khai cần đưa bản concept đã duyệt vào thư mục bằng chứng để đối chiếu; không dùng ảnh tạo ở vòng trước có đường cắt giữa làm chuẩn.

## 2. Những quyết định phải giữ

| Hạng mục | Yêu cầu đã chốt |
| --- | --- |
| Bìa | Một mặt đỏ liền, không đường cắt hoặc bóng nếp gấp ở giữa. |
| Tên | Tên thứ nhất / `&` / tên thứ hai thành ba dòng; hai tên cùng cỡ và căn giữa. Tôn trọng thứ tự cô dâu/chú rể trong dữ liệu. |
| Mở thiệp | Toàn bộ bìa trượt lên để lộ trang kem, khoảng 650–800ms. Một lần chạm; không vỡ dấu niêm, không tách hai cánh, không hoa bay. |
| Ảnh đầu | Một ảnh đôi trong khung vòm. Trên mobile chiều cao mục tiêu 260–300px; không đặt hai ảnh lớn nối nhau. |
| Phong bao | Mặc định hiện hai mặt trước đỏ, mỗi bao thuộc một tài khoản. Không lật ngang artwork hoặc hiện mặt nắp gấp mặc định. |
| QR | Chỉ hiện khi người xem chủ động mở đúng phong bao. QR thật từ dữ liệu; không đặt hai QR trần trên trang. |
| Chuyển động | Không tự cuộn. Reveal nhẹ nếu có; reduced-motion bỏ chuyển động không cần thiết. |
| Bảng màu | Đỏ `#990F16`, ivory `#F8F0DF`, vàng `#B58A4B`, mực nâu `#34251F`. |
| Cảm giác | Thiệp giấy truyền thống có hoa nét khắc; không lặp khung bo tròn mặc định cho mọi mục. |

Các số đo là điểm bắt đầu khi dựng, không phải lý do để ép nội dung dài tràn khung. Đặc biệt không cố nhét cả trang vào một màn hình ngắn.

## 3. Điểm tích hợp đã khảo sát

| File hiện có | Vai trò / lưu ý |
| --- | --- |
| `src/data/templates/template-manifest.ts` | Kiểu manifest, dữ liệu demo; hỗ trợ `heroImageCount: 1`. |
| `scripts/register-template-manifests.ts` | Sinh registry; yêu cầu tên manifest khớp slug và renderer tồn tại. Không sửa tay generated registry. |
| `src/components/chungdoi-tpl-nguyet-bach.tsx` | Hiện là cấu hình cho `ArtInvitation`; không đủ để thể hiện layout mới chỉ bằng đổi màu. |
| `src/components/chungdoi-tpl-song-hy.tsx` | Tham khảo cách dùng helpers cho ảnh, gia đình, lịch, quà; không sao chép hardcoded copy hoặc inline style từ mẫu cũ. |
| `src/components/chungdoi-tpl-shared.tsx` | Các helper lịch, ảnh, bản đồ, QR và lightbox; đọc đúng export cần dùng. |
| `src/lib/invitation-display.ts` | `orderedCouple`, `orderByBrideFirst`, `invitationHeroImage`, `invitationCeremonies`, `invitationGiftAccounts`. |
| `src/components/chungdoi-live-forms.tsx` | Binding form lời chúc; tái sử dụng xử lý thật. |
| `src/components/chungdoi-demo.tsx` | Shell và luồng mở bìa hiện tại. Grep vùng cần sửa, không đọc cả file. |
| `src/data/templates/opening-effect.ts` | Validator art hiện bắt 3–4 lớp, 1300–1500ms. Không tương thích trực tiếp bìa liền 650–800ms. |
| `src/data/chungdoi-gift-visuals.ts` | Phân giải artwork quà; không để slug mới rơi vào generic fallback. |
| `src/components/chungdoi-gift-envelope-artwork.tsx` | Biến thể hiện có có sparkle/bob/mirror; không phù hợp nguyên trạng với hai bao đứng mặt trước. |
| `messages/vi.json` | Tìm namespace phù hợp rồi thêm copy; không hardcode chuỗi giao diện mới. |
| `scripts/seed-demos.ts` | Có `--missing --only=<slug>` để seed giới hạn. |

Không đọc guide Next cho styling/component nội bộ. Chỉ khi thực sự dùng Next API mới mà repo không có ví dụ, đọc đúng guide liên quan trong `node_modules/next/dist/docs/`.

## 4. Thứ tự triển khai

`T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14`

Các phần trong T06–T09 có thể thực hiện theo từng section sau khi chốt layout, nhưng cần đối chiếu phần liền trước/sau để giữ nhịp trang. Đây là thứ tự công việc, không phải yêu cầu spawn agent.

### T01 — Chốt bản chuẩn và rà asset

- [ ] Kiểm tra git status, slug `hy-uoc`, manifest và renderer có trùng không.
- [ ] Lưu ba hình concept đúng vòng duyệt vào `docs/research/hy-uoc/approved/`, ghi nguồn và ngày.
- [ ] Đọc bảng asset; mở kiểm tra WebP/SVG trên cả nền đỏ và kem ở cỡ mobile.
- [ ] Ghi rõ hoa góc có nét dày hơn concept: chọn opacity/scale bằng mắt, không coi alpha là bằng chứng đẹp.
- [ ] Mặt trước/sau phong bao là ảnh chữ nhật full-bleed 971×1619, không có alpha; không dùng bản lỗi nền caro.
- [ ] Chọn ảnh demo có sẵn, kiểm tra file tồn tại và crop hợp với vòm; không biến ảnh AI minh họa thành ảnh người dùng.

**Đầu ra:** ghi chú `docs/research/hy-uoc.md` có bảng nguồn/bằng chứng và danh sách asset sử dụng thực tế.

**Đạt khi:** không thiếu asset cho bìa, ảnh đầu, quà; mọi ảnh có vai trò cụ thể. Mặt sau và nắp phong bao ghi là dự phòng, không tải mặc định.

### T02 — Thiết kế chi tiết các section chưa được duyệt hình

- [ ] Dựng bản xem trước phần gia đình, lễ/tiệc, lịch, album, lịch trình/địa điểm, trang phục, lời chúc và footer.
- [ ] Dùng chung 17 asset, typography và màu đã chốt; không tự thêm một concept hoa/khung khác.
- [ ] Chốt nhịp nền kem → dải đỏ quan trọng → nền kem, khoảng cách và độ lớn tiêu đề.
- [ ] Trình bày ảnh từng section đủ lớn để người dùng duyệt; ghi các chỉnh sửa được yêu cầu trước khi hoàn thiện phần đó.

**Đạt khi:** toàn bộ trang có hướng thị giác reviewable, không lấy sự đồng ý với ba hình đầu làm duyệt ngầm mọi section còn lại.

### T03 — Tạo renderer, manifest và dữ liệu nền

- [ ] Tạo `src/components/chungdoi-tpl-hy-uoc.tsx` với named export `HyUocInvitation`, nhận kiểu content hiện có.
- [ ] Tạo `src/data/templates/hy-uoc.manifest.ts` theo schema thật; đặt `heroImageCount: 1`.
- [ ] Khai báo đủ asset public thực sự dùng và dữ liệu demo có file ảnh tồn tại; không dựa vào tên file giả định `.webp` nếu kho ảnh là `.jpg`.
- [ ] Thêm copy Vietnamese qua catalog/manifest pipeline hiện có; label nút, trạng thái lỗi và modal cũng phải dịch được.
- [ ] Tái sử dụng helper dữ liệu. Không tự parse tên/ngày/tài khoản khác quy ước hiện tại.
- [ ] Chạy `npm run templates:register` sau khi file cần thiết tồn tại; review diff generated, không sửa bằng tay.

**Đạt khi:** route demo mới render đúng renderer, không fallback ArtInvitation; Nguyệt Bạch và Song Hỷ không đổi ngoài ý muốn.

### T04 — Layout nền và typography

- [ ] Chọn font có sẵn hỗ trợ đầy đủ dấu Việt; ưu tiên kiểm tra Cormorant Garamond cho tên và Lora cho nội dung trước khi tải font mới.
- [ ] Dùng class Tailwind/CSS có scope Hỷ Ước, mobile-first, không `any`, không inline style mới.
- [ ] Khung thiệp desktop có max-width rõ; không phóng ảnh/hoa theo toàn viewport desktop.
- [ ] Nền paper-ivory theo section, tránh kéo một ảnh texture dọc toàn trang. Nền đỏ không có seam/vignette giả.
- [ ] Xác định parent của từng hoa/viền/nhãn; ghi width, aspect ratio, z-index, overflow vào research note.
- [ ] Tên hai bên cùng cỡ, `&` nhỏ ở dòng riêng; kiểm tra tên dài, thứ tự brideFirst và tên có dấu.

**Đạt khi:** desktop và mobile đọc rõ, không cuộn ngang, không chữ đè artwork. SVG viền không bị kéo méo để ép theo chiều cao nội dung.

### T05 — Bìa liền và luồng mở

- [ ] Ghép paper-red → hoa góc → cover-border → Hỷ kem → tên 3 dòng → ngày → nhãn khách → nút mở.
- [ ] Dữ liệu tên khách/tên đôi/ngày lấy từ thiệp; không nằm trong ảnh nền.
- [ ] Khảo sát nhánh mở tại shell trước khi sửa. Thêm kiểu/variant một mặt liền trong pipeline phù hợp; không ép qua validator art 3–4 lớp, không nới luật tất cả mẫu để lách riêng Hỷ Ước.
- [ ] Chỉ có một chủ thể quản lý đóng/mở. Không tạo bìa thứ hai trong renderer bên dưới bìa chung.
- [ ] Một lần click/Enter/Space mở cả bìa lên 650–800ms. Chặn kích hoạt lặp trong lúc chuyển động.
- [ ] Trong lúc đóng, nội dung sau bìa không nhận focus/click; mở xong trả quyền scroll/focus hợp lý. Không để overlay vô hình chặn trang.
- [ ] Mở nhạc theo cơ chế user gesture hiện có; không autoplay trước tương tác. Mặc định tắt tự cuộn, bỏ particle/burst cho riêng mẫu.
- [ ] Reduced-motion mở trực tiếp hoặc fade rất ngắn. Mở lại/reset nếu shell hỗ trợ phải về trạng thái hợp lệ.

**Đạt khi:** bìa không bị cắt giữa, không thấy tên tách đôi, không chờ thêm animation cũ. Quay video ngắn normal/reduced-motion; ảnh tĩnh không chứng minh hiệu ứng đạt.

### T06 — Đầu thiệp và hai gia đình

- [ ] Header Hỷ đỏ nhỏ, lời báo hỷ, tên 3 dòng.
- [ ] Chỉ một hero image, crop vòm cùng tỷ lệ frame; mục tiêu cao 260–300px mobile, khoảng 300–340px tính cả cụm viền/trang trí nếu cần.
- [ ] Hoa sprig đặt ở wrapper ảnh, không vượt che mặt người; điều chỉnh focal point bằng dữ liệu/cách crop phù hợp.
- [ ] Dải date-band có ngày và thứ thật; lời mời dưới dải.
- [ ] Hai gia đình cân nhau trên desktop; mobile chỉ giữ hai cột khi nội dung đủ chỗ, nếu dài thì xếp dọc có nhãn rõ.
- [ ] Kiểm tra thiếu ảnh, tắt hero, thiếu một thông tin phụ và tên cha mẹ dài.

**Đạt khi:** ảnh không nuốt nhiều màn hình; không render heroImage2; ngày/tên/gia đình chỉnh trong editor phản ánh đúng.

### T07 — Lễ, tiệc, lịch và thời gian

- [ ] Dùng danh sách lễ/sự kiện từ helper, phân biệt ngày giờ lễ và tiệc; không giả định luôn cùng ngày.
- [ ] Bố cục nền đỏ tập trung ở điểm quan trọng, có thứ bậc ngày → giờ → địa điểm.
- [ ] Lịch tháng nhỏ gọn; ngày cưới có nét riêng, mọi ô nằm trong khung với tháng 6 hàng.
- [ ] Countdown nếu bật phải dùng dữ liệu thời gian hiện có, xử lý đã đến ngày, không số âm hoặc hydration mismatch.
- [ ] Nút thêm lịch tạo đúng sự kiện/timezone theo pipeline hiện có; không dùng ngày demo cố định.

**Đạt khi:** kiểm tra tháng 11/2026 (6 hàng), ngày hiện tại/quá khứ và hai sự kiện khác ngày. Lịch không trở lại thành khối vuông quá lớn như Nguyệt Bạch.

### T08 — Album, lịch trình, địa điểm và trang phục

- [ ] Album có nhịp một ảnh ngang / hai ảnh nhỏ; ẩn mục khi không có ảnh.
- [ ] Dùng lightbox thật: mở, đóng, trước/sau, keyboard, mobile touch nếu shared hỗ trợ; không nút giả.
- [ ] Lịch trình dễ quét, không bắt mọi hàng cùng chiều cao khi nhãn dài.
- [ ] Địa chỉ và nút chỉ đường ở cùng cụm, bản đồ mở theo thao tác; không tải iframe ngay nếu chưa cần.
- [ ] Bản đồ lỗi vẫn đọc được địa chỉ và có link chỉ đường thật; không giấu lỗi chỉ để chụp preview.
- [ ] Trang phục chỉ hiện khi có dữ liệu; swatch và nhãn dễ hiểu, giữ contrast.

**Đạt khi:** album 0/1/nhiều ảnh đều hợp lệ, link đúng dữ liệu, địa chỉ dài không tràn, không khoảng trắng do mục trống.

### T09 — Sổ lưu bút và phản hồi tham dự hiện có

- [ ] Tái sử dụng binding form thật; trường nhập trên nền giấy ivory có label rõ, focus và nút đúng phong cách.
- [ ] Copy qua catalog, không chép chuỗi hardcoded từ renderer cũ.
- [ ] Xử lý required/max length, pending, thành công, lỗi mạng; giữ nội dung người dùng khi gửi lỗi.
- [ ] Danh sách lời chúc có bố cục mẩu thư gọn, tên dài/nội dung dài không tràn.
- [ ] Nếu flow hiện có hỗ trợ RSVP, giữ tính năng theo setting; không tạo thêm endpoint/schema khi chưa cần.
- [ ] Chỉ thử gửi ở local/test, dùng dữ liệu thử nhận diện được; không gửi vào thiệp người dùng thật.

**Đạt khi:** gửi/validation hoạt động thật, trạng thái nhìn được và truy cập bằng bàn phím; không chỉ có form đẹp nhưng không lưu.

### T10 — Hai phong bao mừng cưới và QR

- [ ] Dùng `invitationGiftAccounts` để lấy tài khoản/nhãn/thứ tự; hỗ trợ 0, 1 hoặc 2 tài khoản hợp lệ.
- [ ] Đăng ký artwork Hỷ Ước rõ ràng, hoặc thêm variant có scope trong resolver/component; không rơi vào procedural/generic fallback.
- [ ] Mỗi bao là một button độc lập, mặt trước cùng tỷ lệ, không sparkle/bob/mirror mặc định của variant cũ.
- [ ] Ghép envelope-front + Hỷ vàng + nameplate + tên thật; cân khoảng cách hai bao.
- [ ] Lớp mở: liner z0 → QR card z1 → mặt trước z2 → nhãn/Hỷ z3. Chừa vùng cho thẻ trượt; không animate nắp in sẵn trong ảnh envelope-back.
- [ ] Chạm bao mở đúng chủ tài khoản. Sau chuyển động ngắn, có dialog QR rộng đủ đọc, không buộc quét từ tờ thẻ 140px.
- [ ] QR qua helper/endpoint thật, nền trắng và quiet zone, không overlay hoa vào mã.
- [ ] Lưu QR và sao chép STK có trạng thái thành công/thất bại thật. Đóng bằng nút, Escape; focus trap và trả focus về bao đã mở.
- [ ] Không render QR trần trong trạng thái đóng. Không đổi qua mặt sau nếu không có lý do tương tác.
- [ ] Reduced-motion mở dialog trực tiếp. Tài khoản thiếu không tạo bao rỗng hoặc QR demo thay thế.

**Đạt khi:** mỗi bao mở đúng mã/tên/STK, đóng/mở lặp ổn định; kiểm tra 0/1/2 tài khoản, thiếu bank, lỗi tải QR và clipboard bị từ chối.

### T11 — Footer, editor và catalog

- [ ] Footer dùng lời cảm ơn, tên 3 dòng, Hỷ đỏ và hoa góc; không cắt artwork phía dưới.
- [ ] Kiểm tra editor: tên, thứ tự đôi bạn, ngày, sự kiện, ảnh đầu, album, ngân hàng, lời mời và các phần ẩn/hiện.
- [ ] Không tạo field ảnh đầu thứ hai cho mẫu có `heroImageCount: 1`; tìm đúng vùng EditorForm, không đọc/sửa lan toàn file.
- [ ] Mẫu xuất hiện trong catalog, chọn mẫu/editor và route published đúng pipeline hiện có.
- [ ] Nếu cần demo DB local, xác minh đang dùng DB local rồi seed riêng `hy-uoc` với `--missing --only=hy-uoc` qua runner hiện có của repo. Không seed toàn bộ.
- [ ] Kiểm tra demo row/admin nếu flow yêu cầu; public fallback HTTP 200 không chứng minh đã có row DB.

**Đạt khi:** dữ liệu chỉnh thật hiển thị đúng trên demo/editor/published local; không chỉ đẹp với dữ liệu mặc định.

### T12 — Nghiệm thu thị giác và tương tác

- [ ] Đối chiếu bìa, hero và phong bao với concept đã duyệt ở cùng viewport/trạng thái.
- [ ] Đối chiếu từng section còn lại với bản duyệt T02; chụp riêng section và phần liền kề.
- [ ] Mobile 390×844, mobile hẹp 320px, desktop 1440×900; thêm viewport nếu phát hiện breakpoint rủi ro.
- [ ] Đợi font/ảnh xong; không auto-scroll, zoom 100%; ghi vị trí scroll và trạng thái dialog.
- [ ] Kiểm tra tên dài, địa chỉ dài, tháng 6 hàng, album rỗng, nhiều lời chúc, mục tùy chọn trống, 0/1/2 tài khoản.
- [ ] Lưu screenshot/video vào `docs/research/hy-uoc/qa/`, ghi đúng đã kiểm tra / chưa kiểm tra / không áp dụng trong research note.
- [ ] Bất kỳ khác biệt với concept về hoa, viền, chất liệu hoặc tỷ lệ đều ghi rõ; không đánh dấu đạt vì lint pass.

**Đạt khi:** tất cả phần nhìn rõ và hoạt động, không overflow/ảnh hỏng/cắt footer; người dùng có bản local reviewable trước khi phát hành.

### T13 — Kiểm tra code, regression và preview cuối

- [ ] Chạy `npm run lint` trước, rồi `npm run typecheck`.
- [ ] Viết/chạy unit test cho logic mới có rủi ro: chọn opening variant, mapping gift hoặc điều kiện tài khoản. Không viết test chỉ lặp lại CSS.
- [ ] Tạo E2E có scope `tests/e2e/hy-uoc.spec.ts`: mở bìa một lần, hero một ảnh, đúng tài khoản QR, close/focus, reduced-motion và không overflow.
- [ ] Chạy spec mới và các test opening/gift liên quan trực tiếp nếu sửa shared; không chạy toàn bộ E2E mặc định.
- [ ] Regression trên Nguyệt Bạch, Song Hỷ Đỏ và một mẫu art dùng 3–4 lớp nếu chạm shared opening.
- [ ] Kiểm tra tải trang: ưu tiên hero/bìa cần thiết, lazy album/bản đồ/quà; không tải master PNG, mặt sau/nắp dự phòng ngay đầu.
- [ ] Chạy `npm run check` một lần làm gate cuối sau các bước rẻ; build local dùng `build:local`, không sửa lỗi localhost có chủ ý của `npm run build`.
- [ ] Chụp preview catalog từ bản chạy cuối, cập nhật qua pipeline hiện có; không dùng ảnh concept AI làm ảnh chụp sản phẩm.
- [ ] Review git diff, ghi lệnh đã chạy/kết quả/lỗi có sẵn và giới hạn còn lại.

**Đạt khi:** gate cần thiết pass hoặc lỗi môi trường có bằng chứng và được báo riêng; preview phản ánh sản phẩm thật, không có dev tools/map error bị che.

### T14 — Phát hành khi được yêu cầu

- [ ] Người dùng nghiệm thu bản local; nếu còn yêu cầu chỉnh thì quay lại task liên quan.
- [ ] Khi có yêu cầu deploy, đọc `docs/deploy-vps.md`, dùng VPS hiện tại, không dùng minipc đã nghỉ.
- [ ] Backup đúng quy trình, xác minh đủ dung lượng trước build và chạy pipeline deploy hiện có.
- [ ] Seed demo production giới hạn `--missing --only=hy-uoc` qua runtime đúng sau backup; không ghi đè các demo khác.
- [ ] Kiểm tra catalog, demo public, admin demo row (`isDemo=true`), editor và một published invitation phù hợp.
- [ ] Ghi URL, phiên bản deploy, smoke result và mọi giới hạn còn lại.

**Đạt khi:** sản phẩm và demo row cùng tồn tại trên production, không chỉ public fallback trả 200.

## 5. Checklist bàn giao

- [ ] Manifest/renderer riêng Hỷ Ước, copy qua catalog.
- [ ] Bìa liền mặt, mở ngắn, không tự cuộn hoặc hiệu ứng thừa.
- [ ] Tên ba dòng cân đối; hero chỉ một ảnh vừa phải.
- [ ] Các section trong thiệp đã được duyệt hình và đối chiếu.
- [ ] Phong bao mặt trước, QR ẩn khi đóng, thao tác thật và truy cập được.
- [ ] Editor/dữ liệu thật hoạt động, nội dung dài và mục trống không vỡ.
- [ ] Evidence desktop/mobile/animation; không có mục chưa kiểm tra bị đánh dấu đạt.
- [ ] Kiểm tra code/regression cần thiết hoàn tất; preview cuối đúng.
- [ ] Báo rõ local complete hay đã deploy; không nhập hai trạng thái thành một.

## 6. Quy tắc cập nhật tài liệu khi làm

Tick task chỉ sau khi đủ đầu ra và tiêu chí đạt. Sau mỗi nhóm việc, cập nhật `docs/research/hy-uoc.md` với file đã đổi, bằng chứng, kiểm tra và điểm còn mở. Khi người dùng đổi thiết kế, cập nhật yêu cầu chuẩn ở mục 2 trước khi tiếp tục; không giữ hai chỉ dẫn mâu thuẫn về bìa/phong bao. Không đánh dấu T02–T14 hoàn thành từ việc đã tạo đủ asset.
