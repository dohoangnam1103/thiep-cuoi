# Bộ quy tắc tạo mẫu thiệp 2D

Tổng hợp từ audit toàn bộ mẫu thiệp demo đang có: **55 manifest** đã đăng ký trong `src/data/templates/`, 105 file `chungdoi-tpl-*.tsx` (phần dư là mẫu đã retire — xem `src/data/retired-template-slugs.ts`, đừng lấy làm mẫu tham chiếu).

Tài liệu này trả lời câu hỏi "làm sao thêm một mẫu thiệp 2D phong cách mới". Phần quy trình clone theo ảnh gốc nằm ở [template-clone-quality.md](template-clone-quality.md) — đọc kèm, không lặp lại ở đây.

Ngoài phạm vi: 3 trải nghiệm 3D/WebGL (`forest-wedding-journey`, `beach-wedding-journey`, `dalat-journey`, các trang `home-2/lab`). Chúng không đi qua pipeline manifest.

---

## 1. Chọn tầng trước khi viết code

Đang có 3 tầng. Chọn sai tầng là nguyên nhân phổ biến nhất làm một mẫu mới phình từ 40 dòng lên 400 dòng.

| Tầng | Khi nào dùng | Manifest | Renderer |
|---|---|---|---|
| **A — factory art** | Chỉ đổi bảng màu + font + artwork. Bố cục section giữ nguyên. | `createArtTemplateManifest`, ~1.1–1.4K | Wrapper 33 dòng gọi `ArtInvitation` |
| **B — factory họ** | Thêm một biến thể màu cho họ đã có (porcelain…) | `createPorcelainTemplateManifest`, ~2.0–2.6K | Wrapper gọi base của họ |
| **C — bespoke** | Bố cục section khác, gimmick cấu trúc (gatefold, sleeve, vé, hồ sơ…) | Manifest viết tay 3.7–7.5K, `demoContent` đầy đủ | Renderer riêng 12–14K |

Quy tắc quyết định: **nếu chỉ thay đổi được bằng token màu, font và ảnh artwork thì bắt buộc dùng tầng A.** Chỉ leo lên tầng C khi thứ tự/hình dạng section thực sự khác.

Tầng A vẫn tạo ra phong cách rất khác nhau — `swiss-brutalist`, `y2k-chrome`, `zen-sand`, `dong-ho-folk` đều là tầng A.

---

## 2. Chuỗi tên bị khoá cứng

Registrar (`scripts/register-template-manifests.ts`) ép các tên sau phải khớp nhau. Lệch một chỗ là fail ngay lúc generate:

```
src/data/templates/<slug>.manifest.ts   ← tên file
  export const manifest = defineTemplateManifest({
    slug: "<slug>",                     ← phải bằng tên file
    viRouteSlug: "<slug-tieng-viet>",   ← duy nhất toàn hệ thống
    rendererExport: "<Ten>Invitation",
  })
src/components/chungdoi-tpl-<slug>.tsx  ← phải tồn tại, export đúng rendererExport
public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/<slug_gach_duoi>.webp
```

Preview stem = `slug.replaceAll("-", "_")`. Thư mục `en/` là tên legacy, **không phải locale** — đừng đổi.

Không bao giờ sửa tay `src/data/templates/generated-data.ts` và `src/components/generated/template-renderers.tsx`. Chạy registrar.

---

## 3. Manifest — trường bắt buộc

```ts
export const manifest = defineTemplateManifest({
  slug, viRouteSlug, rendererExport,
  heroImageCount: 0 | 1 | 2,   // khai ở đây, KHÔNG thêm vào set legacy
  catalog: { name, title, description, category, color, highlights, isNew, ... },
  theme: ChungDoiThemeConfig,   // 13 token, xem §4
  demoContent: ChungDoiDemoContent,
  i18n: { vi: { name, description } },
  assets: [...],                // mọi path phải bắt đầu bằng "/" và tồn tại trong public/
});
```

Ràng buộc registrar kiểm:

- `demoContent.slug === manifest.slug`
- `catalog.name`, `catalog.description`, `viRouteSlug`, `rendererExport` không rỗng
- i18n có đủ mọi locale trong `TEMPLATE_MANIFEST_LOCALES` (hiện chỉ `["vi"]`)
- mọi asset tồn tại thật trên đĩa
- `slug`, `viRouteSlug`, `openingEffect.id` duy nhất
- có `openingEffect` → `assertValidArtOpeningEffect` phải pass, và `plateSrc` + mọi `layer.src` phải có mặt trong `assets`

