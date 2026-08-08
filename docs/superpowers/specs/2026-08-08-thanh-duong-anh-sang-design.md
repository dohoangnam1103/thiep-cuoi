# Thánh Đường Ánh Sáng — Design Spec

**Ngày**: 2026-08-08  
**Slug**: `thanh-duong-anh-sang`  
**Trạng thái**: Approved — sẵn sàng lập implementation plan

---

## 1. Concept & Identity

### Động lực

Catalog hiện có 41 mẫu không có mẫu nào dùng hình học vòm gothic hoặc kính màu. Nhóm khách cưới nhà thờ (Công giáo và các đạo Kitô khác) chiếm thị phần lớn ở Việt Nam nhưng chưa có mẫu phù hợp. Mẫu dùng thẩm mỹ kiến trúc thánh đường nhưng **copy trung tính tôn giáo** để phục vụ cả cặp đôi không theo đạo yêu thích phong cách ánh sáng kiến trúc.

### Định danh

| Field | Giá trị |
|---|---|
| `slug` | `thanh-duong-anh-sang` |
| `viRouteSlug` | `thanh-duong-anh-sang` |
| `rendererExport` | `ThanhDuongAnhSangInvitation` |
| `heroImageCount` | `1` |
| `category` | `Modern` |
| `color` | `Gold` |
| Tên hiển thị (vi) | Thánh Đường Ánh Sáng |
| Tên hiển thị (en) | Cathedral Light |

### Mô tả thị giác (một câu)

Thiệp nền đá vôi ấm với vòm gothic nhọn, cửa sổ hoa hồng kính màu lam-vàng, và đôi bồ câu bay trong luồng nắng sớm.

### Khác biệt so với catalog

- Hình học vòm gothic chưa xuất hiện ở bất kỳ mẫu nào.
- Palette đá vôi ấm + lam nhà thờ + vàng nắng là tổ hợp mới hoàn toàn.
- Bồ câu là linh vật opening effect đầu tiên trong catalog.
- Nhóm khách cưới nhà thờ chưa được phục vụ.

---

## 2. Visual System

### Palette

| Token | Hex | Vai trò |
|---|---|---|
| `outer` | `#f2ede0` | Nền trang, đá vôi ấm |
| `card` | `#f9f6ef` | Bề mặt card, giấy ngà |
| `ink` | `#1e3a5f` | Mực chính, lam nhà thờ sâu |
| `muted` | `rgba(30,58,95,0.55)` | Mực phụ |
| `accent` | `#c9922f` | Vàng nắng — nút, điểm nhấn |
| `buttonText` | `#f9f6ef` | Chữ trên nút |

### Typography

- **Display font**: `Fz Qellia` — serif cổ điển, hỗ trợ dấu tiếng Việt đầy đủ.
- **`displayFontClass`**: `font-art-qellia`
- **`coupleClass`**: `text-[clamp(3.4rem,11vw,7rem)] font-normal leading-[0.84] tracking-wide`
  - `tracking-wide` rộng hơn mặc định để gợi không gian thoáng của kiến trúc.
- **`fontFamily`** (manifest): `"Fz Qellia"`

### Wrapper config đầy đủ

```ts
const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  pageClass:       "bg-[#f2ede0]",
  heroClass:       "bg-[#f4f0e4]",
  surfaceClass:    "bg-[#f9f6ef]",
  sectionClass:    "border-t border-[#1e3a5f]/16 pt-10",
  inkClass:        "text-[#1e3a5f]",
  mutedClass:      "text-[#1e3a5f]/55",
  accentTextClass: "text-[#c9922f]",
  accentBgClass:   "bg-[#c9922f]",
  borderClass:     "border-[#1e3a5f]/18",
  buttonClass:     "bg-[#c9922f] text-[#f9f6ef]",
  displayFontClass:"font-art-qellia",
  coupleClass:     "text-[clamp(3.4rem,11vw,7rem)] font-normal leading-[0.84] tracking-wide",
  headingClass:    "text-4xl font-normal leading-none md:text-6xl",
  imageClass:      "saturate-[0.94]",
  radiusClass:     "rounded-[999px]",
  giftLayout:      "flip",
  accentHex:       "#c9922f",
  inkHex:          "#1e3a5f",
} satisfies ArtInvitationConfig;
```

