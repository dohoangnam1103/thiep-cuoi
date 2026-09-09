# Hoa Mai Thủy Mặc Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng mẫu thiệp `hoa-mai-thuy-mac` luôn một cột, lấy nền giấy và hoa mai màu nước làm điểm nhận diện, đạt tối thiểu 92% độ giống cảm nhận so với concept và giữ đủ chức năng thiệp hiện tại.

**Architecture:** Dùng một bespoke renderer toàn chiều rộng với content rail 760px, không ép thiết kế vào `ArtInvitation`. Tài sản hình ảnh được tách thành texture giấy seamless, tranh thủy mặc rộng và nhiều cụm hoa mai alpha; hành vi dùng lại từ `chungdoi-tpl-shared.tsx` và lớp `ChungDoiDemo`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, CSS Modules, next-intl, Sharp, Playwright.

**Spec:** `docs/research/hoa-mai-thuy-mac/design-spec.md`

## Global Constraints

- Layout nội dung luôn một cột trên desktop, tablet và mobile.
- Nền giấy và hoa mai màu nước phải qua visual gate trước khi dựng chi tiết section.
- Mọi copy hiển thị đi qua `messages/vi.json`; không hardcode chuỗi mới trong component.
- Mẫu mới dùng `ceremonyRendering: "inline-all"` và render mọi phần tử của `invitationCeremonies(content)` trong section lễ.
- Không sửa `src/generated/prisma/**`, không thêm migration và không thêm trường editor cho “chuyện đôi mình”.
- Không dùng ảnh concept chứa chữ làm background production.
- Kiểm tra 1440×900, 768×1024, 390×844 và 320×568; thử tên/địa chỉ dài và lịch sáu hàng.
- Giữ nguyên các thay đổi chưa commit hiện có trong working tree.

---

## File map

**Create**

- `docs/research/hoa-mai-thuy-mac/asset-provenance.md`: prompt, nguồn, kích thước, alpha và hash của từng asset.
- `docs/research/hoa-mai-thuy-mac/visual-review.md`: bảng nghiệm thu viewport và trạng thái tương tác.
- `docs/research/hoa-mai-thuy-mac/reference-mobile-390.png`: reference mobile dọc đã duyệt.
- `docs/research/hoa-mai-thuy-mac/reference-rsvp.png`: reference RSVP một cột.
- `public/chungdoi/images/themes/hoa-mai-thuy-mac/*.webp`: texture giấy, hoa mai và tranh thủy mặc detail.
- `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/opening-assets.json`: tọa độ plate/layer của bìa.
- `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/*.webp`: plate và layer bìa mở.
- `public/chungdoi/images/envelope/hoa_mai_thuy_mac.webp`: phong bao mừng cưới màu nước.
- `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`: renderer và ghép các hành vi dùng chung.
- `src/components/chungdoi-hoa-mai-thuy-mac.module.css`: nền giấy, bố cục, artwork và responsive.
- `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`: hợp đồng renderer và asset.
- `src/data/templates/hoa-mai-thuy-mac.manifest.ts`: catalog, theme, demo content và asset manifest.
- `src/data/chungdoi-gift-visuals.test.ts`: hợp đồng phong bao riêng của template.
- `tests/e2e/hoa-mai-thuy-mac.spec.ts`: hành trình desktop/mobile.

**Modify**

- `src/data/templates/art-opening-effects.ts`: đăng ký 3–4 layer bìa và motion.
- `src/data/chungdoi-gift-visuals.ts`: ánh xạ slug tới phong bao màu nước.
- `messages/vi.json`: copy riêng cho section và trạng thái của mẫu.
- `src/data/templates/generated-data.ts`: sinh lại bằng registrar; không sửa tay.
- `src/components/generated/template-renderers.tsx`: sinh lại bằng registrar; không sửa tay.
- `src/data/template-preview-version.ts`: cập nhật bởi script capture preview.
- `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/hoa_mai_thuy_mac.webp`: tạo bởi script capture.

### Task 1: Khóa reference mobile và bảng art direction

**Files:**
- Create: `docs/research/hoa-mai-thuy-mac/reference-mobile-390.png`
- Create: `docs/research/hoa-mai-thuy-mac/reference-rsvp.png`
- Create: `docs/research/hoa-mai-thuy-mac/asset-provenance.md`
- Modify: `docs/research/hoa-mai-thuy-mac/design-spec.md`

