# Album đa kiểu hiển thị (Lưới / Ghép ảnh / 3D coverflow)

Ngày: 2026-07-24

## Mục tiêu

Cho phép người dùng chọn **kiểu hiển thị album ảnh cưới** trong editor, áp dụng cho **tất cả template**. Ba kiểu:

- **Lưới** (`grid`) — mặc định, giữ nguyên hành vi hiện tại (2 cột, 4 ảnh, overlay `+N`).
- **Ghép ảnh** (`mosaic`) — bố cục ô to-nhỏ xen kẽ.
- **3D** (`coverflow`) — carousel 3D kiểu Apple coverflow, auto-play, vuốt/mũi tên.

## Hiện trạng (đã khảo sát)

Album đang bị **lặp code ở ~25 chỗ**:
- `chungdoi-tpl-floral-base.tsx` (`albumSection`, line ~88) — nhiều template floral dùng chung.
- ~24 template tự render album riêng (vd `chungdoi-tpl-dragon-phoenix.tsx` line ~213), mỗi cái tự `gallery.slice(0,4)` + overlay `+N` + `Lightbox`.

`chungdoi-tpl-shared.tsx` đã có sẵn:
- `useLightbox`, `Lightbox` — dùng lại được cho cả 3 layout.
- `SharedCarousel` (line ~382) — carousel phẳng, KHÔNG phải coverflow 3D. Không dùng cho layout 3D mới.

Nếu nhồi 3 layout vào từng chỗ → 75 nhánh code, bất khả bảo trì. Vì vậy phải gom về 1 component dùng chung trước.

## Kiến trúc

### 1. Component dùng chung `AlbumGallery`

Tạo trong `chungdoi-tpl-shared.tsx`:

```tsx
type AlbumLayout = "grid" | "mosaic" | "coverflow";

function AlbumGallery({
  photos,
  layout,
  accent,
}: {
  photos: string[];
  layout: AlbumLayout;
  accent: string;
}): JSX.Element | null
```

- Tự chứa 3 nhánh render + `useLightbox`/`Lightbox` bên trong.
- Trả `null` khi `photos.length === 0`.
- KHÔNG render heading ("Album Ảnh Cưới") — heading vẫn do từng template render như hiện tại (vì mỗi template có style heading + phụ đề khác nhau, vd dragon-phoenix có "/ 婚禮相冊"). Component chỉ lo phần lưới ảnh + lightbox.

### 2. Thay thế block album lặp lại

- `floral-base`: thay `albumSection` grid bằng `<AlbumGallery photos={gallery} layout={albumLayout} accent={P.accent} />`, giữ nguyên `FloralHeading` + `albumDecor`.
- 24 template tự render: thay block `grid grid-cols-2 ... Lightbox` bằng `<AlbumGallery ... />`, giữ nguyên heading riêng của template.
- Verify từng template lúc implement (grep "Album Ảnh" / "gallery.slice") để không bỏ sót; một số template có thể có bố cục album đặc biệt — nếu có sẽ ghi chú và xử lý riêng.

## Ba layout

### Lưới (`grid`) — mặc định
Giữ nguyên hiện tại: `grid grid-cols-2 gap-3`, hiển thị 4 ảnh đầu (`slice(0,4)`), ô cuối overlay `+N` nếu còn ảnh. Click mở lightbox. Đây là default để mọi thiệp cũ không đổi giao diện.

### Ghép ảnh (`mosaic`)
Bố cục ô to-nhỏ xen kẽ bằng CSS grid với span cố định:
- Grid 2 cột (mobile) / có thể 3 cột (md).
- Ảnh đầu chiếm ô lớn (2x2), các ảnh sau 1x1 xen kẽ.
- Hiển thị tối đa ~5 ảnh; ô cuối overlay `+N` nếu còn.
- Aspect ratio đặt cố định để layout không vỡ khi ảnh thiếu (nếu < 5 ảnh thì grid tự co, không để ô trống loang lổ — dùng số ảnh thực để chọn preset span).
- Click mở lightbox.

