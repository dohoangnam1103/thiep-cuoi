# Album đa kiểu hiển thị (Lưới / Ghép ảnh / 3D coverflow) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho người dùng chọn kiểu hiển thị album ảnh cưới (Lưới / Ghép ảnh / 3D coverflow) trong editor, áp dụng cho tất cả template.

**Architecture:** Gom block album đang lặp ở ~25 template về 1 component dùng chung `AlbumGallery` (trong `chungdoi-tpl-shared.tsx`) chứa 3 nhánh render + Lightbox. Layout 3D dùng Swiper `EffectCoverflow`, lazy-load qua `next/dynamic` (ssr:false) để không phình bundle cho thiệp grid/mosaic. Field `albumLayout` wire qua đúng chuỗi của `dressCodeColors`: prisma → to/from-demo-content → published-invitation select → ChungDoiDemoContent → EditorForm.

**Tech Stack:** Next.js (App Router), React client components, TypeScript, Prisma + better-sqlite3, Swiper, Tailwind. Test: `tsx --test` (node:test).

## Global Constraints

- Package manager: **npm** (`package-lock.json`). Cài lib bằng `npm install`.
- Grid là **default** — thiệp cũ (chưa có `albumLayout` trong DB) phải render y hệt hiện tại, không đổi 1 pixel.
- Type `AlbumLayout = "grid" | "mosaic" | "coverflow"` định nghĩa **1 chỗ duy nhất** (`src/lib/album-layout.ts`), mọi nơi khác import lại.
- Swiper chỉ được nạp khi `layout === "coverflow"` (dynamic import, `ssr: false`).
- `AlbumGallery` **không** render heading "Album Ảnh Cưới" — heading vẫn do từng template tự render (mỗi template có style/phụ đề riêng, vd dragon-phoenix có "/ 婚禮相冊").
- Build gate cho mọi task đụng UI: `npm run typecheck` phải pass. Task cuối chạy `npm run build`.
- Không đổi `GalleryUploader` (upload/sắp xếp ảnh giữ nguyên).
- KHÔNG thêm tùy chỉnh sâu (số cột, tốc độ, góc xoay) — cố định preset.

---

## File Structure

**Tạo mới:**
- `src/lib/album-layout.ts` — type `AlbumLayout` + `normalizeAlbumLayout()`. Nguồn chân lý duy nhất của type.
- `src/lib/album-layout.test.ts` — unit test cho `normalizeAlbumLayout`.
- `src/components/album-coverflow.tsx` — `'use client'`, component Swiper coverflow, lazy-loaded.

**Sửa:**
- `prisma/schema.prisma` — thêm cột `albumLayout` vào model `InvitationContent`.
- `src/lib/to-demo-content.ts` — map `albumLayout` (chiều DB → demo content).
- `src/lib/from-demo-content.ts` — thêm `albumLayout` vào `DemoContentFields` + seed ngược.
- `src/lib/published-invitation.ts` — `content: true` đã select đủ cột nên **không cần đổi** (xác nhận ở Task 1).
- `src/data/chungdoi-demo-content.ts` — thêm `albumLayout?: AlbumLayout` vào type `ChungDoiDemoContent`.
- `src/components/chungdoi-tpl-shared.tsx` — thêm export `AlbumGallery`.
- `src/components/chungdoi-tpl-floral-base.tsx` — thay `albumSection` grid bằng `<AlbumGallery/>`.
- 24 template tự render album — thay block grid+Lightbox bằng `<AlbumGallery/>` (Task 6).
- `src/app/editor/[id]/EditorForm.tsx` — thêm `AlbumLayoutField` + đọc `albumLayout` trong `buildPreviewContent`.

---

## Task 1: Data layer — type, validator, prisma field, wiring

**Files:**
- Create: `src/lib/album-layout.ts`
- Create: `src/lib/album-layout.test.ts`
- Modify: `prisma/schema.prisma` (model `InvitationContent`, sau dòng `dressCodeColors String @default("")`)
- Modify: `src/lib/to-demo-content.ts` (trong object trả về của `toDemoContent`, cạnh `dressCodeColors`)
- Modify: `src/lib/from-demo-content.ts` (`DemoContentFields` + object `content` trong `fromDemoContent`)
- Modify: `src/data/chungdoi-demo-content.ts` (type `ChungDoiDemoContent`)
- Verify: `src/lib/published-invitation.ts` (đã `content: true`, không đổi)

