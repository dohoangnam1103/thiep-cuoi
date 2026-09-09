# Hoa Mai Thủy Mặc — Design Specification

Ngày lập: 2026-09-08

## Mục tiêu

Tạo một mẫu thiệp cưới mới mang chất liệu giấy thủ công, hoa mai vàng màu nước và phong cảnh thủy mặc Việt Nam. Trên mọi viewport, nội dung đi theo đúng một trục dọc ở giữa; không chuyển thành hai cột trên desktop.

Mục tiêu nghiệm thu là 92% độ giống cảm nhận so với tám ảnh concept đã duyệt, đồng thời giữ toàn bộ chức năng thiệp hiện tại.

## Nguồn hình ảnh đã duyệt

1. Bìa mở thiệp: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-34bf29ec-231e-4e88-af1b-b8c843ba3127.png`
2. Gia đình và lễ cưới: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-f14d4162-d0bd-453e-9233-db8158c2103d.png`
3. Chuyện đôi mình: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-ed0bd874-9964-4902-b9ba-50fe2d6dede1.png`
4. Album và lightbox: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-8b4a503d-3805-4f0c-bc77-c6bb13ada24e.png`
5. Lịch, lịch trình và dress code: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-b91901ef-169d-4637-86e6-3953059038dd.png`
6. Địa điểm và bản đồ: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-50a78f47-f064-49ff-bb4a-b82935ac3333.png`
7. Lời chúc: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-4a28bd20-21af-4917-a0a3-7d0d8cdb4f76.png`
8. Phong bao, QR và footer: `/Users/namdo/.codex/generated_images/01a07f13-1db8-7f32-a268-87e81720389a/exec-a1a3a77c-ddcf-458b-9108-afa8a16f6afe.png`

Các ảnh đều có kích thước 1672×941 và là nguồn art direction desktop. Cần tạo thêm reference dọc cho 390px, cùng reference RSVP và trạng thái modal trước khi code chi tiết.

## Thứ tự ưu tiên hình ảnh

1. Nền giấy phải có sợi giấy và biến thiên sắc độ tự nhiên, không nhìn thấy đường nối hoặc ô lặp.
2. Hoa mai phải giống màu nước thật: cánh có vùng loang, nhụy có nét cọ, lá không đều màu, cành có biên khô và mực đậm nhạt.
3. Phong cảnh thủy mặc phải nằm sau nội dung, tạo chiều sâu nhưng không làm giảm độ đọc.
4. Typography và khoảng thở phải giữ sự trang trọng, thanh thoát của concept.
5. Chuyển động chỉ hỗ trợ cảm giác giấy và cánh hoa; không làm nội dung rung, trôi hoặc khó đọc.

## Hệ thống nền giấy

- Màu nền gốc: `#F3E9D7`.
- Tile giấy: 768×768, seamless cả hai trục, WebP, không có hoa, chữ, vệt tối lớn hoặc viền khung.
- Độ tương phản texture khi hiển thị: không quá 8% so với màu nền gốc.
- CSS dùng màu nền cộng một lớp tile ở opacity 0.42–0.58; không dùng một ảnh chụp 1672×941 làm nền trang.
- Các section dùng chung tile để trang liền mạch. Chỉ lớp thủy mặc và hoa thay đổi theo section.
- Vùng giữa rộng 760px phải đủ sạch để đọc chữ. Cụm hoa và núi không được đi vào vùng an toàn 64px quanh text hoặc control.

## Bộ asset hoa mai và thủy mặc

Các foreground phải có alpha thật, không nền trắng hoặc viền halo:

| Asset | Kích thước nguồn tối thiểu | Vai trò |
|---|---:|---|
| `paper-tile.webp` | 768×768 | Texture giấy seamless |
| `wash-mountains-wide.webp` | 2400×900 | Núi xa cho hero và section thông tin |
| `wash-river-wide.webp` | 2400×1100 | Sông, làng và cầu cho map/footer |
| `mai-branch-canopy.webp` | 1800×900 | Cành hoa ngang ở bìa/footer |
| `mai-branch-left.webp` | 1200×1400 | Cành đi từ góc trái |
| `mai-branch-right.webp` | 1200×1400 | Cành đi từ góc phải, không lật máy móc từ ảnh trái |
| `mai-cluster-round.webp` | 1000×1000 | Cụm hoa tròn cho divider/section |
| `mai-divider.webp` | 1000×220 | Divider hoa nhỏ giữa nội dung |
| `petals.webp` | 1000×1000 | Nhiều cánh rời, dùng làm sprite trang trí |
| `gift-envelope.webp` | 900×900 | Phong bao màu nước đóng |

