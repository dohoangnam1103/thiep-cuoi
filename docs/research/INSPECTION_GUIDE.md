# Website Inspection Guide

## How to Reverse-Engineer Any Website

This guide outlines what to capture when inspecting a target website via Chrome MCP or browser DevTools.

## Phase 1: Visual Audit

### Screenshots to Capture
- [ ] Every distinct page — desktop, tablet, mobile
- [ ] Dark mode variants (if applicable)
- [ ] Light mode variants (if applicable)
- [ ] Key interaction states (hover, active, open menus, modals)
- [ ] Loading/skeleton states
- [ ] Empty states
- [ ] Error states

### Design Tokens to Extract
- [ ] **Colors** — background, text (primary/secondary/muted), accent, border, hover, error, success, warning
- [ ] **Typography** — font family, sizes (h1-h6, body, caption, label), weights, line heights, letter spacing
- [ ] **Spacing** — padding/margin patterns (look for a scale: 4px, 8px, 12px, 16px, 24px, 32px, etc.)
- [ ] **Border radius** — buttons, cards, avatars, inputs
- [ ] **Shadows/elevation** — card shadows, dropdown shadows, modal overlay
- [ ] **Breakpoints** — when does the layout shift? (inspect with DevTools responsive mode)
- [ ] **Icons** — which icon library? custom SVGs? sizes?
- [ ] **Avatars** — sizes, shapes, fallback behavior
- [ ] **Buttons** — all variants (primary, secondary, ghost, icon-only, danger)
- [ ] **Inputs** — text fields, textareas, selects, checkboxes, toggles

## Phase 2: Component Inventory

For each distinct UI component, document:
1. **Name** — what would you call this component?
2. **Structure** — what HTML elements / child components does it contain?
3. **Variants** — does it have different sizes, colors, or states?
4. **States** — default, hover, active, disabled, loading, error, empty
5. **Responsive behavior** — how does it change at different breakpoints?
6. **Interactions** — click, hover, focus, keyboard navigation
7. **Animations** — transitions, entrance/exit animations, micro-interactions

### Common Components to Look For
- Navigation (top bar, sidebar, bottom bar)
- Cards / list items
- Buttons and links
- Forms and inputs
- Modals and dialogs
- Dropdowns and menus
- Tabs and segmented controls
- Avatars and user badges
- Loading skeletons
- Toast notifications
- Tooltips and popovers

## Phase 3: Layout Architecture

- [ ] **Grid system** — CSS Grid? Flexbox? Fixed widths?
- [ ] **Column layout** — how many columns at each breakpoint?
- [ ] **Max-width** — main content area max-width
- [ ] **Sticky elements** — header, sidebar, floating buttons
- [ ] **Z-index layers** — navigation, modals, tooltips, overlays
- [ ] **Scroll behavior** — infinite scroll, pagination, virtual scrolling

## Phase 4: Technical Stack Analysis

- [ ] **Framework** — React? Vue? Angular? Check `__NEXT_DATA__`, `__NUXT__`, `ng-version`
- [ ] **CSS approach** — Tailwind (utility classes), CSS Modules, Styled Components, Emotion, vanilla CSS
- [ ] **State management** — Redux (check DevTools), React Query, Zustand, Pinia
- [ ] **API patterns** — REST, GraphQL (check network tab for `/graphql` requests)
- [ ] **Font loading** — Google Fonts, self-hosted, system fonts
- [ ] **Image strategy** — CDN, lazy loading, srcset, WebP/AVIF
- [ ] **Animation library** — Framer Motion, GSAP, CSS transitions only

## Phase 5: Documentation Output

After inspection, create these files in `docs/research/`:
1. `DESIGN_TOKENS.md` — All extracted colors, typography, spacing
2. `COMPONENT_INVENTORY.md` — Every component with structure notes
3. `LAYOUT_ARCHITECTURE.md` — Page layouts, grid system, responsive behavior
4. `INTERACTION_PATTERNS.md` — Animations, transitions, hover states
5. `TECH_STACK_ANALYSIS.md` — What the site uses and our chosen equivalents

---

# Chung Đôi: Playbook tạo mẫu thiệp mới

## Mục đích

Phần này là nguồn quyết định duy nhất khi tạo thêm mẫu thiệp cưới cho Chung Đôi. Đọc hết trước khi thiết kế hoặc code mẫu mới. Không hỏi lại các lựa chọn sản phẩm đã được khóa ở đây, trừ khi yêu cầu mới của người dùng thay đổi chúng rõ ràng.

