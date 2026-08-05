# Thập Nhị Chi Đỏ — mẫu thiệp 12 con giáp

Ngày: 2026-08-05
Slug: `thap-nhi-chi-do` · route vi: `thap-nhi-chi-do`

## Mục tiêu

Tạo một mẫu thiệp cưới mới dựa trên bố cục Song Phụng Đỏ (`double-phoenix-red`),
trong đó **hai con phượng được thay bằng con vật ứng với con giáp của cô dâu và
chú rể**. Khách hàng chọn con giáp trong editor; bìa và thiệp render đúng cặp con
vật đó, giữ nguyên hiệu ứng zoom khi bấm mở thiệp.

## Phạm vi

Trong phạm vi:

- Mẫu mới `thap-nhi-chi-do` với manifest, renderer, catalog, route, demo, i18n.
- Hai field dữ liệu mới: con giáp cô dâu, con giáp chú rể.
- Dropdown chọn con giáp trong editor, chỉ hiện với mẫu hỗ trợ.
- 26 asset SVG-authored (13 chủ thể × 2 biến thể).
- Con giáp xuất hiện ở bìa (bay khi mở) và trong thiệp (hero + parallax).

Ngoài phạm vi:

- Không sửa `double-phoenix-red` / `double-phoenix-green`. Pipeline legacy
  `flyOnOpen` của Song Phụng giữ nguyên, test hồi quy phải tiếp tục pass.
- Không suy con giáp từ năm sinh. Không thêm ô năm sinh.
- Không đưa mẫu này vào `NEW_ART_TEMPLATE_SLUGS` (xem "Ranh giới test").

## Quyết định đã khóa

| Chủ đề | Quyết định | Lý do |
| --- | --- | --- |
| Nguồn asset | SVG vẽ trong repo, rasterize bằng Sharp | Alpha sạch, đồng nhất 12 con, không rủi ro bản quyền, tái tạo được. Harness không có tool sinh ảnh và `~/.codex/auth.json` không có `OPENAI_API_KEY`. |
| Cách nhập tuổi | Dropdown 12 con giáp | Không có bug biên Tết âm lịch, không cần đoán |
| Phạm vi thay phượng | Cả bìa và thiệp sau khi mở | Chủ đề nhất quán, có hệ thống |
| Phong cách vẽ | Kim nhụ trạm trổ, vàng `#d4a24a` trên đỏ `#710001` | Khớp palette Song Phụng sẵn có |
| Con Mão | **Mèo**, không phải Thỏ | Con giáp Việt, khác Trung Quốc |
| Chưa chọn con giáp | Fallback Rồng (chú rể) + Phượng (cô dâu) | Cặp long-phụng truyền thống; thiệp vẫn hoàn chỉnh, preview catalog vẫn đẹp |

## Kiến trúc

### Vấn đề cốt lõi

Pipeline `flyOnOpen` hiện tại đọc ảnh trang trí từ
`chungdoiThemeConfig[slug].decorations.cardImages` — **tĩnh theo slug**.
`resolveTokens()` (`src/components/chungdoi-demo.tsx:404`) chỉ nhìn
`content.slug`. Mẫu 12 con giáp cần ảnh **động theo dữ liệu người dùng**.

### Giải pháp: một bước phân giải thuần

```
chungdoiThemeConfig["thap-nhi-chi-do"].decorations.cardImages
   │  src chứa placeholder token, không phải path cứng:
   │      "{{brideZodiac}}"  ·  "{{groomZodiac}}"
   │      "{{brideZodiacLine}}"  ·  "{{groomZodiacLine}}"
   ▼
resolveZodiacCardImages(cardImages, content)      ← src/lib/zodiac-decor.ts
   │  đọc content.couple.brideZodiac / groomZodiac
   │  thay token bằng path thật; token không khớp → fallback
   ▼
   src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp"
```

`resolveTokens()` gọi hàm này ở bước cuối. Các slug khác không chứa placeholder
nên đi qua **không thay đổi** — đây là điều làm thay đổi ở `chungdoi-demo.tsx`
an toàn cho 30+ mẫu còn lại.

`resolveZodiacCardImages` là hàm **thuần**, không biết gì về React, test độc lập.

### Hiệu ứng mở thiệp

**Không viết mới.** Vẫn là `@keyframes demo-dragon-fly`
(`src/app/globals.css:827`): scale 1 → 1.6 → 3, blur 0 → 10px, opacity 0.9 → 0,
1.2s. Vẫn `flyOnOpen: true`. Chỉ `src` là động.

Đây không phải bản mô phỏng hiệu ứng hiện tại — nó *chính là* hiệu ứng hiện tại.

## Dữ liệu

### Nguồn chân lý: `src/lib/zodiac.ts`