**Interfaces:**
- Produces: `AlbumLayout` (`"grid" | "mosaic" | "coverflow"`) và `normalizeAlbumLayout(v: string | null | undefined): AlbumLayout` từ `src/lib/album-layout.ts`. `ChungDoiDemoContent.albumLayout?: AlbumLayout`.

- [ ] **Step 1: Viết test thất bại cho validator**

Create `src/lib/album-layout.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAlbumLayout } from "./album-layout";

test("normalizeAlbumLayout giữ giá trị hợp lệ", () => {
  assert.equal(normalizeAlbumLayout("grid"), "grid");
  assert.equal(normalizeAlbumLayout("mosaic"), "mosaic");
  assert.equal(normalizeAlbumLayout("coverflow"), "coverflow");
});

test("normalizeAlbumLayout fallback về grid khi sai/null", () => {
  assert.equal(normalizeAlbumLayout(""), "grid");
  assert.equal(normalizeAlbumLayout(null), "grid");
  assert.equal(normalizeAlbumLayout(undefined), "grid");
  assert.equal(normalizeAlbumLayout("3d"), "grid");
  assert.equal(normalizeAlbumLayout("GRID"), "grid");
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx tsx --test src/lib/album-layout.test.ts`
Expected: FAIL — `Cannot find module './album-layout'`.

- [ ] **Step 3: Viết `album-layout.ts`**

Create `src/lib/album-layout.ts`:

```ts
export type AlbumLayout = "grid" | "mosaic" | "coverflow";

export function normalizeAlbumLayout(value: string | null | undefined): AlbumLayout {
  return value === "mosaic" || value === "coverflow" ? value : "grid";
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npx tsx --test src/lib/album-layout.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Thêm cột prisma**

Trong `prisma/schema.prisma`, model `InvitationContent`, ngay sau dòng `dressCodeColors String @default("")` thêm:

```prisma
  albumLayout   String @default("grid")
```

- [ ] **Step 6: Tạo migration + generate client**

Run: `npx prisma migrate dev --name add_album_layout`
Expected: Tạo migration mới, cột thêm với default "grid" cho hàng cũ, `prisma generate` chạy tự động.

- [ ] **Step 7: Thêm `albumLayout` vào type `ChungDoiDemoContent`**

Trong `src/data/chungdoi-demo-content.ts`, thêm import ở đầu file và field vào type (cạnh `dressCodeColors?: string;` khoảng dòng 54):

```ts
import type { AlbumLayout } from "@/lib/album-layout";
```

```ts
  albumLayout?: AlbumLayout;
```

- [ ] **Step 8: Map trong `to-demo-content.ts`**

Đầu file thêm import:

```ts
import { normalizeAlbumLayout } from "@/lib/album-layout";
```

Trong object trả về của `toDemoContent`, ngay sau `dressCodeColors: c?.dressCodeColors ?? "",` thêm:

```ts
    albumLayout: normalizeAlbumLayout(c?.albumLayout),
```

- [ ] **Step 9: Wire `from-demo-content.ts`**

Trong type `DemoContentFields`, sau `dressCodeColors: string;` thêm:

```ts
  albumLayout: string;
```

Trong object `content` của `fromDemoContent`, sau `dressCodeColors: demo.dressCodeColors ?? "",` thêm:

```ts
      albumLayout: demo.albumLayout ?? "grid",
```

- [ ] **Step 10: Xác nhận `published-invitation.ts` không cần đổi**

Đọc `src/lib/published-invitation.ts`: `include.content: true` chọn toàn bộ cột nên `albumLayout` tự có mặt. Không sửa file.

- [ ] **Step 11: Typecheck + test toàn bộ**

Run: `npm run typecheck && npx tsx --test src/lib/album-layout.test.ts`
Expected: typecheck pass, test pass.

- [ ] **Step 12: Commit**

```bash
git add src/lib/album-layout.ts src/lib/album-layout.test.ts prisma/schema.prisma prisma/migrations src/lib/to-demo-content.ts src/lib/from-demo-content.ts src/data/chungdoi-demo-content.ts
git commit -m "feat(album): thêm field albumLayout wiring qua data layer"
```

---

## Task 2: Cài Swiper + component coverflow lazy-load

**Files:**
- Modify: `package.json` (qua `npm install`)
- Create: `src/components/album-coverflow.tsx`

**Interfaces:**
- Consumes: `AlbumLayout` từ `src/lib/album-layout.ts` (không trực tiếp; nhận `photos`, `accent`, `onOpen`).
- Produces: default export `CoverflowGallery` — props `{ photos: string[]; accent: string; onOpen: (index: number) => void }`.

- [ ] **Step 1: Cài Swiper**

Run: `npm install swiper`
Expected: `swiper` xuất hiện trong `dependencies`, `package-lock.json` cập nhật.

- [ ] **Step 2: Viết `album-coverflow.tsx`**

Create `src/components/album-coverflow.tsx`:

```tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import type { CSSProperties } from "react";