`heroImageCount` lấy từ manifest trước khi mới fallback về `DUAL_HERO_IMAGE_TEMPLATE_SLUGS` / `HERO_IMAGE_TEMPLATE_SLUGS` (`src/data/editor-template-capabilities.ts`). Mẫu mới **chỉ khai trong manifest**.

**`demoContent.music` phải là `null`.** Test khoá cứng: mọi entry mới dùng nhạc mặc định dùng chung. Factory nhận tham số `music` nhưng đó là đường dùng cho dữ liệu legacy.

Đừng viết `demoContent` từ đầu — gọi `createTemplateDemoContent({ slug, primaryColor, fontFamily, music, galleryCount })`. Hàm này điền sẵn cặp mẫu (An Nhiên / Minh Khôi), gia đình, Riverside Palace, 4 dòng schedule, dress code, 1 lời chúc, bank mặc định, gallery `/chungdoi/images/gallery/<gallerySlug>/photo-N.webp`.

---

## 4. Bảng màu: 13 token, khai từ 6 màu phẳng

Đừng gõ tay 13 token. `createArtTemplateManifest` nở chúng ra từ 6 màu:

| Đầu vào | Suy ra |
|---|---|
| `outer` | nền trang |
| `card` | `guestBoxBg` |
| `ink` | chữ chính |
| `muted` | `dividerTo`, `guestBoxBorder` |
| `accent` | `buttonBg` |
| `buttonText` | chữ trên nút |

Cố định: `dividerFrom: "transparent"`, `particleColors: [accent, ink, card]`, `sealType: "heart"`.

`highlights` là tuple đúng **3 phần tử**.

`particleType` chỉ nhận `happiness | leaves | flowers | confetti`. `sealType` chỉ nhận `happiness | heart | null`.

`gallerySlug` ở tầng A giới hạn trong 4 bộ ảnh dùng chung: `arch-sage`, `editorial-noir`, `ticket-terracotta`, `zen-sand`. Muốn bộ ảnh riêng thì phải bổ sung ảnh vào `public/chungdoi/images/gallery/<slug>/` và mở rộng type.

---

## 5. Font: đúng 2 family mỗi thiệp

Hệ 2 font ở `src/lib/invitation-fonts.ts`:

- **display** — tên cô dâu chú rể, heading, label. Là 1 trong 14 class `.font-art-*` khai trong `src/app/globals.css`: `uni, haydon, new-eddy, qellia, pattaya, signora, lora, aghita, nautigal, built, alex, pacifico, helvetica, marvin` (+ `beau-rivage` trong bảng ghép).
- **body** — mọi text còn lại. Chỉ 2 lựa chọn: `.font-body-serif` (Lora) hoặc `.font-body-sans` (Be Vietnam Pro). **Suy ra tự động từ display**, không khai tay.

Quy tắc ghép: thư pháp/serif trang trí → body serif; brush đậm/grotesque → body sans.

Ràng buộc test:

- `config.displayFontClass` phải là class `.font-art-*` đã có trong `globals.css`
- `demoContent.theme.fontFamily` phải khớp **đúng chuỗi** family khai trong test/manifest
- `coupleClass` và `headingClass` **không được** chứa `font-sans` hoặc `font-serif`

Thêm font mới = thêm `@font-face` + class `.font-art-*` trong `globals.css` + thêm dòng vào `BODY_FONT_BY_DISPLAY`. Sau khi sửa `globals.css`: **`rm -rf .next`**, không thì Tailwind v4 giữ cache class cũ.

---

## 6. Renderer tầng A — khuôn 33 dòng

Copy nguyên `src/components/chungdoi-tpl-swiss-brutalist.tsx`, đổi `config` và tên export:

```tsx
"use client";
import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = { /* ... */ } satisfies ArtInvitationConfig;

export function XxxInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}
```

Bắt buộc:

