# Thư Tình Bordeaux — Romantic Bordeaux Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng mẫu thiệp `romantic-bordeaux` (tên hiển thị: **Thư Tình Bordeaux**) lấy những yếu tố đang làm Romantic Đỏ hấp dẫn — nền giấy ấm, đỏ rượu vang, ảnh cưới trong vật phẩm giấy, chữ serif trang trọng và chuyển động mở thiệp — nhưng tạo một ngôn ngữ riêng bằng thư gấp, giấy can, dấu bưu điện và bố cục editorial. Mẫu phải giữ đủ luồng dữ liệu/chức năng của thiệp hiện tại và đạt tối thiểu 92% điểm cảm nhận so với art direction đã khóa.

**Architecture:** Dùng một bespoke client renderer `RomanticBordeauxInvitation` với content rail tối đa 760px, các section full-width để chứa texture/artwork, và các primitive tương tác dùng chung từ `chungdoi-tpl-shared.tsx`. Bìa mở dùng `ArtOpeningEffect` gồm plate + các layer alpha; gift dùng `GiftEnvelope` với artwork riêng. Manifest là nguồn sự thật duy nhất cho catalog, route, theme, demo content và asset list; registry sinh bằng registrar, không sửa tay.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, CSS Modules, next-intl, Sharp, node:test/tsx, Playwright, Prisma 7/SQLite.