Bộ bìa mở dùng một plate và 3–4 lớp đúng hợp đồng `ArtOpeningEffect`: `cover-plate.webp`, `cover-branch-left.webp`, `cover-branch-right.webp`, `cover-seal.webp`, tùy chọn `cover-petals.webp`; metadata nằm trong `opening-assets.json`.

Không dùng cùng một cành rồi lật ngang cho mọi vị trí. Ít nhất ba silhouette phải khác nhau rõ ràng. Mỗi asset hoa phải kết thúc tự nhiên bằng lá, nụ hoặc đầu cành; không để cạnh canvas cắt vuông.

## Màu và chữ

- Ink: `#3E241D`.
- Terracotta: `#A95231`.
- Mai gold: `#DFAE37`.
- Sage: `#7A8972`.
- Wash green: `#A8B6A3`.
- Display: `Cormorant Garamond`.
- Body: `Lora`.
- Chữ ghi chú bên lề dùng Lora italic để giữ đúng hai font family.

Tên đôi trên mobile phải vừa trong tối đa hai dòng, không cắt giữa từ. Nội dung thân bài tối thiểu 15px ở 390px và 14px ở 320px.

## Bố cục

- Mỗi section rộng toàn viewport để chứa tranh nền.
- Nội dung tương tác nằm trong `.contentRail` rộng tối đa 760px.
- Gia đình nhà trai, tên đôi và nhà gái xếp dọc.
- Album chỉ hiển thị một ảnh lớn tại một thời điểm; nút trước/sau và chỉ số nằm dưới ảnh.
- Calendar, lịch trình và dress code xếp dọc trong cùng section.
- Bản đồ nằm dưới tiêu đề, thời gian và địa chỉ; không đặt cạnh khối thông tin.
- Lời chúc, RSVP, QR cô dâu và QR chú rể đều xếp dọc.
- Desktop không có `grid-template-columns: repeat(2, ...)` cho các khối nội dung chính.

## Nội dung và chức năng

Mẫu phải hiển thị dữ liệu hiện có cho tên, thứ tự sinh, cha mẹ, địa chỉ, ngày giờ, nhiều lễ, lịch trình, album, dress code, bản đồ, lời chúc, tài khoản ngân hàng và nhạc. Manifest dùng `ceremonyRendering: "inline-all"`; renderer gọi `invitationCeremonies(content)` và `.map(...)` ngay trong section lễ.

Giữ các chức năng: mở thiệp, nhạc, tự cuộn, thêm vào lịch, carousel/lightbox có zoom, chỉ đường, RSVP, gửi lời chúc, guest media và mở/đóng modal QR. Bản đồ thật tiếp tục dùng Google Maps iframe; chỉ khung và vùng xung quanh mang phong cách màu nước.

Concept chưa có trường nội dung “chuyện đôi mình” trong dữ liệu thiệp. Phiên bản đầu dùng câu template-specific từ `messages/vi.json`, kết hợp tên và thứ tự sinh động. Không thêm migration hoặc trường editor mới trong phạm vi này.

## Responsive và chuyển động

- Viewport nghiệm thu: 1440×900, 768×1024, 390×844 và 320×568.
- Ở 390px và 320px, cành hoa nằm trong vùng riêng hoặc sát biên; không phủ lên text/form/nút nổi.
- Không tràn ngang tại bất kỳ viewport nào.
- Petal motion dùng transform/opacity và tối đa tám phần tử cùng lúc.
- `prefers-reduced-motion` tắt cánh rơi, parallax và rút ngắn hiệu ứng mở thiệp theo hợp đồng hiện có.
- Ảnh upload dọc, ngang và nhỏ đều nằm trong khung ổn định bằng `object-fit: cover`; lightbox dùng `object-fit: contain`.

## Tiêu chí nghiệm thu

- Nền giấy nhìn tự nhiên ở 100% và 200% zoom, không thấy seam trong ảnh full-page.
- Hoa mai có alpha sạch, không halo sáng, không bị cắt vuông và không che vùng nội dung.
- Cảm nhận màu nước đạt ít nhất 4/5 ở review thủ công cho bìa, hero, calendar, map và footer.
- Bố cục một cột ở cả bốn viewport.
- Hai nghi lễ thử nghiệm xuất hiện trong cùng section native.
- Mọi tương tác nêu trên hoạt động bằng bàn phím và pointer.
- `npm run lint`, `npm run typecheck`, `npm run typecheck:tests`, unit test mục tiêu, E2E mục tiêu và `npm run build:local` đều đạt.