Playbook được đúc kết sau khi triển khai và review 18 mẫu nghệ thuật ngày 2026-07-28, và được áp dụng lại cho hai mẫu Đông Sơn ngày 2026-07-29. Nó áp dụng trực tiếp cho các mẫu mới dùng hệ thống manifest và renderer dùng chung.

## Kiến trúc hiện tại

### Renderer và component dùng chung

- Renderer chính: `src/components/chungdoi-tpl-art-invitation.tsx`.
- Component dùng chung như lịch, countdown, bản đồ, album, form lời chúc và QR: `src/components/chungdoi-tpl-shared.tsx`.
- Mỗi mẫu có một wrapper mỏng: `src/components/chungdoi-tpl-<slug>.tsx`.
- Wrapper chỉ khai báo `ArtInvitationConfig`, lấy bản dịch từ `invitationTemplate`, rồi render `ArtInvitation`.
- Không nhân bản toàn bộ JSX thiệp chỉ để đổi màu, font hoặc artwork.
- Wrapper không dùng inline style. Test hiện tại kiểm tra điều này.

### Manifest và registrar

- Manifest từng mẫu: `src/data/templates/<slug>.manifest.ts`.
- Factory cho nhóm mẫu nghệ thuật: `src/data/templates/art-template-manifest.ts`.
- Kiểu manifest và demo content: `src/data/templates/template-manifest.ts`.
- Registrar: `scripts/register-template-manifests.ts`.
- Chạy registrar bằng `npm run templates:register`.
- Registrar tự nối catalog, route, demo content, theme, i18n và dynamic renderer qua:
  - `src/data/templates/generated-data.ts`
  - `src/components/generated/template-renderers.tsx`
- Hai file trên là auto-generated. Không sửa tay.

### Asset và preview

- Artwork riêng của mẫu đặt tại `public/chungdoi/images/themes/_decor/<slug>/artwork.webp`.
- Asset cho hiệu ứng mở đặt cùng thư mục, gồm `opening-plate.webp`, ba hoặc bốn
  file `opening-<layer-id>.webp` và `opening-assets.json`.
- Contract của hiệu ứng: `src/data/templates/opening-effect.ts`.
- Registry motion của nhóm art invitation: `src/data/templates/art-opening-effects.ts`.
- Renderer hiệu ứng dùng chung: `src/components/chungdoi-opening-effect.tsx`.
- Preview sinh ra tại:
  - `public/chungdoi/images/template-previews/en/listing/`
  - `public/chungdoi/images/template-previews/en/portrait/`
  - `public/chungdoi/images/template-previews/en/landscape/`
- Tên preview dùng slug đổi dấu `-` thành `_`.
- Mọi asset được khai báo trong manifest phải là public path bắt đầu bằng `/` và phải tồn tại trên đĩa trước khi chạy registrar.
- Artwork mới phải là asset gốc hoặc có quyền sử dụng rõ ràng. Ghi nguồn tại `docs/research/asset-provenance.md` nếu dùng nguồn bên ngoài.

## 20 mẫu đã triển khai bằng renderer này

| Slug | Số ảnh mở đầu |
|---|---:|
| `dong-ho-folk` | 2 |
| `tho-cam-highland` | 1 |
| `son-mai-lacquer` | 1 |
| `bat-trang-blue` | 2 |
| `hang-trong-folk` | 2 |
| `sen-monoline` | 2 |
| `truc-chi-minimal` | 2 |
| `long-phung-deco` | 2 |
| `ao-dai-hue` | 1 |
| `art-deco-gatsby` | 2 |
| `celestial-map` | 1 |
| `coastal-mediterranean` | 1 |
| `swiss-brutalist` | 2 |
| `riso-duotone` | 2 |
| `cinema-credit` | 1 |
| `aurora-glass-dark` | 1 |
| `y2k-chrome` | 1 |
| `botanical-lavender` | 2 |
| `trong-dong-dong-son` | 2 |
| `chim-lac-ivory` | 1 |

Số ảnh mở đầu được khai báo bằng `heroImageCount: 1 | 2` trong manifest. Editor dựa vào giá trị này để hiện đúng số vùng upload.

## Các quyết định sản phẩm đã khóa

### 1. Phân biệt bìa và thiệp sau khi mở