- `"use client"`
- prop đúng `{ content: ChungDoiDemoContent }` — generated registry `satisfies Record<GeneratedTemplateSlug, ComponentType<{ content: ChungDoiDemoContent }>>`
- `useTranslations("invitationTemplate")`
- **không có `style={`** trong file (test grep). Mọi thứ qua Tailwind class.
- `satisfies ArtInvitationConfig`, không `as`

`ArtInvitationConfig` có 19 field: `layout`, `artwork`, `pageClass`, `heroClass`, `surfaceClass`, `sectionClass`, `inkClass`, `mutedClass`, `accentTextClass`, `accentBgClass`, `borderClass`, `buttonClass`, `displayFontClass`, `coupleClass`, `headingClass`, `imageClass`, `radiusClass`, `accentHex`, `inkHex`, + `giftLayout?: "grid" | "flip"`.

`layout` chọn trong `folk | split | dark-stage | poster | quiet | chrome`. `folk`, `poster`, `quiet` render **2 ảnh hero** so le (trái/phải); các layout còn lại render 1 ảnh giữa.

---

## 7. Không sửa `ArtInvitation` — nó bị test khoá

Layout dùng chung `chungdoi-tpl-art-invitation.tsx` (555 dòng) bị khoá bằng assertion regex. Phong cách mới điều chỉnh **qua `config`**, không qua sửa file này.

Những gì bị khoá:

- một cột: `data-invitation-column="true"`, `max-w-[900px]` (khung ngoài) và `max-w-[760px]` (cột nội dung)
- **không** được xuất hiện `(sm|md|lg|xl):grid-cols` — cấm bố cục 2 cột responsive
- **không** được xuất hiện `text-left` — mọi thứ căn giữa
- `main` = `relative z-40 min-h-[100dvh]`
- hero: `data-artwork-hero="true"`, `min-h-[clamp(760px,100svh,1080px)]`, và **không** được có `h-[150px|180px|220px|260px]` (chống hồi quy về dải artwork mỏng)
- parallax: `invitation-parallax-motif`, `data-parallax="artwork"`, `pointer-events-none fixed`
- `function contentRadiusClass()` trả `"rounded-[1.5rem]"`, dùng ở **≥ 8** chỗ; `AlbumGallery` và `GiftQrGrid` phải nhận `radiusClass={contentRadiusClass()}`
- `SharedWishForm accent={config.accentHex} centered`
- `chungdoi-tpl-shared.tsx` phải chứa `radiusClass = "rounded-xl"` và `cn("size-32 bg-white`

Thứ tự section cố định (14 khối): hero artwork → ảnh hero → lời mời + 2 gia đình → 2 `EventCard` (lễ / tiệc) → countdown + nút Google Calendar → lịch tháng → album → timeline (ẩn nếu `schedule` rỗng) → map + nút chỉ đường → dress code (ẩn nếu không có màu hợp lệ) → RSVP → sổ lưu bút → quà (grid hoặc flip) → footer.

Section tự ẩn khi thiếu dữ liệu, nên **không cần** thêm cờ bật/tắt.

Muốn thứ tự khác → tầng C, renderer riêng. Đừng thêm nhánh `if (layout === ...)` vào file dùng chung.

---

## 8. Trang trí `cardImages` — 3 cái bẫy đã trả giá

`theme.decorations.cardImages[]` là các `<img>` tuyệt đối trên bìa thiệp. Mỗi item: `{ src, className, flyOnOpen }`.

Tầng A đặt sẵn đúng **một** ảnh full-bleed:

```ts
cardImages: [{ src: openingEffect.plateSrc, className: "h-full w-full inset-0 object-cover opacity-20", flyOnOpen: false }]
```

**Bẫy 1 — vùng an toàn artwork hero.** Hoạ tiết phải kết thúc trước ~40% chiều cao canvas, nếu không sẽ cắt qua tên/ngày. Cơ chế cưỡng chế là mask trong `globals.css`: `.invitation-hero-artwork` với `opacity: 0.32`, `mask-image: linear-gradient(... #000 42%, transparent 88%)`. Vẽ artwork với vùng đặc ở nửa trên, mờ dần xuống dưới.

**Bẫy 2 — decor bay phình khi mở thiệp.** `cardImages` chốt chiều cao (`h-36 w-auto`) làm bản sao lúc mở phình 1.6–5 lần. Cách chữa đã có: class `envelope-fly-fit-height`. **Không thêm `data-envelope-opening-fly` ở chỗ mới** — 3 test khoá cứng số lượng hook này.