**Interfaces:**
- Consumes: tám reference desktop ghi trong design spec.
- Produces: reference 390px, reference RSVP và asset matrix được dùng bởi Task 2–8.

- [ ] **Step 1: Tạo reference mobile 390px**

Dùng `imagegen` tạo một ảnh dọc 390×844 với cùng giấy kem, hoa mai vàng, thủy mặc xanh xám, typography nâu và content rail duy nhất. Ảnh phải thể hiện hero sau khi mở, một section thông tin, nút nhạc/tự cuộn và không có hai cột.

- [ ] **Step 2: Tạo reference RSVP**

Dùng `imagegen` tạo section ngang riêng: tiêu đề “Xác nhận tham dự”, form một cột gồm tên khách, tham dự, số người, ghi chú và nút gửi màu terracotta; nền giấy và hoa khớp tám reference đã duyệt.

- [ ] **Step 3: Lập asset matrix**

Ghi đúng mười asset detail và các layer cover từ design spec vào `asset-provenance.md`, với các cột: `file`, `source image`, `generation prompt`, `source dimensions`, `output dimensions`, `alpha`, `bytes`, `sha256`, `containing block`, `safe zone`.

- [ ] **Step 4: Review reference**

Mở hai ảnh mới cùng ảnh desktop bằng `view_image`. Đạt khi palette, dáng cành, độ loang và tỷ lệ chữ thuộc cùng một hệ; mobile không đặt hoa trong vùng nút nổi 64px bên phải.

- [ ] **Step 5: Commit art direction**

```bash
git add docs/research/hoa-mai-thuy-mac
git commit -m "docs: lock hoa mai watercolor art direction"
```

### Task 2: Tạo và duyệt nền giấy production

**Files:**
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/paper-tile.webp`
- Modify: `docs/research/hoa-mai-thuy-mac/asset-provenance.md`

**Interfaces:**
- Consumes: palette và tiêu chí nền giấy trong design spec.
- Produces: `paper-tile.webp`, tile 768×768 seamless dùng cho toàn bộ renderer.

- [ ] **Step 1: Sinh ảnh nguồn không chữ**

Dùng prompt: “Seamless handmade Vietnamese ivory paper texture, subtle mulberry fibers, warm cream #F3E9D7, very low contrast, evenly lit, no vignette, no border, no flowers, no objects, no text, tileable on all edges, orthographic flat scan.”

- [ ] **Step 2: Chuyển sang WebP**

Chuyển ảnh nguồn về 768×768 WebP quality 82 bằng Sharp; giữ file dưới 180KB.

- [ ] **Step 3: Kiểm tra metadata**

Run:

```bash
node -e "const sharp=require('sharp'); sharp('public/chungdoi/images/themes/hoa-mai-thuy-mac/paper-tile.webp').metadata().then(m=>{if(m.width!==768||m.height!==768||m.format!=='webp')process.exit(1); console.log(m)})"
```

Expected: `width: 768`, `height: 768`, `format: webp`.

- [ ] **Step 4: Tạo ảnh seam test**

Dùng Sharp ghép tile thành canvas 2304×1536, xem ở 100% và 200%. Đạt khi không thấy đường dọc/ngang và không nhận ra ô lặp sau ba tile.

- [ ] **Step 5: Ghi provenance và commit**

```bash
git add public/chungdoi/images/themes/hoa-mai-thuy-mac/paper-tile.webp docs/research/hoa-mai-thuy-mac/asset-provenance.md
git commit -m "feat: add seamless hoa mai paper texture"
```

### Task 3: Tạo bộ hoa mai alpha và tranh thủy mặc

**Files:**
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/wash-mountains-wide.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/wash-river-wide.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/mai-branch-canopy.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/mai-branch-left.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/mai-branch-right.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/mai-cluster-round.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/mai-divider.webp`
- Create: `public/chungdoi/images/themes/hoa-mai-thuy-mac/petals.webp`
- Modify: `docs/research/hoa-mai-thuy-mac/asset-provenance.md`

**Interfaces:**
- Consumes: asset silhouettes, dimensions and safe zones in design spec.
- Produces: reusable transparent artwork consumed by renderer CSS in Task 5–7.