- Bìa/phong bì trước khi mở và nội dung thiệp sau khi mở là hai phạm vi khác nhau.
- Khi yêu cầu tăng chiều rộng thiệp, mặc định chỉ thay phần sau khi mở.
- Không thay kích thước hoặc tỷ lệ bìa nếu người dùng không nói rõ.
- Phần thiệp đã mở có outer column tối đa `900px` trên desktop.
- Cột nội dung đọc tối đa `760px`.
- Mobile dùng toàn bộ chiều rộng viewport, không tràn ngang.

### 2. Bố cục một cột

- Nội dung thiệp sau khi mở luôn ưu tiên một cột, dài theo chiều dọc.
- Không thêm `sm:grid-cols-*`, `md:grid-cols-*`, `lg:grid-cols-*` hoặc chia đôi nội dung chính.
- Ảnh cô dâu chú rể, gia đình, sự kiện, countdown, lịch, album, timeline, bản đồ, dress code, guestbook và QR đi theo một trục dọc.
- Timeline của nhóm mẫu này xếp từng mục theo chiều dọc và canh giữa, không dùng cột giờ bên trái và nội dung bên phải.

### 3. Cô dâu chú rể là nhân vật trung tâm

- Thiệp phải có một hoặc hai ảnh mở đầu cho người dùng upload.
- Với hai ảnh, ảnh được xếp dọc, không chia hai cột.
- Artwork chỉ đóng vai trò tạo thế giới thị giác và trang trí nền.
- Không để artwork chiếm vai trò thị giác lớn hơn ảnh cặp đôi trong toàn bộ trải nghiệm.
- Ảnh mở đầu có `max-width` khoảng `680px` đến `720px`, co toàn chiều rộng trên mobile.

### 4. Text ưu tiên canh giữa

- Cột nội dung chính có `text-center` mặc định.
- Tiêu đề, lời mời, thông tin hai gia đình, địa chỉ, sự kiện, ngày giờ, countdown, lịch, timeline, map, dress code, lời chúc và QR đều ưu tiên canh giữa.
- Không thêm `text-left` hoặc `text-right` vào renderer nhóm mẫu này nếu không có lý do UX cụ thể và được review.
- Form lời chúc truyền `centered` vào `SharedWishForm`, bao gồm input, textarea và nút gửi.
- Các control kỹ thuật có thể giữ alignment riêng nếu canh giữa làm giảm khả năng sử dụng, nhưng phải là ngoại lệ có chủ đích.

### 5. Parallax phải nhìn thấy thật

- Dùng ba lớp artwork cố định trong viewport qua `data-parallax="artwork"`.
- Foreground cuộn phía trên background cố định để tạo parallax ổn định trên desktop và mobile.
- Ba lớp có chuyển động drift chậm để tránh cảm giác ảnh nền đứng chết.
- Không dùng `animation-timeline: scroll(root block)` cho artwork này. Cách đó từng báo transform đang chạy nhưng trình duyệt không paint ảnh, khiến người dùng không thấy parallax.
- Không đặt opacity quá thấp hoặc đẩy toàn bộ artwork ra ngoài mép. Phải kiểm tra bằng mắt ở light theme và dark theme.
- Giữ `pointer-events-none` để nền không chặn tương tác.
- Tắt animation trong `prefers-reduced-motion: reduce`.

### 6. Trật tự layer chuẩn

- Main thiệp: `z-40`.
- Parallax fixed background: `z-20` bên trong thiệp.
- Hero và cột nội dung: `z-30`.
- Parallax nằm sau text và control, không nhận pointer event.
- Khối tên và vùng chứa ảnh mở đầu phải trong suốt để parallax xuất hiện từ đầu thiệp.
- Hero artwork và cụm ngày/tên dùng chung một stage cao `clamp(760px, 100svh, 1080px)`; `heroClass` cung cấp màu nền để artwork fade vào đúng palette của từng theme.
- Artwork hero giữ nguyên chi tiết ở phần trên, bắt đầu fade từ `42%` và trong suốt tại `88%` để tên và lời mời luôn dễ đọc.
- Không gắn `surfaceClass` vào toàn bộ hero, khối tên hoặc wrapper ảnh mở đầu vì nó tạo một mảng nền đặc che parallax.

### 7. Không để border hoặc hoạ tiết cắt qua chữ