**Reference:** [Romantic Đỏ demo](https://thiepmungonline.com/mau-thiep/romantic-do/demo). Trang danh mục mô tả mẫu tham chiếu bằng nền kem, sắc đỏ đô, hoa mẫu đơn và phong bì lồng ảnh; luồng demo còn có mở thiệp, album, lịch, bản đồ, RSVP/sổ lưu bút và QR mừng cưới. Tham chiếu chỉ dùng để nghiên cứu bố cục và cảm giác; không sao chép pixel hoặc tải artwork của website nguồn.

## Quyết định sản phẩm

### Vì sao mẫu mới không chỉ là một palette khác

Repo đã có `minimalism-dark-red`, `maroon-love`, `hong-van-rose`, `crystal-floral-red`, `to-hong` và các mẫu phong bì đỏ. Vì vậy bản mới phải thay đổi vật liệu và nhịp kể chuyện:

- Bìa là **lá thư gấp rút ra khỏi sleeve giấy can**, thay cho phong bì đỏ thông thường.
- Hero có một ảnh cưới dạng ảnh in dán vào thư, monogram và dấu bưu điện; không dùng lâu đài watermark của Romantic Đỏ.
- Detail xen kẽ giấy mở, dải đỏ rượu và đường dập chìm; không biến mọi section thành card bo góc cùng một kiểu.
- Album là một ảnh nổi bật kèm dải “contact print” và lightbox; không mặc định dùng coverflow.
- Timeline dùng dấu bưu điện/perforation làm trục; lịch dùng dấu sáp nhỏ cho ngày cưới.

### Tên và route

| Ý nghĩa | Giá trị |
|---|---|
| Source slug | `romantic-bordeaux` |
| Vietnamese route slug | `thu-tinh-bordeaux` |
| Renderer export | `RomanticBordeauxInvitation` |
| Catalog name | `Thư Tình Bordeaux` |
| Category | `Modern` |
| Color | `Red` |
| Ceremony mode | `inline-all` |
| Hero image count | `1` |

Không dùng `romantic-do` làm alias cho mẫu mới. URL đó là tên tham chiếu bên ngoài; slug nội bộ hiện tại của mẫu tham chiếu là `minimalism-dark-red`.

## Art direction contract

| Hạng mục | Quy ước phải khóa trước khi code |
|---|---|
| Nền | Ivory `#F5EBDD`, texture giấy mịn dưới 8% tương phản, không vignette nặng |
| Màu chính | Oxblood `#5A1018`, wine `#7A2732` |
| Màu phụ | Blush `#D4A0A1`, champagne `#C6A15B`, ink `#2F1C1A` |
| Chữ | Display `Cormorant Garamond`; body `Lora`; accent viết tay `The Nautigal` chỉ cho một vài nhãn ngắn |
| Bề mặt | Giấy can, giấy mỹ thuật, mép rách nhẹ, dấu mực; không dùng gradient bóng kiểu dashboard |
| Hero | Ảnh 3:4 trong khung giấy trắng, đặt trên lá thư; sleeve đỏ rượu phía sau; dấu monogram ở vùng nút |
| Hoa | Cành peony/rose nguyên bản, alpha sạch, mỗi bên một silhouette khác nhau; không lật ngang máy móc |
| Motion | Sleeve mở/rút thư 1.3–1.5s; seal nhấc nhẹ; cánh rơi tối đa 8 phần tử; tắt bằng reduced motion |
| Layout | Một content rail; family có thể chia hai cột ở desktop và xếp dọc ở mobile; các section nội dung chính không chia hai cột |
| Vùng an toàn | Không artwork trong vùng 64px quanh tên, ngày, nút nổi, input, khuôn mặt và QR |

### Thứ tự nội dung sau khi mở

1. Hero thư tình và tên đôi.
2. Hai họ + toàn bộ nghi lễ trong một section native.
3. Một đoạn “chuyện chúng mình” lấy từ copy catalog, không thêm field database.
4. Album contact-print + lightbox.
5. Thông tin tiệc, countdown, calendar.
6. Địa điểm, bản đồ và chỉ đường.
7. Dress code và timeline dạng perforation.
8. RSVP, sổ lưu bút và danh sách lời chúc.
9. Hộp quà mừng, QR modal và footer.

## Global constraints

- Đọc và áp dụng toàn bộ checklist trong [`docs/template-clone-quality.md`](../../template-clone-quality.md) trước khi implementation; phải kiểm tra cover, hero, calendar, album, map, guestbook, gift và footer ở desktop/mobile.
- Giữ mọi thay đổi chưa commit trong working tree; không reset, checkout hoặc format lan sang file không thuộc mẫu mới.
- Vietnamese là locale indexable duy nhất hiện tại. Copy mới đi qua `messages/vi.json` và `useTranslations("invitationTemplate")`; không tạo giả bản dịch cho các locale đã bỏ.
- Renderer mới không dùng `style={` cho artwork, màu hoặc typography của chính nó. Dùng Tailwind/CSS Module; shared primitive có inline implementation thì không nhân bản lại trong renderer.
- Không sửa `src/generated/prisma/**`, không thêm migration và không thêm trường editor cho “chuyện chúng mình”.
- Mọi artwork mới phải là asset nguyên bản được tạo/biên tập trong project hoặc nguồn có license rõ ràng. Website tham chiếu chỉ là mood/layout reference.
- Manifest và renderer phải khai cùng `ceremonyRendering: "inline-all"`. Renderer bắt buộc gọi `invitationCeremonies(content)` và `.map(...)` trong section lễ; fixture kiểm thử có ít nhất hai lễ khác `title`, `date`, `time`.
- Không để QR lộ trên mặt trước phong bao; click/keyboard mới mở modal, modal khóa cuộn nền và trả focus khi đóng.
- Bìa và detail phải dùng containing block đo được; không dùng phần trăm tính theo toàn trang để chữa sai tỷ lệ artwork.
- Viewport nghiệm thu: `1440×900`, `768×1024`, `390×844`, `320×568`; thử tên dài, địa chỉ ba dòng, ảnh dọc/ngang/nhỏ, lịch sáu hàng, nhiều lời chúc và thiếu một tài khoản ngân hàng.
- Capture preview phải dùng `--no-sync-production`; tuyệt đối không chạy script có thể xóa demo local mà không có cờ này.

## Dependency và thứ tự thực thi

| Stage | Task | Phụ thuộc | Đầu ra kiểm tra được |
|---|---|---|---|
| 0 | Reference + spec | Không | research note, số đo, asset matrix |
| 1 | Artwork production | Stage 0 | artwork WebP/RGBA, metadata và provenance |
| 2 | Opening + gift | Stage 1 | opening manifest, motion, gift visual tests |
| 3 | Renderer foundation | Stage 1–2 | skeleton một cột, source contract |
| 4 | Nội dung và chức năng | Stage 3 | renderer hoàn chỉnh, unit contract |
| 5 | Manifest/registrar | Stage 4 | catalog/route/demo/registry |
| 6 | E2E + visual critic | Stage 5 | screenshot matrix, visual review |
| 7 | Preview + seed + rollout | Stage 6 | ba preview, demo row, smoke evidence |

Stage 1 có thể sản xuất song song plate/flower/gift sau khi art direction khóa. Stage 3–4 phải chờ asset contract pass; registrar chỉ chạy sau khi renderer và manifest hoàn chỉnh.

## File map

**Create**

- `docs/research/romantic-bordeaux/reference.md`: URL, ngày khảo sát, viewport, trạng thái tương tác, containing block và khác biệt với mẫu hiện có.
- `docs/research/romantic-bordeaux/design-spec.md`: palette, typography, section order, safe zones, asset matrix và acceptance thresholds.
- `docs/research/romantic-bordeaux/asset-provenance.md`: prompt/nguồn, license, kích thước, alpha, bytes, SHA-256 và vai trò từng asset.
- `docs/research/romantic-bordeaux/visual-review.md`: bảng screenshot, điểm critic, khác biệt chưa xác minh và kết quả gate.
- `public/chungdoi/images/themes/romantic-bordeaux/paper-tile.webp`: tile giấy seamless.
- `public/chungdoi/images/themes/romantic-bordeaux/letter-paper.webp`: giấy thư/texture detail.
- `public/chungdoi/images/themes/_decor/romantic-bordeaux/artwork.webp`: plate detail tĩnh cho hero.
- `public/chungdoi/images/themes/_decor/romantic-bordeaux/opening-plate.webp`: plate cover.
- `public/chungdoi/images/themes/_decor/romantic-bordeaux/opening-*.webp`: layer alpha của sleeve, thư, seal và dấu bưu điện.
- `public/chungdoi/images/themes/_decor/romantic-bordeaux/opening-assets.json`: canvas và rect layer sinh bởi prepare script.
- `public/chungdoi/images/themes/romantic-bordeaux/{flower-left,flower-right,flower-divider,postmark}.webp`: artwork detail alpha.
- `public/chungdoi/images/envelope/romantic_bordeaux.webp`: phong bao quà mừng riêng.
- `src/components/chungdoi-tpl-romantic-bordeaux.tsx`: renderer bespoke.
- `src/components/chungdoi-romantic-bordeaux.module.css`: layout, texture, artwork containing blocks và responsive rules.
- `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`: source/asset/ceremony contract.
- `src/data/templates/romantic-bordeaux.manifest.ts`: manifest tự chứa.
- `tests/e2e/romantic-bordeaux.spec.ts`: hành trình demo desktop/mobile.

**Modify**

- `scripts/validate-opening-effect-assets.ts`: allowlist/validator nếu cần cho slug mới.
- `src/data/templates/art-opening-effects.ts`: import `opening-assets.json` và motion entry.
- `src/data/chungdoi-gift-visuals.ts`: ánh xạ `romantic-bordeaux` tới phong bao riêng.
- `src/data/templates/opening-effect.test.ts`: duration/layer/reduced-motion contract.
- `src/data/chungdoi-gift-visuals.test.ts`: asset gift contract nếu test hiện tại chưa bao phủ.
- `messages/vi.json`: namespace copy template-specific; chỉ thêm key còn thiếu.
- `src/data/templates/generated-data.ts`: sinh bởi `npm run templates:register`, không sửa tay.
- `src/components/generated/template-renderers.tsx`: sinh bởi registrar, không sửa tay.
- `src/data/template-preview-version.ts`: sinh bởi capture script.

## Task 1: Khảo sát reference và khóa art direction

**Files:**

- Create: `docs/research/romantic-bordeaux/reference.md`
- Create: `docs/research/romantic-bordeaux/design-spec.md`
- Create: `docs/research/romantic-bordeaux/asset-provenance.md`

**Interfaces:**

- Consumes: demo external, preview local `minimalism_darkred`, checklist `docs/template-clone-quality.md`.
- Produces: bảng đo và quyết định hình ảnh cho Task 2–8.

- [ ] **Step 1: Chụp reference theo trạng thái**

  Ghi riêng cover đóng, sau khi mở, hero, family/ceremony, album, calendar, map, dress code, timeline, guestbook, gift đóng, gift modal và footer ở desktop và mobile. Mỗi ảnh ghi viewport, zoom, thời điểm animation và URL.

- [ ] **Step 2: Đo containing block**

  Ghi parent, width/height, padding, offset, z-index, tỷ lệ ảnh và vùng an toàn chữ cho phong bì, ảnh hero, hoa, calendar, gift và footer. Không suy ra vị trí từ phần trăm của screenshot.

- [ ] **Step 3: Lập bảng khác biệt**

  So sánh `minimalism-dark-red`, `maroon-love`, `hong-van-rose`, `to-hong` và `phong-thu-*`; xác nhận mẫu mới có ít nhất ba khác biệt có thể nhìn thấy: vật liệu thư can, postmark/perforation, album editorial.

- [ ] **Step 4: Khóa spec**

  Ghi palette, font, safe zones, canvas mở `1600×1000`, target file size, breakpoint `768px`, reduced-motion `180ms`, và mục tiêu critic: độc bản ≥4/5, hoàn thiện ≥4/5, trung thực concept ≥4/5, bán được ≥3/5.

- [ ] **Step 5: Review spec trước khi làm asset**

  Dùng `view_image` mở các reference đã lưu; nếu reference external không tải được ở một trạng thái, ghi `chưa kiểm tra` và không đánh dấu pass. Không tiếp tục nhân bản artwork khi containing block hoặc vùng an toàn còn mơ hồ.

## Task 2: Sản xuất và kiểm định asset gốc

**Files:**

- Create: các file trong `public/chungdoi/images/themes/romantic-bordeaux/` và `_decor/romantic-bordeaux/` đã liệt kê ở file map.
- Create: `scripts/generate-romantic-bordeaux-artwork.mjs` nếu cần để chuyển nguồn sang WebP/alpha.
- Modify: `docs/research/romantic-bordeaux/asset-provenance.md`.
- Create/modify: `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`.

**Asset contract:**

- `paper-tile.webp`: 768×768, seamless hai trục, WebP, dưới 180KB.
- `artwork.webp`: tối thiểu 1600×1000, không chứa chữ, UI hoặc tên mẫu.
- `flower-left.webp`, `flower-right.webp`, `flower-divider.webp`, `postmark.webp`: RGBA, alpha thật, không halo trắng, mép kết thúc tự nhiên.
- Opening plate/layer: cùng canvas 1600×1000; tối đa bốn layer (`sleeve-flap`, `letter-card`, `wax-seal`, `postmark-ink`), mỗi file dưới 900KB.
- `romantic_bordeaux.webp`: 900×900 hoặc tỷ lệ tương đương, mặt trước che QR, không dùng artwork generic.

- [ ] **Step 1: Tạo artwork nguyên bản**

  Dùng ImageGen hoặc SVG/Sharp nội bộ với prompt không chữ: giấy can, sleeve đỏ rượu, hoa peony/rose, dấu bưu điện và monogram trừu tượng. Tạo trái/phải thành hai silhouette khác nhau; không mirror một ảnh.

- [ ] **Step 2: Tạo plate và layer opening**

  Plate chứa giấy, khung thư và vùng ảnh trống. Layer alpha chỉ chứa phần chuyển động. Không đặt text tên đôi trong artwork để nội dung vẫn chỉnh sửa được.

- [ ] **Step 3: Chuẩn hóa WebP và metadata**

  Dùng Sharp, giữ alpha, resize theo spec, ghi bytes/sha256/dimensions vào provenance. Kiểm tra `naturalWidth` và alpha bbox trước khi renderer dùng asset.

- [ ] **Step 4: Viết asset contract test**

  Assert mọi file tồn tại, đúng format, đúng kích thước tối thiểu, layer có alpha và không vượt ngưỡng bytes. Test phải báo tên file cụ thể khi fail.

- [ ] **Step 5: Review nền đen/nền giấy**

  Mở từng foreground trên nền đen và `#F5EBDD`; từ chối asset có viền trắng, canvas cắt vuông, chữ giả hoặc hướng sáng không nhất quán. Ghi kết quả vào provenance.

## Task 3: Opening effect và gift visual

**Files:**

- Modify: `src/data/templates/art-opening-effects.ts`
- Modify: `src/data/chungdoi-gift-visuals.ts`
- Modify: `src/data/templates/opening-effect.test.ts`
- Modify/create: `src/data/chungdoi-gift-visuals.test.ts`

- [ ] **Step 1: Viết test đỏ trước**

  Thêm assertion cho `romantic-bordeaux`: duration trong khoảng 1300–1500ms, đúng layer ids, reduced motion 180ms, gift visual là `layered-image` và asset không phải fallback.

- [ ] **Step 2: Đăng ký motion**

  Dùng `createArtOpeningEffect` với duration mục tiêu 1420ms. Sleeve flap rút lên, letter card trượt theo trục dọc, seal nhấc và postmark mờ dần; origin của mỗi layer phải khớp containing block đã đo. Không animate layout của detail page.

- [ ] **Step 3: Đăng ký gift visual**

  Thêm `romantic-bordeaux` vào `sourceGiftVisuals` với `/chungdoi/images/envelope/romantic_bordeaux.webp`. Nếu dùng `artworkVariant="source"`, kiểm tra kích thước và trạng thái mặt đóng trước khi mở modal.

- [ ] **Step 4: Chạy validator**

  ```bash
  npx tsx --test src/data/templates/opening-effect.test.ts src/data/chungdoi-gift-visuals.test.ts
  npm run templates:validate-opening-assets -- --slugs romantic-bordeaux
  ```

  Expected: mọi layer có rect hợp lệ trong canvas; reduced motion và asset gift pass.

## Task 4: Dựng renderer foundation một cột

**Files:**

- Create: `src/components/chungdoi-tpl-romantic-bordeaux.tsx`
- Create: `src/components/chungdoi-romantic-bordeaux.module.css`
- Create/modify: `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`

- [ ] **Step 1: Viết source contract test**

  Assert export đúng signature, có `useTranslations("invitationTemplate")`, root/data markers, `.contentRail`, không có `style={` hoặc `grid-template-columns: repeat(2`, và không hardcode copy mới ngoài test ids/aria cần thiết.

- [ ] **Step 2: Dựng skeleton**

  Tạo root `data-romantic-bordeaux-template`, helper `Section`, `SectionHeading`, `ArtworkLayer` và content rail `width: min(100% - 32px, 760px)`. Section nền full-width; artwork absolute phải nằm trong containing block riêng.

- [ ] **Step 3: Áp texture và typography**

  Dùng CSS Module cho paper tile, letter edge, perforation và motion. Tên/heading dùng font display; body tối thiểu 15px ở 390px và 14px ở 320px. Tắt petal/parallax trong `prefers-reduced-motion`.

- [ ] **Step 4: Chạy test foundation**

  ```bash
  npx tsx --test src/components/chungdoi-tpl-romantic-bordeaux.test.ts
  npm run typecheck
  ```

## Task 5: Hero, hai họ, nhiều lễ và chuyện đôi mình

**Files:**

- Modify: `src/components/chungdoi-tpl-romantic-bordeaux.tsx`
- Modify: `src/components/chungdoi-romantic-bordeaux.module.css`
- Modify: `messages/vi.json`
- Modify: `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`

- [ ] **Step 1: Khóa dynamic data contract**

  Test source phải thấy `orderedCouple(content)`, `orderByBrideFirst(...)`, `invitationHeroImage(content)`, `invitationOpeningMessage(content)` và `const ceremonies = invitationCeremonies(content)`.

- [ ] **Step 2: Dựng hero thư**

  Sau cover, hiển thị `Save the date`/nhãn tương ứng qua translation, ảnh hero một ảnh trong khung 3:4, tên đôi, ngày và một đường postmark. Tên dài phải dùng `FitText` hoặc class responsive, không cắt giữa từ.

- [ ] **Step 3: Dựng family + ceremony native section**

  Desktop có hai cột gia đình cân đối; mobile xếp dọc. Tất cả `ceremonies.map(...)` nằm trong cùng `[data-template-ceremonies]`, mỗi item có `[data-template-ceremony-item]`; không tạo `[data-additional-ceremonies]`.

- [ ] **Step 4: Dựng story line**

  Dùng key `romanticBordeaux.storyLine` trong `messages/vi.json`, kết hợp tên đôi từ data. Không thêm schema/editor field.

- [ ] **Step 5: Test fixture hai lễ**

  Fixture phải có hai lễ khác title/date/time và assert cả hai xuất hiện cùng section ở desktop/mobile source/E2E.

## Task 6: Album, tiệc, lịch, map, dress code và timeline

**Files:**

- Modify: renderer và CSS Module.
- Modify: `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`.

- [ ] **Step 1: Album contact-print**

  Dùng `AlbumGallery`/`Lightbox` shared behavior nhưng bọc bằng frame editorial riêng: một ảnh feature, hai mép film/contact marks, nút trước/sau và zoom. Nếu cần mở rộng shared component, thêm prop generic có test regression thay vì fork logic lightbox.

- [ ] **Step 2: Reception + countdown + calendar**

  Dùng `formatDate`, `buildCalendar`, `SharedCountdown` và `googleCalendarUrl(content)`. Ngày cưới được đánh dấu bằng seal nhỏ; lịch tháng sáu hàng phải nằm trong frame ở 320px.

- [ ] **Step 3: Venue/map**

  Query là `venue.mapAddress || venue.address`; `InvitationMap` nằm dưới địa chỉ và `MapDirectionsButton` có vùng chạm tối thiểu 44px. Không phủ filter làm mất nhãn bản đồ.

- [ ] **Step 4: Dress code + timeline**

  Màu dress code lấy từ `dressCodeColors`; timeline dùng trục perforation/postmark trong cùng content rail, `content.schedule.map(...)` đầy đủ.

- [ ] **Step 5: Chạy feature contract**

  ```bash
  npx tsx --test src/components/chungdoi-tpl-romantic-bordeaux.test.ts
  npm run typecheck
  ```

## Task 7: RSVP, sổ lưu bút, gift và footer

**Files:**

- Modify: renderer và CSS Module.
- Modify: `src/components/chungdoi-tpl-romantic-bordeaux.test.ts`.

- [ ] **Step 1: RSVP**

  Dùng `SharedRsvpForm` trong một sheet giấy can, giữ label/validation/pending/success của provider. Preview không được để heading mồ côi khi form không live.

- [ ] **Step 2: Guestbook**

  Dùng `SharedWishForm` và `SharedWishList` với `renderWish` riêng: card lời chúc có mép giấy, tên, thời gian và trạng thái. Test rỗng, lỗi và show-all/collapse; không gửi dữ liệu thử lên production.

- [ ] **Step 3: Gift**

  Dùng `GiftEnvelope` với `templateSlug="romantic-bordeaux"`, `artworkVariant="source"`, `stacked` theo breakpoint. Modal phải hiển thị tất cả account hợp lệ, nút lưu QR, đóng bằng backdrop/nút, Escape và trả focus.

- [ ] **Step 4: Footer**

  Footer dùng nền giấy và một cành hoa riêng; đủ khoảng trống cho artwork, câu cảm ơn và domain. Không để cành che control nổi hoặc bị cắt vuông.

- [ ] **Step 5: Accessibility/source test**

  Assert heading/button có accessible name, ảnh có alt phù hợp, artwork decorative có `aria-hidden`, và renderer chỉ gọi shared form/modal thay vì giả lập state riêng.

## Task 8: Manifest, i18n và registrar

**Files:**

- Create: `src/data/templates/romantic-bordeaux.manifest.ts`
- Modify: `messages/vi.json`
- Modify generated: `src/data/templates/generated-data.ts`
- Modify generated: `src/components/generated/template-renderers.tsx`
- Test: `src/data/templates/template-manifest.test.ts`

- [ ] **Step 1: Tạo manifest**

  Dùng `defineTemplateManifest`, khai đúng slug/route/renderer, `ceremonyRendering: "inline-all"`, `heroImageCount: 1`, palette contract, `fontFamily: "Cormorant Garamond"`, `albumLayout` phù hợp và toàn bộ asset list. Demo content có hai ceremony fixture riêng cho test nhưng không ghi đè dữ liệu user.

- [ ] **Step 2: Thêm copy tiếng Việt**

  Thêm key riêng cho story/nhãn đặc trưng nếu chưa có; các nhãn chung dùng key hiện tại của `invitationTemplate`. Không hardcode tên section mới trong JSX.

- [ ] **Step 3: Chạy registrar**

  ```bash
  npm run templates:register
  ```

  Expected: manifest và renderer mới xuất hiện trong generated files, route `/mau-thiep/thu-tinh-bordeaux/demo` resolve được, không trùng slug/route/asset.

- [ ] **Step 4: Kiểm tra editor/catalog**

  Assert template có trong catalog, editor chọn được, `heroImageCount` đúng và không rơi vào renderer `post-template`. Không sửa generated files thủ công sau registrar.

## Task 9: E2E và visual QA

**Files:**

- Create: `tests/e2e/romantic-bordeaux.spec.ts`
- Create: `docs/research/romantic-bordeaux/visual-review.md`
- Create: screenshot matrix trong thư mục research.

- [ ] **Step 1: E2E hành trình chính**

  Mở `/mau-thiep/thu-tinh-bordeaux/demo`, bấm `Mở thiệp`, dừng auto-scroll, kiểm tra music toggle, assert không overflow ngang, hai ceremony cùng section, mở/đóng album lightbox, map/directions, RSVP, guestbook validation, gift modal và Escape/focus.

- [ ] **Step 2: Chụp trạng thái đủ**

  Ở 1440/768/390/320 chụp cover đóng, hero, family/ceremony, album/lightbox, calendar, map, dress/timeline, RSVP, wishes, gift đóng/modal và footer. Dừng auto-scroll trước mỗi ảnh section.

- [ ] **Step 3: Chấm critic độc lập**

  Critic xem ảnh, không đọc renderer của chính nó. Chấm độc bản, hoàn thiện, trung thực concept và bán được theo thang 1–5. Dưới ngưỡng thì ghi lỗi cụ thể, sửa, chụp lại; tối đa ba vòng. Vòng cuối vẫn dưới ngưỡng phải đánh dấu `needs-human`.

- [ ] **Step 4: Stress data**

  Test tên bốn từ, địa chỉ dài, ảnh dọc/ngang/nhỏ, tháng 11/2026 sáu hàng, 12 lời chúc và bank thiếu một phía. Không được che nút, tràn ngang hoặc làm QR xuất hiện trước click.

- [ ] **Step 5: Kỹ thuật gate**

  ```bash
  npm run lint
  npm run typecheck
  npm run typecheck:tests
  npx tsx --test src/components/chungdoi-tpl-romantic-bordeaux.test.ts src/data/templates/opening-effect.test.ts src/data/chungdoi-gift-visuals.test.ts
  npx playwright test tests/e2e/romantic-bordeaux.spec.ts --project=chromium
  npm run build:local
  ```

  Ghi rõ lỗi có sẵn trong working tree nếu gate bị ảnh hưởng bởi thay đổi khác; không dùng lint/typecheck để thay thế visual review.

## Task 10: Preview, seed và rollout có kiểm soát

**Files:**

- Create generated: `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/romantic_bordeaux.webp`.
- Modify generated: `src/data/template-preview-version.ts`.
- Modify research: `docs/research/romantic-bordeaux/visual-review.md`.

- [ ] **Step 1: Capture preview**

  ```bash
  npm run screenshots:templates -- --slug romantic-bordeaux --no-sync-production
  ```

  Kiểm tra ba WebP tồn tại, kích thước hợp lệ, tên đôi đọc được, không blank/clip/map debug.

- [ ] **Step 2: Seed local demo**

  ```bash
  npx tsx scripts/seed-demos.ts --missing --only=romantic-bordeaux
  ```

  Xác nhận `Invitation.isDemo=true`, content/relations đúng và mẫu có trong admin demo local.

- [ ] **Step 3: Final check**

  ```bash
  npm run check
  git diff --check
  ```

- [ ] **Step 4: Production rollout sau visual approval**

  Đọc [`docs/deploy-vps.md`](../../deploy-vps.md), backup DB, kiểm tra còn ít nhất 6 GiB, deploy pipeline hiện tại và seed đúng một slug bằng `--missing --only=romantic-bordeaux`. Không seed toàn bộ demo.

- [ ] **Step 5: Production smoke**

  Kiểm tra catalog, editor, public demo, mở cover, dừng auto-scroll, lightbox, map, RSVP và gift modal. Không gửi RSVP/lời chúc thử vào production.

## Definition of Done

Mẫu chỉ được coi là hoàn thành khi tất cả điều kiện sau cùng đúng:

1. Manifest, route, catalog, theme, demo content và renderer registry đều có slug `romantic-bordeaux`; generated files được tạo bằng registrar.
2. `ceremonyRendering` là `inline-all`; hai lễ fixture khác title/date/time xuất hiện trong cùng section native trên desktop và mobile.
3. Renderer mới không có inline style riêng, copy tĩnh đi qua `useTranslations("invitationTemplate")`, không có asset generic/fallback.
4. Cover/opening, auto-scroll, album/lightbox, calendar, map/directions, dress code, timeline, RSVP, guestbook, gift QR và footer đều đã click/keyboard kiểm tra.
5. Bốn viewport không overflow; tên/địa chỉ/lịch sáu hàng/ảnh bất kỳ không phá layout; reduced motion hoạt động.
6. Ba preview WebP phản ánh bản cuối và không có blank/clip/debug UI.
7. Critic đạt độc bản ≥4, hoàn thiện ≥4, trung thực concept ≥4, bán được ≥3; hoặc có ghi nhận human review nếu chưa đạt.
8. `npm run lint`, `npm run typecheck`, `npm run typecheck:tests`, test mục tiêu, E2E mục tiêu và `npm run build:local` pass.
9. Research note ghi trạng thái **đã kiểm tra / không áp dụng / chưa kiểm tra** cho mọi mục của `docs/template-clone-quality.md`; phần chưa kiểm tra không được gọi là hoàn tất.

## Backlog sau MVP

Chỉ làm sau khi `romantic-bordeaux` đã qua visual gate; các biến thể này dùng chung renderer và data contract, chỉ thay artwork/palette có chủ đích:

| Slug dự kiến | Hướng riêng | Không làm trong MVP |
|---|---|---|
| `romantic-blush-letter` | Hồng bụi, giấy can trong, hoa hồng nhạt, cảm giác bridal editorial | Không thêm route/manifest trước khi MVP ổn |
| `romantic-sage-letter` | Sage/olive, tem thư xanh, ảnh film matte, tiệc sân vườn | Không chỉ đổi `primaryColor` |
| `romantic-night-letter` | Oxblood gần đen, champagne, ánh nến và typography opera | Không tái dùng rèm marquee của `rap-hy-sai-gon` |

## Plan self-review

- Scope được giới hạn vào một mẫu mới có khác biệt vật liệu rõ ràng, tránh trùng các mẫu đỏ/phong bì đang có.
- Plan bao phủ reference, containing block, asset provenance, opening/gift, renderer, dynamic data, i18n, registry, E2E, visual critic, preview và seed production.
- Không yêu cầu migration hoặc field editor mới; generated files chỉ thay qua registrar/capture script.
- Các giới hạn external reference, bản đồ local và dữ liệu production phải ghi trong research note thay vì đánh dấu pass giả.