- [ ] **Step 1: Sinh từng asset thành ảnh riêng**

Dùng `imagegen` cho từng silhouette, không crop từ ảnh concept. Prompt chung: “Traditional Vietnamese watercolor illustration, yellow apricot blossoms with varied five-petal blooms, buds and olive-sage leaves, dry-brush dark brown branch, transparent background, isolated complete silhouette, natural unfinished twig ends, no white halo, no frame, no text, no shadows, no photograph.” Thêm hướng cành và mật độ riêng theo tên file.

- [ ] **Step 2: Sinh hai tranh thủy mặc rộng**

`wash-mountains-wide.webp` có núi xa, đình nhỏ và khoảng giữa sạch. `wash-river-wide.webp` có sông, làng, thuyền và cầu; cả hai không có chữ, người, UI hoặc viền khung.

- [ ] **Step 3: Xử lý output**

Dùng Sharp resize theo bảng trong design spec, WebP quality 84; foreground giữ alpha. Không phóng asset nhỏ hơn kích thước output.

- [ ] **Step 4: Thêm failing asset contract test**

Trong `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`, đọc metadata bằng Sharp và assert: mọi file tồn tại, đúng WebP; năm asset hoa có `hasAlpha === true`; hai tranh rộng có width tối thiểu 2000; từng asset dưới 900KB.

- [ ] **Step 5: Chạy test**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: PASS cho asset contract.

- [ ] **Step 6: Review alpha và cạnh canvas**

Xem mỗi asset trên nền đen và nền `#F3E9D7`. Đạt khi không halo, không nền trắng và mép cành kết thúc tự nhiên. Từ chối asset nếu chỉ là ảnh trái bị lật thành ảnh phải.

- [ ] **Step 7: Commit asset pack**

```bash
git add public/chungdoi/images/themes/hoa-mai-thuy-mac src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts docs/research/hoa-mai-thuy-mac/asset-provenance.md
git commit -m "feat: add watercolor apricot blossom asset system"
```

### Task 4: Dựng bìa mở và phong bao mừng cưới

**Files:**
- Create: `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/opening-assets.json`
- Create: `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/cover-plate.webp`
- Create: `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/cover-branch-left.webp`
- Create: `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/cover-branch-right.webp`
- Create: `public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac/cover-seal.webp`
- Create: `public/chungdoi/images/envelope/hoa_mai_thuy_mac.webp`
- Modify: `src/data/templates/art-opening-effects.ts`
- Modify: `src/data/chungdoi-gift-visuals.ts`
- Test: `src/data/templates/opening-effect.test.ts`
- Create test: `src/data/chungdoi-gift-visuals.test.ts`

**Interfaces:**
- Consumes: paper/flower style from Task 2–3.
- Produces: `artOpeningEffects["hoa-mai-thuy-mac"]` and `resolveGiftVisual("hoa-mai-thuy-mac")`.

- [ ] **Step 1: Viết failing tests**