- Mọi content card và media frame lớn của nhóm art invitation dùng radius `24px` (`rounded-[1.5rem]`), không giữ ngoại lệ vuông `0–3px`.
- Button và calendar-day highlight tiếp tục dùng `radiusClass` riêng của theme; không dùng radius control để quyết định radius card.
- Border phải bao ngoài padding. Không đặt đường viền hoặc SVG absolute đi xuyên qua vùng chữ.
- Khi tự vẽ artwork hero, dồn toàn bộ chủ thể và hoạ tiết vào khoảng `38%` chiều cao trên của canvas. Cụm ngày/tên neo xuống đáy hero, còn mask chỉ trong suốt hoàn toàn từ `88%`, nên mọi nét nằm giữa `38%` và `88%` sẽ đè lên chữ.
- Không đặt dải trang trí ngang (sawtooth, ladder, triangle band) ở nửa dưới canvas. Nếu cần dải, đặt phía trên chủ thể chính.
- Hoạ tiết nền nằm sau nội dung, opacity vừa đủ và không làm giảm độ tương phản chữ.

### 8. Typography theo chủ đề nhưng vẫn dễ đọc

- Tên cặp đôi và tiêu đề chính dùng display font được mapping theo theme; body copy giữ font đọc nội dung.
- Manifest font, wrapper display class và Open Graph font file phải cùng một mapping và đều hỗ trợ dấu tiếng Việt.
- Font do editor cung cấp được resolve qua utility class đã kiểm soát; family lạ fallback về display font mặc định của template.
- Không gắn display font vào lời mời, địa chỉ, ngày giờ, control hay form field.

### 9. Hiệu ứng mở thiệp phải dùng layer alpha sạch

- Mỗi mẫu nghệ thuật mới có một composition mở riêng, phù hợp với nhân vật và
  hình học của theme; không dùng một animation scale toàn bộ background cho mọi mẫu.
- Chọn ba hoặc bốn chủ thể có ý nghĩa để chuyển động độc lập, ví dụ hai con vật
  và một cụm hoa, hai dải lụa và lớp thêu, hoặc hai ribbon và một flare.
- Thời lượng đầy đủ nằm trong `1.3–1.5s`. Chuyển động phải đủ mạnh và giữ chủ thể
  sắc nét, dễ nhìn tới khoảng `70%` timeline trước khi fade/blur ra khỏi cảnh.
- Nền được dựng lại thành `opening-plate.webp` sau khi xóa các chủ thể chuyển động.
  Plate đứng ổn định trong phần lớn animation, chỉ translate/fade nhẹ khi bìa rời đi.
- Foreground phải là WebP có alpha thật, chỉ chứa chủ thể. Không dùng crop chữ nhật,
  `clip-path`, mask giả hoặc chính `artwork.webp` làm layer phóng to.
- Xóa sạch matte giấy, trời, vải, sơn mài hoặc background quanh chủ thể; làm sạch
  biên thêm `1–2px`. Validator chỉ xác nhận alpha kỹ thuật, vì vậy bắt buộc review
  bằng mắt trên nền sáng và tối để phát hiện viền bẩn.
- Ở frame đầu, từng layer phải khớp pixel-perfect với vị trí tương ứng trên plate,
  không nhảy vị trí hoặc đổi kích thước khi người dùng bấm mở.
- Nếu một foreground tùy chọn tải lỗi, bỏ qua layer đó và tiếp tục mở thiệp. Tuyệt
  đối không fallback sang scale ảnh composite hoặc một crop còn dính background.
- Với `prefers-reduced-motion: reduce`, thay scale/rotate/travel bằng fade ngắn
  khoảng `160–220ms`.
- Các mẫu legacy đang dùng `flyOnOpen`, gồm Song Phụng, giữ nguyên pipeline và
  animation hiện tại; không ép chúng đi qua registry của art invitation.

#### Ranh giới clipping trước và sau khi bấm mở

- Khi thiệp còn đóng, toàn bộ plate và foreground tĩnh phải nằm bên trong ranh
  giới bìa, bị cắt theo đúng bo góc của thiệp (`overflow-hidden rounded-lg`).
- Static layer có marker `data-opening-static-clip="card"`. Không để SVG có
  `overflow: visible` vượt qua ancestor clipping này trong trạng thái đóng.
- Chỉ sau khi người dùng bấm **Mở thiệp**, renderer mới mount một opening overlay
  riêng ở kích thước projected card. Overlay này không nằm trong static clipping
  container và được phép bung chủ thể ra ngoài bìa.
- Không gỡ clipping của lớp tĩnh để tạo hiệu ứng. Tách rõ hai mặt phẳng: static
  capture bị clip và opening overlay `overflow: visible`.
- Cover viewport vẫn phải ngăn horizontal scroll; “bung ngoài” nghĩa là vượt mép
  thiệp trong animation, không tạo thanh cuộn hoặc làm rộng document.

### 10. Nội dung bắt buộc