---

## 3. Artwork — Cấu trúc canvas 1024×1536

**Quy tắc safe zone**: mọi họa tiết (kể cả trong layer) phải kết thúc trên pixel **584** (38% × 1536). Phần dưới chỉ có nền trơn và hạt grain mờ.

### Plate (tĩnh, không bay)

- Nền gradient đá vôi: `#f9f6ef` → `#f2ede0` (top → bottom).
- Grain mỏng opacity 0.03 (pattern 2 loại chấm nhỏ).
- Khung border ogee mỏng, màu lam `#1e3a5f` opacity 0.22.
- **Vòm gothic đôi**: hai vòm nhọn đối xứng vươn lên, đỉnh ~y220, chân ~y560 — toàn bộ nằm trong safe zone.
- **Cửa sổ hoa hồng tĩnh**: tâm ~(512, 160), bán kính ~90px, chia ô kính hình cánh hoa (lam `#2d6fa0`, vàng `#c9922f`, trắng ngà), được vẽ trực tiếp lên plate (không phải layer động).

### Foreground layers (alpha thật, full-canvas 1024×1536)

| Layer ID | Mô tả | Vùng alpha active |
|---|---|---|
| `rose-glow` | Hào quang radial tỏa từ tâm cửa hoa hồng (tia sáng feather ra ngoài) | Tâm (512,160), r≈150px |
| `dove-pair` | Đôi bồ câu trắng (hai con, khoảng cách ~180px, chi tiết cánh) | y120–310 |
| `light-shaft` | Dải nắng nghiêng mỏng xuyên từ cửa sổ xuống — gradient alpha | y100–540, nghiêng ~12° |

Mỗi layer: export WebP lossless full-canvas, alpha trim sau khi prepare-opening-assets.

---

## 4. Opening Effect

### Motion config (đăng ký trong `art-opening-effects.ts`)

```ts
"thanh-duong-anh-sang": [thanhDuongAnhSangAssets, {
  durationMs: 1400,
  exits: {
    "rose-glow":    [0, -90, 3.2, 0, 10],     // vươn thẳng lên, scale lớn
    "dove-pair":    [60, -75, 2.8, -8, 9],     // bay lên-phải, xoay nhẹ
    "light-shaft":  [5, -80, 2.4, -5, 8],      // kéo dài lên, mờ dần
  },
  peaks: {
    "rose-glow":   { yPercent: -10, brightness: 1.4 },
    "dove-pair":   { xPercent: 8, yPercent: -8, brightness: 1.2 },
    "light-shaft": { yPercent: -6 },
  },
  origins: {
    "rose-glow":   "50% 10%",
    "dove-pair":   "40% 20%",
    "light-shaft": "50% 7%",
  },
}],
```

### Storyboard

| Phase | Thời gian | Hành động |
|---|---|---|
| Init | frame 0 | 3 layer khớp pixel-perfect với plate |
| Rise | 0–24% (336ms) | `rose-glow` sáng lên; `dove-pair` bắt đầu tách; `light-shaft` kéo dài |
| Hold | 24–70% (336ms–980ms) | Cả 3 ở peak — đủ lớn, sắc nét, vượt rõ mép thiệp |
| Exit | 70–100% (980ms–1400ms) | Fade + blur; plate unmount; nội dung thiệp hiện |
| Reduced motion | — | 180ms fade, không scale/translate |

**Kiểm tra bắt buộc tại frame ~65%**: bồ câu còn sắc nét, `rose-glow` đủ lớn vượt mép trên bìa.

---

## 5. Manifest