### 3D (`coverflow`)
- Dùng **Swiper** module `EffectCoverflow` (`swiper` package, ~19kB gzip, 0 deps runtime).
- Import động chỉ `swiper/react` + `swiper/modules` (EffectCoverflow, Autoplay, Navigation) + CSS cần thiết.
- Props: `effect="coverflow"`, `centeredSlides`, `slidesPerView="auto"`, `grabCursor`, `loop` (khi đủ ảnh), `autoplay` (delay ~3s, dừng khi hover/tương tác), `navigation` (mũi tên desktop), swipe mobile sẵn.
- `coverflowEffect`: rotate ~40, depth ~180, modifier 1, slideShadows true.
- Hiển thị **toàn bộ** ảnh (không cắt còn 4).
- Mỗi slide width cố định (vd 220-240px), ảnh bo góc.
- Style accent theo template qua CSS variables (`--swiper-navigation-color`, `--swiper-pagination-color`) set inline theo `accent`.
- Click ảnh mở lightbox.
- Autoplay dừng lại (không phá lightbox): khi mở lightbox thì Swiper autoplay tạm dừng.

## Data & wiring

Theo đúng chuỗi của một option hiện có (`dressCodeColors`):

1. **Prisma** (`schema.prisma`, model `InvitationContent`): thêm
   `albumLayout String @default("grid")`. Chạy migration.
2. **`to-demo-content.ts`**: map `albumLayout: c?.albumLayout ?? "grid"` (validate về 1 trong 3 giá trị, sai thì fallback "grid").
3. **`from-demo-content.ts`**: đưa `albumLayout` vào `DemoContentFields` + seed ngược.
4. **`published-invitation.ts`**: thêm `albumLayout: true` vào select content.
5. **`chungdoi-demo-content.ts`** (type `ChungDoiDemoContent`): thêm `albumLayout?: AlbumLayout` (optional, default "grid" khi đọc).
6. **EditorForm**: đọc `read("albumLayout")`, đưa vào seed + `content` object gửi action; thêm UI chọn layout.

### Type `AlbumLayout`
Định nghĩa 1 chỗ (vd trong `chungdoi-tpl-shared.tsx` hoặc `chungdoi-demo-content.ts`) và export dùng chung, tránh khai báo trùng.

## Editor UI

Trong accordion "Album ảnh" (`EditorForm.tsx` line ~2083), thêm phía trên/dưới `GalleryUploader` một nhóm **segmented control 3 nút**: Lưới / Ghép ảnh / 3D.
- Theo style component chọn hiện có trong form (giống nhóm nút chọn khác trong editor).
- Client component với `useState`, ghi giá trị vào hidden input `name="albumLayout"` để action đọc như các field khác.
- Seed giá trị ban đầu từ `content.albumLayout` (hoặc draft localStorage nếu có, theo pattern `seed(...)`).

## Testing / verify

- `pnpm build` (hoặc lệnh build của project) phải pass — TS type cho `AlbumLayout` xuyên suốt.
- Verify UI trên dev server: mở 1 thiệp, đổi qua 3 layout, kiểm tra render + lightbox + autoplay coverflow + swipe mobile (preview_resize mobile).
- Kiểm tra thiệp cũ (không có `albumLayout` trong DB) mặc định ra "grid" giống hệt trước.
- Bundle: xác nhận Swiper chỉ nạp khi layout = coverflow (dynamic import) để không phình bundle cho thiệp dùng grid/mosaic.

## Ngoài phạm vi (YAGNI)

- Không cho tùy chỉnh sâu (số cột, tốc độ autoplay, góc xoay) — cố định preset đẹp.
- Không thêm layout thứ 4.
- Không đổi cách upload/sắp xếp ảnh (giữ `GalleryUploader` nguyên).