Một mẫu hoàn chỉnh phải render được toàn bộ các section khi dữ liệu tồn tại:

1. Hero artwork.
2. Tên cô dâu chú rể và ngày cưới.
3. Một hoặc hai ảnh mở đầu.
4. Lời mời và thông tin hai gia đình.
5. Lễ cưới và tiệc cưới.
6. Countdown và thêm vào lịch.
7. Lịch tháng cưới.
8. Album.
9. Timeline.
10. Bản đồ và nút chỉ đường.
11. Dress code.
12. Sổ lưu bút và form lời chúc.
13. QR mừng cưới.
14. Footer cảm ơn.

Không xóa section chỉ để preview ngắn hơn.

## Quy trình tạo một mẫu mới

### Bước 1. Chốt concept

- Viết một câu mô tả khác biệt thị giác của mẫu.
- Chọn một artwork trung tâm, palette, font, hình học, radius và kiểu hạt trang trí.
- Kiểm tra concept không chỉ là đổi màu của mẫu có sẵn.
- Xác định `heroImageCount` là 1 hay 2 trước khi code.

### Bước 2. Chuẩn bị asset

- Tạo `public/chungdoi/images/themes/_decor/<slug>/artwork.webp`.
- Kiểm tra artwork đủ nét ở desktop và crop tốt trên mobile.
- Tạo một background plate đã xóa sạch các chủ thể sẽ bay và ba hoặc bốn layer
  PNG/WebP full-canvas có alpha thật. Trước khi export, kiểm tra các layer ghép lại
  khớp chính xác với artwork gốc.
- Dùng pipeline chuẩn để trim layer, giữ padding trong suốt `1–2px`, export WebP
  lossless và sinh `opening-assets.json`:

```bash
npm run templates:prepare-opening-assets -- \
  --slug <slug> \
  --plate <path-to-clean-plate> \
  --layer <layer-id>=<path-to-full-canvas-alpha-layer> \
  --layer <layer-id>=<path-to-full-canvas-alpha-layer> \
  --layer <layer-id>=<path-to-full-canvas-alpha-layer>
```

- Chạy validator ngay sau khi chuẩn bị asset:

```bash
npm run templates:validate-opening-assets -- --slugs <slug>
```

- Chọn gallery fallback và nhạc đã tồn tại, hoặc thêm asset mới rồi khai báo provenance.
- Không dùng artwork thương mại lấy từ website đối thủ.

### Bước 3. Tạo manifest

- Tạo `src/data/templates/<slug>.manifest.ts`.
- Với cùng kiến trúc, dùng `createArtTemplateManifest`.
- Khai báo đầy đủ:
  - `slug`
  - `viRouteSlug`
  - `rendererExport`
  - `heroImageCount`
  - catalog name, title, description, category, color, highlights
  - artwork, palette, font, particle, gallery fallback, music
  - `openingEffect` từ `artOpeningEffects["<slug>"]`
  - i18n `vi`, `en`, `ja`, `ko`, `zh`
- Đăng ký ba hoặc bốn chuyển động riêng của theme trong
  `src/data/templates/art-opening-effects.ts`. Mọi layer trong
  `opening-assets.json` phải có motion tương ứng.
- Manifest phải liệt kê plate và mọi foreground trong `assets`; factory
  `createArtTemplateManifest` thực hiện việc này từ `openingEffect`.
- Không hardcode copy mới trong component. Copy public phải đi qua next-intl hoặc manifest i18n.

### Bước 4. Tạo wrapper renderer

- Tạo `src/components/chungdoi-tpl-<slug>.tsx`.
- Copy cấu trúc của một wrapper thuộc 20 mẫu, không copy toàn bộ renderer.
- Khai báo `ArtInvitationConfig` bằng Tailwind class.
- Dùng `satisfies ArtInvitationConfig`.
- Export named component đúng với `rendererExport` trong manifest.
- Dùng `useTranslations("invitationTemplate")`.
- Không dùng inline style trong wrapper.

### Bước 5. Chạy registrar

```bash
npm run templates:register
```

Registrar phải chạy thành công trước khi sửa catalog hoặc registry bằng tay. Nếu thất bại, sửa manifest, renderer hoặc asset theo lỗi báo ra.

### Bước 5b. Bổ sung nhãn category và color