Thêm assertion rằng opening effect có duration 1300–1500ms, đúng 3 layer `branch-left`, `branch-right`, `wax-seal`, và reduced motion 180ms. Thêm assertion gift visual là `layered-image` trỏ tới `/chungdoi/images/envelope/hoa_mai_thuy_mac.webp`.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/data/templates/opening-effect.test.ts src/data/chungdoi-gift-visuals.test.ts
```

Expected: FAIL vì slug chưa được đăng ký.

- [ ] **Step 3: Tạo asset và metadata cover**

Canvas cover là 1600×1000. Plate chứa giấy, dây ngang và khung thiệp nhưng không có tên. Ba layer alpha nằm trong canvas và dùng rect pixel chính xác trong `opening-assets.json`.

- [ ] **Step 4: Đăng ký motion**

Trong `art-opening-effects.ts`, import JSON và thêm effect duration 1420ms: cành trái bay `[-82,-44,2.8,-8,8]`, cành phải `[84,-42,2.8,8,8]`, seal `[0,-28,3.6,12,11]`; origin lần lượt `100% 20%`, `0% 20%`, `50% 50%`.

- [ ] **Step 5: Đăng ký gift visual**

Thêm vào `sourceGiftVisuals`:

```ts
"hoa-mai-thuy-mac": {
  kind: "layered-image",
  asset: "/chungdoi/images/envelope/hoa_mai_thuy_mac.webp",
},
```

- [ ] **Step 6: Chạy test và validator**

Run:

```bash
npx tsx --test src/data/templates/opening-effect.test.ts src/data/chungdoi-gift-visuals.test.ts
npm run templates:validate-opening-assets
```

Expected: PASS; không thiếu asset và rect không ra ngoài canvas.

- [ ] **Step 7: Commit cover/gift**

```bash
git add public/chungdoi/images/themes/_decor/hoa-mai-thuy-mac public/chungdoi/images/envelope/hoa_mai_thuy_mac.webp src/data/templates/art-opening-effects.ts src/data/chungdoi-gift-visuals.ts src/data/templates/opening-effect.test.ts src/data/chungdoi-gift-visuals.test.ts
git commit -m "feat: add hoa mai opening and gift artwork"
```

### Task 5: Dựng nền trang và layout một cột

**Files:**
- Create: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`
- Create: `src/components/chungdoi-hoa-mai-thuy-mac.module.css`
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`

**Interfaces:**
- Consumes: assets Task 2–4 và `ChungDoiDemoContent`.
- Produces: `HoaMaiThuyMacInvitation({ content }: { content: ChungDoiDemoContent })` và các primitive local `Section`, `SectionHeading`, `WatercolorArtwork`.

- [ ] **Step 1: Viết failing structural test**

Assert renderer export tồn tại, root có `data-hoa-mai-template`, mỗi section có `data-hoa-mai-section`, có `.contentRail`, và source không chứa `md:grid-cols-2`, `lg:grid-cols-2` hoặc `grid-template-columns: repeat(2`.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: FAIL vì renderer chưa tồn tại.

- [ ] **Step 3: Tạo renderer skeleton**

Export đúng signature:

```tsx
export function HoaMaiThuyMacInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  return (
    <main data-hoa-mai-template>
      <section data-hoa-mai-section="foundation" className={styles.section}>
        <div className={styles.contentRail} aria-hidden />
      </section>
    </main>
  );
}
```

`Section` render full-width background; child `.contentRail` dùng `width: min(100% - 32px, 760px)` và `margin-inline: auto` ở mọi breakpoint.

- [ ] **Step 4: Áp nền giấy và artwork foundation**

Root dùng `background-color: #F3E9D7` và `background-image: url('/chungdoi/images/themes/hoa-mai-thuy-mac/paper-tile.webp')`. Mỗi lớp wash/flower là absolute, `pointer-events: none`, `aria-hidden`, bám vào section cụ thể; content rail có `position: relative; z-index: 2`.

- [ ] **Step 5: Áp typography và motion rule**