```ts
// src/data/templates/thanh-duong-anh-sang.manifest.ts
export const manifest = createArtTemplateManifest({
  slug: "thanh-duong-anh-sang",
  viRouteSlug: "thanh-duong-anh-sang",
  rendererExport: "ThanhDuongAnhSangInvitation",
  heroImageCount: 1,
  openingEffect: artOpeningEffects["thanh-duong-anh-sang"],
  name: "Cathedral Light",
  title: "Cathedral Light Wedding Invitation | Thiệp Mừng Online",
  description: "A warm limestone invitation framed by gothic arches and rose-window light.",
  category: "Modern",
  color: "Gold",
  highlights: [
    "Gothic double arch in warm limestone",
    "Rose window with cobalt and gold panes",
    "Dove pair opening flight",
  ],
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  outer: "#f2ede0", card: "#f9f6ef",
  ink: "#1e3a5f", muted: "rgba(30,58,95,0.55)",
  accent: "#c9922f", buttonText: "#f9f6ef",
  fontFamily: "Fz Qellia",
  particleType: "sparkles",
  gallerySlug: "arch-sage",
  music: "/chungdoi/music/jasmine-white.mp3",
  i18n: {
    vi: {
      name: "Thánh Đường Ánh Sáng",
      description: "Thiệp cưới nền đá vôi ấm với vòm gothic nhọn, cửa sổ hoa hồng kính màu lam-vàng và đôi bồ câu bay trong nắng sớm.",
    },
    en: {
      name: "Cathedral Light",
      description: "A warm limestone invitation with gothic pointed arches, cobalt-gold rose window light, and a dove pair taking flight.",
    },
    ja: {
      name: "大聖堂の光",
      description: "温かみのある石灰石地に尖ったゴシック・アーチ、コバルトと金のバラ窓、飛び立つ二羽の鳩を描いた招待状。",
    },
    ko: {
      name: "성당의 빛",
      description: "따뜻한 석회석 배경에 고딕 아치와 코발트·골드 장미창, 날아오르는 비둘기 한 쌍이 어우러진 청첩장.",
    },
    zh: {
      name: "圣堂之光",
      description: "温暖石灰石底色，哥特尖拱与钴蓝金色玫瑰窗交相辉映，一对白鸽展翅而飞的婚礼请柬。",
    },
  },
});
```

---

## 6. Artwork Generator Plan

Script: `scripts/generate-thanh-duong-anh-sang-artwork.mjs`  
Pattern: theo `generate-hai-yen-thanh-thu-artwork.mjs`.

```
Bước 1. Dựng plate SVG:
  - Nền gradient + grain
  - Khung border ogee
  - Vòm gothic đôi (path Bézier, nét lam mỏng 1.5px, opacity 0.35)
  - Cửa sổ hoa hồng với 8 cánh kính + trung tâm tròn
  composite() bằng sharp → plate.png

Bước 2. Dựng 3 layer SVG full-canvas 1024×1536:
  - rose-glow: radialGradient từ (512,160), opacity 0.5 ở tâm → 0 ở r=150
  - dove-pair: 2 path bồ câu chi tiết (thân, cánh mở) màu trắng ngà
  - light-shaft: path hình thang mỏng nghiêng, linearGradient alpha

Bước 3. Kiểm tra safe-line (y > 584 → alpha ≤ 8)

Bước 4. Composite plate + 3 layer → artwork.webp (quality 94)

Bước 5. Tạo giftbox SVG (hình vòm mini + chữ thập nhỏ)
       → public/chungdoi/images/giftbox/thanh-duong-anh-sang/envelope.webp
```

---

## 7. Checklist triển khai

- [ ] Chạy `generate-thanh-duong-anh-sang-artwork.mjs` → plate + 3 layers.
- [ ] `npm run templates:prepare-opening-assets -- --slug thanh-duong-anh-sang ...`
- [ ] `npm run templates:validate-opening-assets -- --slugs thanh-duong-anh-sang`
- [ ] Đăng ký motion trong `art-opening-effects.ts`.
- [ ] Tạo manifest `src/data/templates/thanh-duong-anh-sang.manifest.ts`.
- [ ] Tạo wrapper `src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx`.
- [ ] `npm run templates:register`
- [ ] Kiểm tra `listing.colors.Gold` trong `messages/vi.json` — thêm nếu chưa có.
- [ ] `npm run seed:demos`
- [ ] `npm run screenshots:templates -- --slug thanh-duong-anh-sang --no-sync-production`
- [ ] `npm run templates:validate-opening-assets && npm run typecheck && npm run typecheck:tests && npm run test:unit && npm run lint`
- [ ] `NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build`
- [ ] Gate trực quan: desktop 1280px+, mobile 390px, light theme, parallax, opening animation frame ~65%.