- `listing.categories` và `listing.colors` trong `messages/vi.json` **không** do registrar sinh ra. Registrar chỉ sinh `listing.templates.<slug>`.
- Nếu manifest dùng `category` hoặc `color` chưa có trong `messages/vi.json`, trang `/mau-thiep` sẽ in ra key thô kiểu `listing.categories.Minimal` hoặc `listing.colors.Bronze`.
- Sau khi chạy registrar, thêm nhãn tiếng Việt cho mọi `category`/`color` mới vào `messages/vi.json`. Các locale khác dùng thẳng giá trị tiếng Anh nên không cần key.
- Test `template-manifest.test.ts` chặn regression này.

### Bước 5c. Seed thiệp demo vào DB

```bash
npm run seed:demos
```

- Trang `/admin/demos` liệt kê từ bảng `invitation` với `isDemo: true`, không từ catalog. Mẫu mới không tự xuất hiện chỉ vì đã có manifest.
- Script dùng upsert theo `demo-<slug>` nên chạy lại an toàn, chỉ ghi vào DB local (`dev.db`).
- Trên production phải chạy lại script này sau khi deploy mẫu mới, nếu không admin sẽ không sửa được nội dung demo của mẫu.

### Bước 6. Chụp preview

Chụp một mẫu:

```bash
npm run screenshots:templates -- --slug <slug> --no-sync-production
```

Chụp nhiều mẫu:

```bash
npm run screenshots:templates -- --slug <slug-1>,<slug-2> --no-sync-production
```

Luôn dùng `--no-sync-production` trong quá trình phát triển local để không đồng bộ hoặc ghi đè dữ liệu production ngoài ý muốn.

Preview hoàn chỉnh phải có đủ ba biến thể listing, portrait và landscape. Sau khi capture, `src/data/template-preview-version.ts` sẽ đổi version để phá cache.

### Bước 7. Kiểm tra tự động

```bash
npm run templates:validate-opening-assets
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run lint
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
git diff --check
```

Số lượng test có thể tăng theo thời gian. Yêu cầu là tất cả test pass, TypeScript pass, build pass và lint không có error. Warning tồn tại sẵn phải được phân biệt với lỗi mới.

### Bước 8. Gate trực quan bắt buộc

Kiểm tra ít nhất các trạng thái sau bằng browser thật:

- Desktop khoảng `1280px` đến `1440px`.
- Mobile `390px x 844px` hoặc tương đương.
- Một theme sáng.
- Một theme tối nếu thay renderer dùng chung.
- Đầu thiệp, khu vực gia đình, event card, countdown, timeline, bản đồ, guestbook và QR.
- Cuộn ít nhất hai vị trí để xác nhận parallax thực sự đứng khác tốc độ với foreground.
- `document.documentElement.scrollWidth <= innerWidth` trên mobile.
- Không có text trái ngoài ý muốn.
- Không có border, artwork, particle hoặc parallax cắt qua chữ.
- Không có mảng nền đặc ở hero che mất parallax.
- Ảnh cặp đôi tải được, không trắng và không bị cắt sai trọng tâm.
- Trước khi bấm mở, không có artwork nào vượt khỏi ranh giới hoặc góc bo của bìa.
- Sau khi bấm mở, chỉ các foreground alpha đã tách mới bung ra ngoài thiệp; plate
  và background composite không zoom theo.
- Chụp ít nhất một frame ở khoảng `60–70%` animation để kiểm tra chủ thể còn sắc
  nét, đủ lớn và thực sự vượt khỏi bìa.
- Kiểm tra cạnh alpha trên nền tương phản: không còn hình chữ nhật, matte hoặc
  pixel background bám theo chủ thể.
- Sau `1.3–1.5s`, opening overlay phải unmount và nội dung thiệp hoạt động bình thường.
- Bật reduced motion để xác nhận chỉ còn fade ngắn.

## Các lỗi đã gặp và cách tránh