Tái dùng `EARTHLY_BRANCHES` đã có tại `src/lib/vietnamese-lunar-date.ts:5`
thay vì khai báo lần thứ hai.

`id` lấy theo **tên con vật**, không theo tên chi. Lý do: chi Tý và chi Tỵ đều
slugify thành `ty` (đã kiểm chứng bằng hàm slugify của
`src/lib/to-demo-content.ts:22`), nên id theo chi sẽ va chạm và buộc phải chắp
vá kiểu `ty2`. Id theo con vật cho 12 giá trị duy nhất và filename đọc được.

```
ZODIAC = [
  { id: "chuot", branch: "Tý",   animal: "Chuột" },
  { id: "trau",  branch: "Sửu",  animal: "Trâu"  },
  { id: "ho",    branch: "Dần",  animal: "Hổ"    },
  { id: "meo",   branch: "Mão",  animal: "Mèo"   },
  { id: "rong",  branch: "Thìn", animal: "Rồng"  },
  { id: "tran",  branch: "Tỵ",   animal: "Trăn"  },
  { id: "ngua",  branch: "Ngọ",  animal: "Ngựa"  },
  { id: "de",    branch: "Mùi",  animal: "Dê"    },
  { id: "khi",   branch: "Thân", animal: "Khỉ"   },
  { id: "ga",    branch: "Dậu",  animal: "Gà"    },
  { id: "cho",   branch: "Tuất", animal: "Chó"   },
  { id: "lon",   branch: "Hợi",  animal: "Lợn"   },
]
```

Dropdown hiện `"Thìn — con Rồng"`, lưu giá trị `"rong"`.

### Đường đi của dữ liệu

| Tầng | File | Thay đổi |
| --- | --- | --- |
| DB | `prisma/schema.prisma:159` | `brideZodiac String @default("")`, `groomZodiac String @default("")` |
| Migration | `prisma/migrations/20260805xxxxxx_add_zodiac/` | 2 cột mới, có default nên an toàn với hàng cũ |
| Zod | `src/app/editor/[id]/content-schema.ts:49` | `z.enum(ZODIAC_IDS).or(z.literal("")).optional().default("")` |
| Editor UI | `src/app/editor/[id]/EditorForm.tsx:1952` | 2 `<select>` sau `BirthOrderField`, gated |
| Preview live | `src/app/editor/[id]/EditorForm.tsx:241` | đọc vào `couple.brideZodiac` |
| DB → view | `src/lib/to-demo-content.ts:71` | `brideZodiac: c?.brideZodiac ?? ""` |
| View → DB | `src/lib/from-demo-content.ts` | chiều ngược cho `seed:demos` |
| Type | `src/data/chungdoi-demo-content.ts:21` | `brideZodiac?: string` — **optional**, 30+ mẫu cũ không vỡ |
| Capability | `src/data/editor-template-capabilities.ts` | `templateSupportsZodiac(slug)` |

Dropdown **chỉ hiện** khi `templateSupportsZodiac(selectedTemplateId)` — mẫu khác
không thấy field không liên quan.

## Asset

### Script `scripts/generate-zodiac-artwork.mjs`

Cùng khuôn với `scripts/generate-dong-son-artwork.mjs` đã có: SVG trong repo →
Sharp → WebP, seed cố định nên tái tạo được y hệt.

Mỗi con xuất 2 biến thể từ **cùng một hình gốc**:

```
zodiacBody(id)  →  một <g> path duy nhất
      │
      ├── tô kim nhụ #d4a24a + vân xoắn + viền 2px
      │      → zodiac-<id>.webp        1952×4105
      │
      └── chỉ giữ stroke, bỏ fill, opacity thấp
             → zodiac-<id>-line.webp   1966×4119
```

13 chủ thể (12 con giáp + phượng cho fallback nữ; Rồng đã nằm trong 12) × 2
biến thể = **26 file**, một nguồn hình.

Kích thước bám đúng `Phuong.webp` (1952×4105) và `Phuong line.webp` (1966×4119)
để className định vị của Song Phụng dùng lại được.

Output: `public/chungdoi/images/themes/_decor/thap-nhi-chi-do/`

### Giới hạn chất lượng đã biết

`Phuong.webp` là ảnh vẽ tay nhiều lớp màu, có chuyển sắc. SVG sẽ là hình khối
phẳng + vân trang trí + viền: sạch, đồng nhất, nhưng **phẳng hơn**. Rồng và
Phượng (nhiều chi tiết) sẽ gần bản gốc nhất; Trâu, Chó, Lợn (khối đơn) sẽ trông
đồ hoạ hơn.

Đường nâng cấp nếu chưa đủ: cấp `OPENAI_API_KEY` rồi chạy pipeline imagegen
(đã dùng cho Detective Conan / Doraemon) cho riêng phần hình. **Code và kiến
trúc không phải sửa gì** — chỉ thay file trong `_decor/thap-nhi-chi-do/`.