**Bẫy 3 — offset theo containing block sai.** Phần trăm offset phải đo theo khối chứa thật (cột 760px hay khung 900px), không copy từ ảnh gốc. Xem catalogue lỗi Mahal Gold trong [template-clone-quality.md](template-clone-quality.md) §2.

Class decor legacy dùng width cố định theo breakpoint (`w-[220px] md:w-[300px]`), offset âm lớn, opacity thấp (`opacity-[0.15]`…`opacity-90`), `rotate-*`, `-scale-x-100` để soi gương cặp đôi.

---

## 9. Hiệu ứng mở thiệp — giới hạn số cứng

`assertValidArtOpeningEffect` (`src/data/templates/opening-effect.ts`) reject nếu:

- `durationMs` ngoài **1300–1500**
- `reducedMotion.durationMs` ngoài **160–220**
- số layer khác **3 hoặc 4**
- layer id hoặc src trùng nhau
- `hold.opacity < 0.9` hoặc `hold.blurPx !== 0` — khung giữ phải rõ và sắc ngoài thiệp
- `plateSrc` không bắt đầu bằng `/`, hoặc kết thúc bằng `/artwork.webp`
- `rect` của layer nào vượt ra ngoài `canvas`

Offset frame cố định: `peak` 0.24, `hold` 0.7, `exit` 1.

Cách khai thực tế: viết `opening-assets.json` cạnh artwork (`public/chungdoi/images/themes/_decor/<slug>/`), rồi gọi `createArtOpeningEffect(slug, assets, motion)` trong `art-opening-effects.ts`. `motion` chỉ cần `durationMs` + `exits` (tuple `[x%, y%, scale, rotateDeg, blurPx]` mỗi layer) + `peaks`/`origins` tuỳ chọn; `hold` được nội suy tự động từ `exit` nên luôn hợp lệ.

Một họ nhiều biến thể màu thì khai **một** motion dùng chung (xem `phongThuMotion`, `hoaThuMotion`) — cùng bộ layer id thì cùng timing.

---

## 10. Đăng ký phụ — bỏ sót là fail test, không phải warning

Test `src/data/templates/template-manifest.test.ts` yêu cầu mọi slug manifest phải có mặt ở:

| Nơi | Nội dung |
|---|---|
| `templates` catalog (generated) | qua registrar |
| `vietnameseTemplateSlugs` | |
| `AUDITED_TEMPLATE_SLUGS` (`src/lib/audited-template-renderers.ts`) | |
| `chungdoiDemoContent[slug]` | `.slug === slug` |
| `chungdoiThemeConfig[slug]` | |
| `messages/vi.json` → `listing.templates.<slug>` | name + description |
| `messages/vi.json` → `listing.categories.*`, `listing.colors.*` | nhãn cho mọi giá trị catalog dùng |
| `src/data/template-route-slugs.ts` | |
| `src/data/chungdoi-gift-visuals.ts` | xem §11 |
| `src/data/listing-thumbnails.json`, `listing-mobile-thumbnails.json` | |
| `src/data/template-seo-facet-definitions.ts` | nếu mẫu vào facet SEO |
| `completedTemplateSlugs` / `hiddenTemplateSlugs` | phải nghịch đảo nhau: `completed.has(slug) === !hidden.has(slug)` |

Không hardcode chữ tiếng Việt trong renderer. Mọi copy qua `messages/vi.json`.

---

## 11. Hộp quà phải khai tay

`src/data/chungdoi-gift-visuals.ts` có 3 kind:

- `layered-image { asset }` — ảnh phong bì 1 lớp
- `giftbox { boxImage, decorImages[] }` — luôn **7** ảnh decor mini
- `procedural` — fallback vẽ bằng CSS

`ENVELOPE_TEMPLATE_SLUGS` (46 slug) tự map sang `/chungdoi/images/giftbox/<slug>/envelope.webp`. Override dùng `/chungdoi/images/envelope/<slug_gach_duoi>.webp`.

`resolveGiftVisual(slug)` → source ?? original (`ivory-signature`) ?? `PROCEDURAL_FALLBACK`. **Không khai = im lặng rơi về phong bì procedural chung**, đúng thứ mà `template-clone-quality.md` cấm. Luôn kiểm tra mắt thấy hộp quà đúng của mẫu mình.