| Lỗi đã gặp | Nguyên nhân | Quy tắc phòng tránh |
|---|---|---|
| Thiệp desktop chia hai cột | Đưa artwork và text lên hai nửa màn hình | Nội dung sau mở luôn một cột |
| Thiệp quá ốm | Outer column chỉ rộng khoảng `520px` | Outer `900px`, content `760px`, mobile full width |
| Artwork lấn át cặp đôi | Hero chỉ có hoạ tiết, thiếu ảnh người | Mọi mẫu có 1 hoặc 2 ảnh mở đầu upload được |
| Border bo tròn cắt qua chữ | Dùng radius trang trí cho content card | Content card dùng `contentRadiusClass` |
| Card/media lớn còn góc vuông khó chịu | Cho `radiusClass` của control quyết định radius nội dung | Mọi surface lớn của art invitation dùng `rounded-[1.5rem]` |
| Các theme có cùng font chung chung | Giữ `font-sans` hoặc `font-serif` trong treatment hiển thị | Wrapper khai báo `displayFontClass` theo mapping đã duyệt |
| Ảnh Open Graph rơi về font mặc định | Manifest dùng family chưa có trong `FONT_FILE_BY_FAMILY` | Test mapping OG và kiểm tra font file tồn tại local |
| Có parallax trong DOM nhưng mắt không thấy | Opacity quá thấp, đẩy ảnh ra mép hoặc `scroll-timeline` không paint | Dùng fixed background, opacity đã review và kiểm tra bằng screenshot |
| Artwork chỉ hiện thành dải mỏng | Hero dùng height cố định `150px` đến `260px` với asset dọc | Dùng stage cao `clamp(760px, 100svh, 1080px)`, đặt ngày và tên trong artwork, rồi fade ảnh vào nền theme |
| Text lệch trái | Chỉ một số section có `text-center`, countdown còn `text-left` | Cột nội dung mặc định `text-center`, test cấm `text-left` |
| Timeline vẫn có cảm giác lệch | Grid giờ bên trái, nhãn bên phải | Timeline xếp dọc, `items-center`, `text-center` |
| Preview không phản ánh code mới | Chưa capture lại hoặc version cache chưa đổi | Chạy capture cho mọi slug bị ảnh hưởng |
| Registry thiếu route/theme/i18n | Nối tay nhiều file và bỏ sót | Tạo manifest rồi chạy registrar |
| Capture local đụng production | Chạy script không có cờ an toàn | Luôn thêm `--no-sync-production` |
| Hình trang trí tràn khỏi thiệp khi chưa mở | Static decor được chụp trên plane có padding nhưng thiếu ancestor clipping | Static artwork luôn nằm trong `data-opening-static-clip="card"` với `overflow-hidden` và radius đúng |
| Animation chỉ scale toàn bộ background | Dùng `artwork.webp` làm layer chuyển động | Dựng plate riêng và animate ba hoặc bốn foreground alpha độc lập |
| Chủ thể bay còn dính mảng nền | Crop chữ nhật, `clip-path` hoặc tách alpha chưa sạch | Xóa matte, clean edge `1–2px`, kiểm tra trên cả nền sáng và tối |
| Hiệu ứng có layer nhưng nhìn như không bung | Fade/blur quá sớm hoặc card rời quá nhanh | Giữ layer sắc nét tới khoảng `70%`, duration `1.3–1.5s`, card chỉ thoát mạnh ở đoạn cuối |
| Layer lỗi làm background composite phóng to | Dùng ảnh gốc làm fallback | Layer tùy chọn lỗi thì bỏ qua; không bao giờ fallback sang `artwork.webp` |
| Sửa 18 mẫu làm Song Phụng mất hiệu ứng | Dùng chung nhánh animation cho art invitation và `flyOnOpen` legacy | Giữ hai pipeline riêng và luôn chạy test hồi quy Song Phụng |
| Hoạ tiết trong artwork chạy ngang qua ngày và tên | Vẽ chủ thể hoặc dải trang trí ở khoảng `40%–88%` chiều cao canvas, đúng vùng mask còn opacity và đúng chỗ cụm text neo đáy | Giữ mọi chủ thể và dải hoạ tiết trong khoảng `0%–38%` chiều cao canvas; phần dưới chỉ để nền trơn và hạt mờ |
| Trang `/mau-thiep` hiện key thô `listing.categories.X` / `listing.colors.Y` | Manifest khai báo `category` hoặc `color` mới nhưng `messages/vi.json` chưa có nhãn tiếng Việt | Sau khi thêm manifest, bổ sung nhãn vào `listing.categories` và `listing.colors` của `messages/vi.json`; test unit chặn regression |
| `/admin/demos` không thấy mẫu mới | Trang admin đọc từ bảng `invitation` (`isDemo: true`) trong DB, không đọc catalog | Chạy `npm run seed:demos` sau khi registrar chạy xong |

## Definition of Done cho mẫu mới