## Renderer

`src/components/chungdoi-tpl-thap-nhi-chi.tsx`, export
`ThapNhiChiInvitation`. Copy cấu trúc từ `chungdoi-tpl-phoenix.tsx`.

Vị trí con giáp trong thiệp, bám đúng vị trí phượng hiện tại:

| Vị trí hiện tại ở Song Phụng | Thay bằng |
| --- | --- |
| `chungdoi-tpl-phoenix.tsx:112` hero trái (`Phuong 2.webp`) | con giáp cô dâu |
| `chungdoi-tpl-phoenix.tsx:118` hero phải (`Phuong.webp`) | con giáp chú rể |
| `:92` parallax phải (`Phuong line.webp`) | bản `-line` con giáp cô dâu |
| `:95` parallax trái (`Phuong line.webp`) | bản `-line` con giáp chú rể |
| `:98`, `:101` parallax `HOA.webp` | giữ nguyên hoa |
| `:115` chữ 囍 `CHU HY.webp` | giữ nguyên |
| `:89` nền giấy `NENGIAY.jpg` | giữ nguyên |

Thứ tự trái/phải tôn trọng `couple.brideFirst`, dùng `orderByBrideFirst` đã có
tại `src/lib/invitation-display.ts`.

Áp dụng cho **cả bìa và thiệp**, không chỉ thiệp: hai con bay trên bìa cũng đổi
chỗ theo `brideFirst`, để bên trái luôn là nhà được hiển thị trước — nhất quán
với tên, gia đình và thông tin chuyển khoản. Nghĩa là `resolveZodiacCardImages`
phải đọc `brideFirst`, không chỉ đọc hai id con giáp.

## Ranh giới test

`src/data/templates/template-manifest.test.ts:145` bắt mọi mẫu trong
`NEW_ART_TEMPLATE_SLUGS` không được có `style={`. Renderer Song Phụng dùng
inline style dày đặc (`chungdoi-tpl-phoenix.tsx:89`, `92`, `110`…), và mẫu này
copy cấu trúc từ đó chứ không dùng shared art renderer.

Nên mẫu này **không** vào `NEW_ART_TEMPLATE_SLUGS` — áp checklist art-scroll vào
một renderer không phải art-scroll là sai chỗ. Nó vẫn đi qua test tại dòng 99
(wiring đầy đủ + mọi asset khai báo tồn tại trên đĩa), là test đúng phạm vi.

Manifest mới tự động chảy vào `AUDITED_TEMPLATE_SLUGS` qua
`generatedTemplateSlugs` (`src/lib/audited-template-renderers.ts:28`), nên
registrar lo hết việc đăng ký.

## Test

| Test | Kiểm |
| --- | --- |
| `src/lib/zodiac.test.ts` | 12 chi đúng thứ tự; `id` duy nhất 12/12 (bẫy Tý/Tỵ cùng slugify thành `ty`); Mão = Mèo; `branch` khớp `EARTHLY_BRANCHES` |
| `src/lib/zodiac-decor.test.ts` | token → path đúng; con giáp trống → fallback Rồng/Phượng; token lạ → fallback; cardImages không có token đi qua nguyên vẹn; `flyOnOpen` được giữ; `brideFirst` đảo đúng vị trí trái/phải |
| `src/data/templates/template-manifest.test.ts` | 26 asset tồn tại (test sẵn có, dòng 99) |
| `src/app/editor/[id]/content-schema.test.ts` | zodiac id hợp lệ được nhận; giá trị rác bị loại; trống là hợp lệ |
| Hồi quy Song Phụng | `double-phoenix-red` vẫn `flyOnOpen` + `demo-dragon-fly`, không đổi |

## Việc bắt buộc theo playbook

- `npm run templates:register`
- Thêm nhãn `listing.categories` / `listing.colors` mới vào `messages/vi.json`
- `npm run seed:demos`
- `npm run screenshots:templates -- --slug thap-nhi-chi-do --no-sync-production`
- Ghi provenance vào `docs/research/asset-provenance.md`
- `npm run typecheck` · `npm run typecheck:tests` · `npm run test:unit` ·
  `npm run lint` · `npm run build` · `git diff --check`

## Gate trực quan

- Desktop 1280–1440px và mobile 390×844.
- Trước khi mở: không có artwork nào vượt ranh giới / bo góc bìa.
- Sau khi bấm mở: đúng 2 con giáp bay và phóng to ra ngoài bìa; nền không zoom theo.
- Đổi con giáp trong editor → bìa và thiệp đổi đúng con vật.
- Con giáp trống → hiện Rồng + Phượng, không phải ô trống.
- Parallax line-art thật sự chạy khác tốc độ foreground.
- `document.documentElement.scrollWidth <= innerWidth` trên mobile.
- Reduced motion.