type Props = {
  photos: string[];
  accent: string;
  onOpen: (index: number) => void;
};

export default function CoverflowGallery({ photos, accent, onOpen }: Props) {
  const canLoop = photos.length > 2;
  return (
    <div
      className="w-full"
      style={{ ["--swiper-navigation-color" as keyof CSSProperties]: accent } as CSSProperties}
    >
      <Swiper
        modules={[EffectCoverflow, Autoplay, Navigation]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop={canLoop}
        navigation
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        coverflowEffect={{ rotate: 40, stretch: 0, depth: 180, modifier: 1, slideShadows: true }}
        className="!py-6"
      >
        {photos.map((src, i) => (
          <SwiperSlide key={src} style={{ width: 220 }}>
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl border"
              style={{ borderColor: accent }}
            >
              <img src={src} alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Nếu báo thiếu type `swiper/css` (side-effect import CSS), thêm `declare module "swiper/css";` vào file `.d.ts` toàn cục (`src/types.d.ts` nếu có, hoặc tạo `src/swiper-css.d.ts` với `declare module "swiper/css"; declare module "swiper/css/effect-coverflow"; declare module "swiper/css/navigation";`) rồi typecheck lại.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/album-coverflow.tsx src/swiper-css.d.ts
git commit -m "feat(album): thêm Swiper coverflow component lazy-load"
```

---

## Task 3: Component dùng chung `AlbumGallery`

**Files:**
- Modify: `src/components/chungdoi-tpl-shared.tsx` (thêm export `AlbumGallery`; đã có `useLightbox`, `Lightbox`, `hexToRgba`)

**Interfaces:**
- Consumes: `AlbumLayout` từ `@/lib/album-layout`; `useLightbox`, `Lightbox`, `hexToRgba` (cùng file); `CoverflowGallery` default export từ `./album-coverflow` (dynamic).
- Produces: `AlbumGallery` — props `{ photos: string[]; layout?: AlbumLayout; accent: string; gridAspect?: string }`. Trả `null` khi `photos.length === 0`. Không render heading.

- [ ] **Step 1: Thêm imports vào đầu `chungdoi-tpl-shared.tsx`**

Ở đầu file (cùng khối import), thêm:

```tsx
import dynamic from "next/dynamic";
import type { AlbumLayout } from "@/lib/album-layout";

const CoverflowGallery = dynamic(() => import("./album-coverflow"), { ssr: false });
```

- [ ] **Step 2: Thêm component `AlbumGallery`**

Thêm vào cuối `chungdoi-tpl-shared.tsx`:

```tsx
export function AlbumGallery({
  photos,
  layout = "grid",
  accent,
  gridAspect = "aspect-[3/4]",
}: {
  photos: string[];
  layout?: AlbumLayout;
  accent: string;
  gridAspect?: string;
}) {
  const { lightbox, setLightbox } = useLightbox(photos.length);
  if (photos.length === 0) return null;

  const border = hexToRgba(accent, 0.3);

  const lightboxEl = <Lightbox gallery={photos} index={lightbox} setIndex={setLightbox} accent={accent} />;

  if (layout === "coverflow") {
    return (
      <div className="w-full">
        <CoverflowGallery photos={photos} accent={accent} onOpen={setLightbox} />
        {lightboxEl}
      </div>
    );
  }

  if (layout === "mosaic") {
    const shown = photos.slice(0, 5);
    const extra = Math.max(0, photos.length - 5);
    // Ô đầu chiếm 2x2, 4 ô sau 1x1. Grid 2 cột mobile / 3 cột md.
    const spanFor = (i: number) => (i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1");
    return (
      <div className="w-full max-w-[400px] md:max-w-[560px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 [grid-auto-rows:1fr]">
          {shown.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightbox(i)}
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border ${spanFor(i)}`}
              style={{ borderColor: border }}
            >
              <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
              {i === shown.length - 1 && extra > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <span className="text-lg font-semibold text-white">+{extra}</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
        {lightboxEl}
      </div>
    );
  }

  // grid (default) — giữ hành vi hiện tại: 2 cột, 4 ảnh, overlay +N
  const shown = photos.slice(0, 4);
  const extra = Math.max(0, photos.length - 4);
  return (
    <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
      {shown.map((src, i) => (
        <button
          key={src}
          type="button"
          onClick={() => setLightbox(i)}
          className={`group relative ${gridAspect} cursor-pointer overflow-hidden rounded-xl border`}
          style={{ borderColor: border }}
        >
          <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
          {i === shown.length - 1 && extra > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="text-lg font-semibold text-white">+{extra}</span>
            </div>
          ) : null}
        </button>
      ))}
      {lightboxEl}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/chungdoi-tpl-shared.tsx
git commit -m "feat(album): thêm AlbumGallery dùng chung (grid/mosaic/coverflow)"
```

---

## Task 4: Wire `floral-base` dùng `AlbumGallery`

**Files:**
- Modify: `src/components/chungdoi-tpl-floral-base.tsx` (`albumSection` ~line 88-106; destructure `content` ~line 57; `albumShown`/`albumExtra`/`useLightbox` ~line 63-65)

**Interfaces:**
- Consumes: `AlbumGallery` từ `chungdoi-tpl-shared`.

- [ ] **Step 1: Import `AlbumGallery`**

Trong dòng import từ `./chungdoi-tpl-shared`, thêm `AlbumGallery` vào danh sách named imports.

- [ ] **Step 2: Thay `albumSection`**

Thay khối `const albumSection = albumShown.length > 0 ? (...) : null;` (line ~88-106) bằng:

```tsx
  const albumSection = gallery.length > 0 ? (
    <section className="relative flex w-full flex-col items-center gap-6">
      {albumDecor.map((d, i) => (
        <img key={`ad-${i}`} src={d.src} alt="" aria-hidden className={`pointer-events-none absolute -z-10 h-auto w-auto max-w-none object-contain ${d.flip ? "-scale-x-100" : ""} ${d.className}`} />
      ))}
      <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Album Ảnh Cưới</FloralHeading>
      <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={P.accent} />
    </section>
  ) : null;
```

- [ ] **Step 3: Xoá code album cũ giờ không dùng**

Xoá `const albumShown = gallery.slice(0, 4);` và `const albumExtra = Math.max(0, gallery.length - 4);` (line ~63-64). Xoá `const { lightbox, setLightbox } = useLightbox(gallery.length);` (line ~65) **nếu** `lightbox`/`setLightbox` không còn dùng ở nơi khác trong file (grep trong file để chắc). Bỏ `useLightbox` khỏi import nếu không còn dùng.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Nếu báo `lightbox`/`setLightbox`/`useLightbox` unused → đã xoá đúng; nếu báo còn dùng → giữ lại.

- [ ] **Step 5: Commit**

```bash
git add src/components/chungdoi-tpl-floral-base.tsx
git commit -m "feat(album): floral-base dùng AlbumGallery"
```

---

## Task 5: Editor UI — chọn layout

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx` (`buildPreviewContent` ~line 188-234; accordion "Album ảnh" ~line 2083-2085; thêm component `AlbumLayoutField`)

**Interfaces:**
- Consumes: `content.albumLayout` (đã có trong `ChungDoiDemoContent`); helper `seed`, `field` (trong file).
- Produces: hidden input `name="albumLayout"` để action/`buildPreviewContent` đọc.

- [ ] **Step 1: Đọc `albumLayout` trong `buildPreviewContent`**

Trong object trả về của `buildPreviewContent` (`src/app/editor/[id]/EditorForm.tsx`), sau `dressCodeColors: read("dressCodeColors"),` (line ~234) thêm:

```tsx
    albumLayout: normalizeAlbumLayout(read("albumLayout")),
```

Thêm import ở đầu file:

```tsx
import { normalizeAlbumLayout } from "@/lib/album-layout";
```

- [ ] **Step 2: Viết component `AlbumLayoutField`**

Thêm vào `EditorForm.tsx` (gần `DressCodeField`, cùng module). Dùng cùng cơ chế hidden input + `dispatchEvent` như `DressCodeField` để live-preview cập nhật:

```tsx
const ALBUM_LAYOUT_OPTIONS: { value: AlbumLayout; label: string }[] = [
  { value: "grid", label: "Lưới" },
  { value: "mosaic", label: "Ghép ảnh" },
  { value: "coverflow", label: "3D" },
];

function AlbumLayoutField({ defaultValue }: { defaultValue: string }) {
  const [layout, setLayout] = useState<AlbumLayout>(() => normalizeAlbumLayout(defaultValue));
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [layout]);

  return (
    <div className="sm:col-span-2">
      <input ref={hiddenRef} type="hidden" name="albumLayout" value={layout} />
      <span className={labelClass}>Kiểu hiển thị album</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {ALBUM_LAYOUT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLayout(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              layout === opt.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Thêm import `AlbumLayout` ở đầu file: `import { normalizeAlbumLayout, type AlbumLayout } from "@/lib/album-layout";` (gộp với import Step 1).

- [ ] **Step 3: Gắn `AlbumLayoutField` vào accordion "Album ảnh"**

Thay khối accordion (line ~2083-2085) bằng:

```tsx
        <Accordion title="Album ảnh" icon="▧">
          <AlbumLayoutField defaultValue={seed("albumLayout", field(content, "albumLayout") ?? "grid")} />
          <div className="mt-4">
            <GalleryUploader initial={Array.isArray(draft?.galleryUrl) ? (draft!.galleryUrl as string[]) : gallery} />
          </div>
        </Accordion>
```

Nếu `field(content, "albumLayout")` báo lỗi type (field key không có `albumLayout`), kiểm tra kiểu `content` prop của form — bổ sung `albumLayout` vào nếu cần, hoặc dùng `(content as { albumLayout?: string })?.albumLayout ?? "grid"`.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat(album): editor cho chọn kiểu hiển thị album"
```

---

## Task 6: Migrate 24 template tự render album

**Files (mỗi file: block album `<div className="grid grid-cols-2 ...">...<Lightbox/>` → `<AlbumGallery/>`):**
- `chungdoi-tpl-baroque-gold.tsx`, `chungdoi-tpl-boho-floral-green.tsx`, `chungdoi-tpl-brocade-flower-red.tsx`, `chungdoi-tpl-chateau-blue.tsx`, `chungdoi-tpl-chateau-green.tsx`, `chungdoi-tpl-cherry-blossom-pink.tsx`, `chungdoi-tpl-co-ba.tsx`, `chungdoi-tpl-double-dragon.tsx`, `chungdoi-tpl-dragon-phoenix-v2-red.tsx`, `chungdoi-tpl-dragon-phoenix-v3-red.tsx`, `chungdoi-tpl-dragon-phoenix.tsx`, `chungdoi-tpl-elegant-leaf-green.tsx`, `chungdoi-tpl-glass-garden-green.tsx`, `chungdoi-tpl-hoa-tinh-red.tsx`, `chungdoi-tpl-nhat-binh.tsx`, `chungdoi-tpl-phoenix.tsx`, `chungdoi-tpl-qasr-gold.tsx`, `chungdoi-tpl-qasr-green.tsx`, `chungdoi-tpl-song-hy.tsx`, `chungdoi-tpl-song-long-xanh.tsx`, `chungdoi-tpl-spring-garden-blue.tsx`, `chungdoi-tpl-spring-garden-red.tsx`
- **Xác minh riêng:** `chungdoi-tpl-boho-floral-brown.tsx`, `chungdoi-tpl-crystal-floral-blue.tsx` — vừa import `FloralInvitation` vừa có chuỗi "Album Ảnh". Grep trong từng file: nếu album render qua `FloralInvitation` thì đã xong ở Task 4, chỉ cần xử lý block "Album Ảnh" tự render (nếu có) hoặc bỏ qua.

**Interfaces:**
- Consumes: `AlbumGallery` từ `chungdoi-tpl-shared`.

**Transform pattern (áp cho từng file — ví dụ minh hoạ: `chungdoi-tpl-dragon-phoenix.tsx`).**

- [ ] **Step 1: Với mỗi template — thêm `AlbumGallery` vào import từ `./chungdoi-tpl-shared`**

- [ ] **Step 2: Thay block album — ví dụ dragon-phoenix (line ~219-233)**

Trước:

```tsx
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px]">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {galleryShown.map((src, i) => (
                      <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(GOLD, 0.25) }}>
                        <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                        {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                            <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
                <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={GOLD} />
```

Sau (giữ nguyên `aspect-square` cũ qua `gridAspect`, giữ accent `GOLD`):

```tsx
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px]">
                  <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GOLD} gridAspect="aspect-square" />
                </div>
```

Quy tắc chung mỗi template:
- `photos={gallery}` — dùng biến gallery đầy đủ của template (không phải `gallery.slice(...)`).
- `accent=` — hằng màu accent của template đó (vd `GOLD`, `P.accent`, biến màu tương ứng).
- `gridAspect=` — copy đúng class aspect cũ của template (`aspect-square` hoặc `aspect-[3/4]`...). Nếu template cũ không set aspect thì bỏ prop (dùng default `aspect-[3/4]`).
- Bọc ngoài `{gallery.length > 0 ? (...heading + AlbumGallery...) : null}` — giữ nguyên điều kiện + heading cũ.

- [ ] **Step 3: Xoá code không dùng trong template**

Sau khi thay: xoá `const galleryShown = ...`, `const galleryExtra = ...`, và `const { lightbox, setLightbox } = useLightbox(...)` **nếu** không còn dùng nơi khác. Bỏ `useLightbox`, `Lightbox`, `hexToRgba` khỏi import nếu giờ không còn tham chiếu (typecheck sẽ báo unused).

- [ ] **Step 4: Sau MỖI template — typecheck**

Run: `npm run typecheck`
Expected: PASS. Sửa import unused nếu có.

- [ ] **Step 5: Grep xác nhận không còn block album cũ**

Run: `grep -rn "gallery.slice" src/components/chungdoi-tpl-*.tsx`
Expected: Không còn kết quả nào ở template album (chỉ còn nếu là dùng khác, kiểm tra thủ công).

- [ ] **Step 6: Commit (có thể chia nhỏ theo nhóm template)**

```bash
git add src/components/chungdoi-tpl-*.tsx
git commit -m "feat(album): migrate template tự render sang AlbumGallery"
```

---

## Task 7: Verify build + UI trên dev server

**Files:** không sửa (trừ khi phát hiện bug).

- [ ] **Step 1: Build đầy đủ**

Run: `npm run build`
Expected: PASS, không lỗi type.

- [ ] **Step 2: Chạy unit test**

Run: `npm run test:unit`
Expected: PASS (gồm `album-layout.test.ts`).

- [ ] **Step 3: Verify UI trên dev server (preview tools)**

Khởi động dev server. Mở 1 thiệp trong editor:
- Đổi layout **Lưới** → xác nhận render y hệt trước (2 cột, 4 ảnh, +N).
- Đổi **Ghép ảnh** → mosaic ô to-nhỏ, click mở lightbox.
- Đổi **3D** → coverflow xoay, autoplay ~3.5s, có mũi tên desktop; `preview_resize` mobile → vuốt được; mở lightbox thì autoplay không phá layout.
- Kiểm tra console/network không lỗi (Swiper chỉ nạp khi chọn 3D — xem network chỉ request chunk swiper khi ở coverflow).

- [ ] **Step 4: Verify thiệp cũ mặc định grid**

Mở 1 thiệp đã publish trước đây (DB chưa có albumLayout hoặc = "grid") → album render grid như cũ, không đổi.

- [ ] **Step 5: Commit (nếu có fix)**

```bash
git add -A
git commit -m "fix(album): xử lý lỗi phát hiện khi verify"
```

---

## Self-Review (đã chạy)

**Spec coverage:**
- Grid/mosaic/coverflow → Task 3. Default grid giữ nguyên → Task 3 (grid branch) + Task 4/6 truyền `gridAspect`. ✓
- Áp mọi template → Task 4 (floral-base) + Task 6 (24 template). ✓
- Swiper coverflow + autoplay → Task 2. ✓
- Lazy-load Swiper (không phình bundle) → Task 3 (`next/dynamic ssr:false`) + Task 7 Step 3 verify network. ✓
- Wiring `albumLayout` → Task 1. ✓
- Editor UI segmented → Task 5. ✓
- Type 1 chỗ → `src/lib/album-layout.ts` Task 1. ✓

**Placeholder scan:** Không có TBD/TODO. Code cụ thể ở mọi step. Task 6 dùng transform pattern + ví dụ đầy đủ (dragon-phoenix) do 24 edit gần như giống hệt về mặt cơ học. ✓

**Type consistency:** `AlbumLayout`, `normalizeAlbumLayout` khai báo Task 1, dùng nhất quán ở Task 2/3/5. `AlbumGallery` props (`photos/layout/accent/gridAspect`) khớp giữa Task 3 (định nghĩa) và Task 4/6 (dùng). `CoverflowGallery` props (`photos/accent/onOpen`) khớp Task 2 ↔ Task 3. ✓

**Ghi chú rủi ro:** `boho-floral-brown` + `crystal-floral-blue` có mặt ở cả 2 danh sách → Task 6 yêu cầu verify riêng trước khi sửa.