- [ ] Concept khác biệt rõ, không chỉ đổi màu.
- [ ] Artwork và nguồn asset hợp lệ.
- [ ] Manifest đủ 5 locale.
- [ ] Wrapper dùng shared renderer, không inline style.
- [ ] Registrar chạy thành công.
- [ ] `listing.categories` và `listing.colors` trong `messages/vi.json` có nhãn cho mọi category/color mới.
- [ ] Đã chạy `npm run seed:demos` để mẫu mới xuất hiện ở `/admin/demos`.
- [ ] Bìa trước mở không bị thay đổi ngoài yêu cầu.
- [ ] Thiệp sau mở một cột, outer `900px`, content `760px`.
- [ ] Mobile full width, không horizontal overflow.
- [ ] Text ưu tiên canh giữa ở mọi section.
- [ ] Có đúng 1 hoặc 2 ảnh mở đầu và editor có đúng số upload.
- [ ] Parallax nhìn thấy thật, không che text, hỗ trợ reduced motion.
- [ ] Hero artwork cao gần một viewport, ôm cụm ngày và tên; không quay lại dải ảnh cố định `150px` đến `260px`.
- [ ] Hero text và wrapper ảnh không có mảng nền đặc che parallax.
- [ ] Border không cắt chữ.
- [ ] Mọi content card và media frame lớn có radius `24px`; button và calendar control vẫn theo theme.
- [ ] Tên cặp đôi và heading dùng đúng display font riêng; body copy vẫn dễ đọc.
- [ ] Manifest, wrapper và Open Graph dùng cùng font mapping, không fallback ngoài ý muốn.
- [ ] Có một opening composition riêng gồm plate và ba hoặc bốn foreground alpha sạch.
- [ ] Không có opening layer nào dùng `artwork.webp`, crop chữ nhật hoặc còn dính background.
- [ ] Layer khớp pixel-perfect với plate ở frame đầu; duration nằm trong `1.3–1.5s`.
- [ ] Trạng thái đóng clip toàn bộ artwork theo bo góc; chỉ opening overlay sau click
      mới được bung ra ngoài thiệp.
- [ ] Frame khoảng `60–70%` cho thấy chủ thể lớn, sắc nét và vượt mép thiệp; plate
      không zoom theo.
- [ ] Layer lỗi không chặn mở thiệp và không kích hoạt composite fallback.
- [ ] Reduced motion chỉ dùng fade ngắn; legacy `flyOnOpen` không thay đổi.
- [ ] Đủ mọi section dữ liệu.
- [ ] Đủ preview listing, portrait, landscape.
- [ ] Đã kiểm tra light, dark, desktop, mobile.
- [ ] TypeScript, unit test, lint error gate, build và `git diff --check` đều pass.

## Test bảo vệ các quyết định này

Các invariant chính được bảo vệ bởi:

- `src/data/templates/template-manifest.test.ts` cho manifest, renderer và preview.
- `src/data/templates/opening-effect.test.ts` cho contract và asset alpha.
- `src/lib/opening-effect-animation.test.ts` cho keyframe và reduced motion.
- `tests/e2e/templates.spec.ts` cho clipping tĩnh, overlay bung ngoài, layer failure
  và hồi quy Song Phụng.

Các test trên phải tiếp tục xác nhận:

- 20 slug có manifest, route, catalog, demo, theme, renderer và preview.
- `heroImageCount` đúng cho từng mẫu.
- Shared renderer vẫn là một cột.
- Width vẫn là `900px` và `760px`.
- Không xuất hiện responsive multi-column class.
- Parallax dùng fixed layer.
- Content mặc định canh giữa và không có `text-left`.
- Hero không bị `surfaceClass` phủ kín.
- Hero artwork có marker `data-artwork-hero`, chiều cao responsive và CSS mask/fallback bảo vệ độ đọc.
- Content card và media frame lớn dùng radius `24px`; không còn ngoại lệ vuông `0–3px`.
- Wrapper và manifest dùng đúng display-font mapping, không còn generic `font-sans`/`font-serif` trong treatment tên và heading.
- Open Graph resolve được đúng local font file cho mọi family được duyệt.
- Reduced motion vẫn tồn tại.
- Mọi opening effect có ID riêng, duration `1.3–1.5s`, ba hoặc bốn layer và asset tồn tại.
- Foreground có alpha thật, không trỏ tới `artwork.webp`, có peak/hold/exit hợp lệ
  và giữ sắc nét tới hold frame.
- Static opening artwork có clipping ancestor; opening overlay sau click không kế
  thừa static clipping và được phép vượt mép card.
- Optional-layer failure không fallback sang composite; Song Phụng vẫn dùng
  `demo-envelope-away`/pipeline legacy.

Nếu thay đổi có chủ đích một quyết định sản phẩm, cập nhật cả implementation, test và phần playbook này trong cùng thay đổi. Không chỉ sửa test để hợp thức hóa regression.