Heading/names dùng Cormorant Garamond, body dùng Lora. Thêm keyframe cánh hoa chỉ dùng transform/opacity và tắt trong `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 6: Chạy test**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: PASS cho layout contract.

- [ ] **Step 7: Commit foundation**

```bash
git add src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx src/components/chungdoi-hoa-mai-thuy-mac.module.css src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
git commit -m "feat: build hoa mai paper and single-column foundation"
```

### Task 6: Dựng hero, gia đình, nhiều lễ và chuyện đôi mình

**Files:**
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`
- Modify: `src/components/chungdoi-hoa-mai-thuy-mac.module.css`
- Modify: `messages/vi.json`
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`

**Interfaces:**
- Consumes: `orderedCouple(content)`, `orderByBrideFirst(...)`, `invitationOpeningMessage(content)`, `invitationCeremonies(content)`.
- Produces: hero, family/ceremony section và story section dùng dữ liệu động.

- [ ] **Step 1: Viết failing ceremony test**

Assert source có `const ceremonies = invitationCeremonies(content)` và `ceremonies.map(`, đồng thời có `data-template-ceremonies` và `data-template-ceremony-item`.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: FAIL cho ceremony contract.

- [ ] **Step 3: Implement hero và family/ceremonies**

Hero dùng một ảnh cưới rộng trong khung 16:9, tên đôi bên dưới/ở vùng sạch theo reference. Gia đình nhà trai, tên đôi, từng ceremony và nhà gái xếp nối tiếp trên cùng trục.

- [ ] **Step 4: Implement story section**

Dùng `invitationHeroImage(content)` hoặc ảnh gallery đầu tiên, tên/thứ tự sinh từ `orderedCouple`, và copy `hoaMaiThuyMac.storyLine` trong `messages/vi.json`. Không thêm trường database.

- [ ] **Step 5: Chạy test và typecheck**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit invitation core**

```bash
git add src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx src/components/chungdoi-hoa-mai-thuy-mac.module.css src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts messages/vi.json
git commit -m "feat: add hoa mai invitation story and ceremonies"
```

### Task 7: Dựng album, lịch, lịch trình, dress code và map

**Files:**
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`
- Modify: `src/components/chungdoi-hoa-mai-thuy-mac.module.css`
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`

**Interfaces:**
- Consumes: `SharedCarousel`, `Lightbox`, `useLightbox`, `buildCalendar`, `googleCalendarUrl`, `DressCode`, `InvitationMap`, `MapDirectionsButton`.
- Produces: section 4–6 theo reference, giữ một cột.

- [ ] **Step 1: Viết failing feature test**

Assert renderer dùng calendar, album/lightbox, toàn bộ `content.schedule.map`, dress code colors, map query từ `venue.mapAddress || venue.address`, và nút chỉ đường.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: FAIL vì các section chưa có.

- [ ] **Step 3: Implement album một ảnh**

Dùng frame `aspect-ratio: 16 / 9`, một ảnh tại một thời điểm, nút trước/sau và chỉ số dưới ảnh. Click ảnh mở `Lightbox`; không dùng mosaic hoặc grid thumbnail trên trang chính.

- [ ] **Step 4: Implement calendar/schedule/dress**

Dùng `buildCalendar(content.couple.date)`, link `googleCalendarUrl(content)`, `content.schedule.map(...)` và màu hợp lệ từ `dressCodeColors`. Ba khối nối dọc, không nằm trong hai column.

- [ ] **Step 5: Implement map**

Đặt `InvitationMap` cao 360px desktop, 280px mobile trong khung giấy; dùng `MapDirectionsButton`. Không cố phủ filter khiến nhãn Google Maps khó đọc.

- [ ] **Step 6: Chạy test và typecheck**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit information sections**

```bash
git add src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx src/components/chungdoi-hoa-mai-thuy-mac.module.css src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
git commit -m "feat: add hoa mai gallery schedule and venue"
```

### Task 8: Dựng RSVP, lời chúc, phong bao và footer

**Files:**
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`
- Modify: `src/components/chungdoi-hoa-mai-thuy-mac.module.css`
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts`

**Interfaces:**
- Consumes: `SharedRsvpForm`, `SharedWishForm`, `SharedWishList`, `GiftEnvelope`, `invitationGiftAccounts(content)`.
- Produces: các section live-form và modal QR dùng provider hiện tại.

- [ ] **Step 1: Viết failing interaction-source test**

Assert renderer dùng bốn shared components, map cả hai gift account và không render QR trực tiếp trong DOM khi phong bao còn đóng.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
```

Expected: FAIL vì section chưa có.

- [ ] **Step 3: Implement RSVP và guestbook**

RSVP dùng reference Task 1. Wish form nằm dưới danh sách ba lời chúc đầu; `SharedWishList` giữ nút xem thêm/thu gọn và trạng thái live/preview.

- [ ] **Step 4: Implement gift và footer**

`GiftEnvelope` dùng `templateSlug={content.slug}`, `artworkVariant="source"`, accent `#DFAE37`, dark `#A95231`, card background `#F3E9D7`. Modal hiển thị toàn bộ account hợp lệ, nút lưu QR và đóng bằng backdrop/nút đóng.

- [ ] **Step 5: Chạy test và typecheck**

Run:

```bash
npx tsx --test src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit live sections**

```bash
git add src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx src/components/chungdoi-hoa-mai-thuy-mac.module.css src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
git commit -m "feat: add hoa mai rsvp wishes and gift"
```

### Task 9: Đăng ký template, catalog và editor

**Files:**
- Create: `src/data/templates/hoa-mai-thuy-mac.manifest.ts`
- Modify generated: `src/data/templates/generated-data.ts`
- Modify generated: `src/components/generated/template-renderers.tsx`
- Test: `src/data/templates/template-manifest.test.ts`
- Test: `src/components/chungdoi-multiple-ceremonies.test.ts`

**Interfaces:**
- Consumes: renderer Task 5–8, `artOpeningEffects["hoa-mai-thuy-mac"]` và `createTemplateDemoContent(...)`.
- Produces: template có mặt trong catalog, demo, editor capability và renderer registry.

- [ ] **Step 1: Viết failing registration assertions**

Assert manifest slug/route là `hoa-mai-thuy-mac`, renderer export là `HoaMaiThuyMacInvitation`, `ceremonyRendering` là `inline-all`, asset list chứa toàn bộ asset Task 2–4 và generated renderer có entry tương ứng.

- [ ] **Step 2: Chạy test để thấy fail**

Run:

```bash
npx tsx --test src/data/templates/template-manifest.test.ts src/components/chungdoi-multiple-ceremonies.test.ts
```

Expected: FAIL vì manifest chưa có.

- [ ] **Step 3: Tạo manifest**

Dùng `defineTemplateManifest` và `createTemplateDemoContent`. Khai tên “Hoa Mai Thủy Mặc”, category `Floral`, color `Yellow`, `heroImageCount: 1`, `ceremonyRendering: "inline-all"`, font `Cormorant Garamond`, opening effect mới và nhạc `/chungdoi/music/sunflower.mp3`. Mảng `assets` liệt kê rõ toàn bộ WebP detail, opening plate/layers, gift envelope và music để registrar kiểm tra file thiếu.

- [ ] **Step 4: Sinh registry**

Run:

```bash
npm run templates:register
```

Expected: registrar thêm manifest và renderer, không báo asset thiếu hoặc slug trùng.

- [ ] **Step 5: Chạy test**

Run:

```bash
npx tsx --test src/data/templates/template-manifest.test.ts src/components/chungdoi-multiple-ceremonies.test.ts src/components/chungdoi-tpl-hoa-mai-thuy-mac.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit registration**

```bash
git add src/data/templates/hoa-mai-thuy-mac.manifest.ts src/data/templates/generated-data.ts src/components/generated/template-renderers.tsx src/data/templates/template-manifest.test.ts src/components/chungdoi-multiple-ceremonies.test.ts
git commit -m "feat: register hoa mai watercolor invitation"
```

### Task 10: E2E và visual QA bốn viewport

**Files:**
- Create: `tests/e2e/hoa-mai-thuy-mac.spec.ts`
- Create: `docs/research/hoa-mai-thuy-mac/visual-review.md`
- Create: `docs/research/hoa-mai-thuy-mac/{1440,768,390,320}-*.png`
- Modify: `src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx`
- Modify: `src/components/chungdoi-hoa-mai-thuy-mac.module.css`

**Interfaces:**
- Consumes: template đã đăng ký và reference đã duyệt.
- Produces: bằng chứng responsive, interaction và visual fidelity.

- [ ] **Step 1: Viết E2E**

Test mở route `/mau-thiep/hoa-mai-thuy-mac/demo`, bấm mở thiệp, dừng auto-scroll, assert `document.documentElement.scrollWidth === viewport width`, assert hai ceremony cùng nằm trong `[data-template-ceremonies]`, mở/đóng lightbox, mở RSVP, kiểm tra map iframe/link fallback, validate wish form rỗng, mở gift modal và assert hai bank card.

- [ ] **Step 2: Chạy E2E để tìm lỗi thực tế**

Run:

```bash
npx playwright test tests/e2e/hoa-mai-thuy-mac.spec.ts --project=chromium
```

Expected trước khi tinh chỉnh: test chỉ ra mọi overflow hoặc selector/trạng thái chưa đúng; không bỏ qua failure.

- [ ] **Step 3: Chụp bốn viewport**

Chụp cover đóng, hero mở, family/ceremony, calendar, album/lightbox, map, RSVP, wishes, gift đóng/modal và footer ở 1440, 768, 390, 320. Tắt auto-scroll trước mỗi ảnh section.

- [ ] **Step 4: Visual compare**

Chấm từng ảnh theo bốn tiêu chí 0–5: paper, watercolor artwork, typography/spacing, functional clarity. Mỗi ảnh phải đạt ít nhất 4/5 ở paper và watercolor; trung bình toàn bộ ít nhất 4.6/5 tương ứng mục tiêu 92%.

- [ ] **Step 5: Test dữ liệu khó**

Chạy fixture có hai lễ khác ngày/giờ, tên dài, địa chỉ ba dòng, lịch tháng 11/2026 sáu hàng, 12 lời chúc, ảnh dọc/ngang/nhỏ và bank thiếu một phía. Không được tràn, che nút hoặc để khoảng trắng hỏng.

- [ ] **Step 6: Chạy gate kỹ thuật**

Run:

```bash
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run build:local
npx playwright test tests/e2e/hoa-mai-thuy-mac.spec.ts --project=chromium
```

Expected: tất cả exit 0.

- [ ] **Step 7: Ghi visual review và commit**

`visual-review.md` ghi viewport, trạng thái, screenshot, điểm 0–5, khác biệt chưa xác minh và kết quả gate. Không ghi “đạt” cho map tiles nếu ảnh map chưa tải.

```bash
git add src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx src/components/chungdoi-hoa-mai-thuy-mac.module.css tests/e2e/hoa-mai-thuy-mac.spec.ts docs/research/hoa-mai-thuy-mac
git commit -m "test: verify hoa mai invitation fidelity"
```

### Task 11: Tạo preview, seed demo và triển khai

**Files:**
- Create generated: `public/chungdoi/images/template-previews/en/listing/hoa_mai_thuy_mac.webp`
- Create generated: `public/chungdoi/images/template-previews/en/portrait/hoa_mai_thuy_mac.webp`
- Create generated: `public/chungdoi/images/template-previews/en/landscape/hoa_mai_thuy_mac.webp`
- Modify generated: `src/data/template-preview-version.ts`
- Read before deployment: `docs/deploy-vps.md`

**Interfaces:**
- Consumes: bản đã qua Task 10.
- Produces: catalog preview, demo DB production và template public.

- [ ] **Step 1: Capture preview**

Run:

```bash
npm run screenshots:templates -- --slug hoa-mai-thuy-mac
```

Expected: ba preview WebP tồn tại và version file thay đổi.

- [ ] **Step 2: Review preview**

Mở cả ba ảnh. Tên đôi phải đọc được, nền giấy không cháy trắng và cành hoa không bị thumbnail crop mất chủ thể.

- [ ] **Step 3: Chạy final check**

Run:

```bash
npm run check
```

Expected: exit 0.

- [ ] **Step 4: Commit preview**

```bash
git add public/chungdoi/images/template-previews/en/listing/hoa_mai_thuy_mac.webp public/chungdoi/images/template-previews/en/portrait/hoa_mai_thuy_mac.webp public/chungdoi/images/template-previews/en/landscape/hoa_mai_thuy_mac.webp src/data/template-preview-version.ts
git commit -m "chore: add hoa mai template previews"
```

- [ ] **Step 5: Deploy sau khi visual approval**

Đọc `docs/deploy-vps.md`, kiểm tra ít nhất 6 GiB trống, backup DB, chạy pipeline deploy hiện tại, rồi seed đúng mẫu:

```bash
npm run deploy
npm run seed:demos -- --missing --only=hoa-mai-thuy-mac
```

Expected: container healthy; `Invitation.isDemo=true`; mẫu xuất hiện ở `/admin/demos`, catalog, editor và route public.

- [ ] **Step 6: Smoke production**

Kiểm tra HTTP 200 cho catalog và demo, mở thiệp thật, dừng auto-scroll, mở lightbox, map, RSVP và gift modal. Không gửi RSVP/lời chúc test vào dữ liệu production.

---

## Self-review result

- Spec coverage: đủ nền giấy, asset hoa, bìa, một cột, nội dung động, nhiều lễ, album, lịch, map, RSVP, lời chúc, gift, responsive, preview và production seed.
- Scope kept: không thêm story field/database migration; story line dùng i18n như spec.
- Generated files: chỉ thay qua `templates:register` và `screenshots:templates`.
- Visual gate: paper và watercolor phải đạt trước renderer; final score yêu cầu 4.6/5.
- Placeholder scan: mọi bước đều có đầu ra, lệnh kiểm tra và kết quả mong đợi cụ thể.