---

## 12. Ảnh preview — sàn dung lượng

Chụp bằng `scripts/capture-template-previews.mjs` (chi tiết: [template-preview-capture.md](template-preview-capture.md)). Test kiểm dung lượng file, dùng để bắt ảnh trắng/ảnh lỗi:

| Biến thể | Sàn byte |
|---|---|
| `listing` | ≥ 20 000 |
| `portrait` | ≥ 10 000 |
| `landscape` | ≥ 10 000 |

Hai lưu ý đã trả giá: dev server phải bind `localhost` (bind `127.0.0.1` làm rewrite next-intl lặp 307 vô hạn, capture treo); `FitText` gây vòng lặp `ResizeObserver` cũng làm capture treo.

---

## 13. Trình tự làm một mẫu mới

1. Chuẩn bị asset vào `public/chungdoi/`: `artwork.webp`, layer mở thiệp + `opening-assets.json`, gallery, hộp quà. Tải asset về project; **không** copy API key hay cấu hình dịch vụ của website nguồn.
2. Chọn tầng (§1). Viết `src/data/templates/<slug>.manifest.ts`.
3. Viết renderer `src/components/chungdoi-tpl-<slug>.tsx` (§6).
4. Nếu có hiệu ứng mở: thêm vào `art-opening-effects.ts` (§9).
5. Đăng ký phụ (§10, §11) — làm hết một lượt, đừng để test nhắc.
6. Chạy registrar: `npx tsx scripts/register-template-manifests.ts` → in `Đã đăng ký N template manifest.`
7. Chụp preview (§12).
8. Verify theo thứ tự rẻ trước:

```bash
npm run lint && npm run typecheck && npm run test:unit
```

9. Cuối cùng `npm run build:local`. Nếu đã sửa `globals.css`: `rm -rf .next` trước.
10. Deploy, **rồi mới** seed demo row trên production:

```bash
npx tsx scripts/seed-demos.ts --missing --only=<slug>
```

Backup trước khi seed. Không chạy seed toàn bộ, không ghi đè demo khác. Thêm mẫu vào catalog **không** tự tạo demo row — `/admin/demos` đọc DB nên mẫu mới sẽ không hiện tới khi seed. HTTP 200 ở trang public không chứng minh row đã có.

---

## 14. Checklist nghiệm thu

Ghi trạng thái theo từ vựng của `template-clone-quality.md`: **đã kiểm tra / không áp dụng / chưa kiểm tra**. Đừng đánh dấu pass cho việc chưa xem mắt.

- [ ] Tên file ↔ `slug` ↔ `rendererExport` ↔ đường dẫn renderer ↔ preview stem khớp
- [ ] `viRouteSlug` và `openingEffect.id` duy nhất
- [ ] `heroImageCount` khai trong manifest, không thêm vào set legacy
- [ ] `demoContent.music === null`
- [ ] `displayFontClass` tồn tại trong `globals.css`; `theme.fontFamily` khớp chuỗi khai báo
- [ ] Renderer không có `style={`, không `font-sans`/`font-serif` ở couple/heading
- [ ] Không sửa `chungdoi-tpl-art-invitation.tsx` / `chungdoi-tpl-shared.tsx`
- [ ] Artwork tắt trước ~40% chiều cao hero; decor không cắt tên/ngày
- [ ] Decor `flyOnOpen` không phình khi mở; không thêm hook `data-envelope-opening-fly` mới
- [ ] Hiệu ứng mở pass `assertValidArtOpeningEffect`; mọi asset của effect có trong `manifest.assets`
- [ ] Hộp quà khai trong `chungdoi-gift-visuals.ts`, mắt thấy đúng artwork của mẫu
- [ ] `messages/vi.json`: `listing.templates`, `listing.categories`, `listing.colors` đủ
- [ ] Preview 3 biến thể vượt sàn byte
- [ ] Xem mắt desktop + 390px + 320px; tên dài; tháng 6 hàng (ví dụ 11/2026); nhiều lời chúc; section tuỳ chọn rỗng
- [ ] lint + typecheck + test:unit + build:local pass
- [ ] Demo row đã seed trên production sau khi deploy
