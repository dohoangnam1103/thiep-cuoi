# Thánh Đường Ánh Sáng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm mẫu thiệp cưới `thanh-duong-anh-sang` (Thánh Đường Ánh Sáng) — nền đá vôi ấm, vòm gothic, cửa sổ hoa hồng kính màu, đôi bồ câu bay trong nắng sớm — dùng kiến trúc art-invitation dùng chung.

**Architecture:** Mẫu đi qua pipeline manifest chuẩn: một script sinh artwork bằng sharp + SVG inline, một `opening-assets.json` sinh bởi `prepare-opening-assets`, một entry motion trong `art-opening-effects.ts`, một manifest và một wrapper renderer mỏng. Registrar tự nối catalog/route/theme/i18n/renderer. Không sửa `chungdoi-tpl-art-invitation.tsx` (shared renderer) — mẫu này không cần thay đổi renderer.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, sharp (sinh ảnh), node:test (`tsx --test`), Tailwind v4.

## Global Constraints

- Slug: `thanh-duong-anh-sang`. `viRouteSlug`: `thanh-duong-anh-sang`. `rendererExport`: `ThanhDuongAnhSangInvitation`.
- `heroImageCount: 1`. `category: "Modern"`. `color: "Gold"`.
- Palette chính xác: `outer #f2ede0`, `card #f9f6ef`, `ink #1e3a5f`, `muted rgba(30,58,95,0.55)`, `accent #c9922f`, `buttonText #f9f6ef`.
- `fontFamily: "Fz Qellia"` ↔ `displayFontClass: "font-art-qellia"` — hai giá trị này phải khớp, test chặn.
- Canvas artwork: `1024×1536`. Safe line: **không pixel alpha > 8 nào được nằm dưới y=584** (38% × 1536).
- Opening effect: đúng **3 layer** (`rose-glow`, `dove-pair`, `light-shaft`), `durationMs: 1400`, reduced motion 180ms.
- Copy **trung tính tôn giáo** — không câu Kinh Thánh, không "Chúa", "Thiên Chúa", "Amen", "Thánh lễ". Được dùng: nhà thờ, thánh đường, vòm, kính màu, bồ câu, ánh sáng.
- Wrapper **không được có `style={`** — test chặn inline style.
- `coupleClass`/`headingClass` **không được chứa** `font-sans` hoặc `font-serif` — test chặn.
- TypeScript strict, không `any`. Named exports. 2-space indent.
- `listing.categories.Modern` ("Hiện đại") và `listing.colors.Gold` ("Vàng") **đã tồn tại** trong `messages/vi.json` — không cần thêm.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `scripts/generate-thanh-duong-anh-sang-artwork.mjs` | **Create** — sinh plate + 3 layer alpha + `artwork.webp` + giftbox envelope |
| `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp` | **Generate** — hero artwork composite |
| `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-plate.webp` | **Generate** — plate tĩnh (bởi prepare script) |
| `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-{rose-glow,dove-pair,light-shaft}.webp` | **Generate** — 3 layer alpha đã trim |
| `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-assets.json` | **Generate** — asset manifest |
| `public/chungdoi/images/giftbox/thanh-duong-anh-sang/envelope.webp` | **Generate** — hình quà tặng |
| `scripts/validate-opening-effect-assets.ts` | **Modify** — thêm slug vào `ART_OPENING_THEME_SLUGS` (dòng ~9-42) |
| `src/data/templates/art-opening-effects.ts` | **Modify** — thêm import asset JSON + entry motion |
| `src/data/templates/thanh-duong-anh-sang.manifest.ts` | **Create** — manifest |
| `src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx` | **Create** — wrapper renderer |
| `src/data/templates/opening-effect.test.ts` | **Modify** — thêm slug vào `artThemeDurations` (dòng ~22-55) |
| `src/data/templates/template-manifest.test.ts` | **Modify** — thêm slug vào 3 fixture: `NEW_ART_TEMPLATE_SLUGS`, `NEW_ART_TEMPLATE_HERO_COUNTS`, `NEW_ART_TEMPLATE_FONTS` |
| `src/lib/og-image.test.ts` | **Modify (tuỳ chọn)** — thêm entry vào `ART_OG_FONTS` để có coverage OG font |
| `src/data/templates/generated-data.ts` | **Auto-generated** — registrar sinh, không sửa tay |
| `src/components/generated/template-renderers.tsx` | **Auto-generated** — registrar sinh, không sửa tay |

### Lưu ý quan trọng về registry hardcode

Playbook trong `INSPECTION_GUIDE.md` **không nêu** các danh sách hardcode dưới đây. Ba cái đầu là **bắt buộc** — bỏ sót là fail:

1. `ART_OPENING_THEME_SLUGS` trong `scripts/validate-opening-effect-assets.ts:9-42` (hiện 32 slug, kết thúc `"hoa-thu-xanh-duong"`) — nếu thiếu, `--slugs thanh-duong-anh-sang` báo `unknown art opening theme`.
2. `artThemeDurations` trong `opening-effect.test.ts:22-55` (hiện 32 slug) — test tại dòng 264 `assert.deepEqual(Object.keys(artOpeningEffects).sort(), Object.keys(artThemeDurations).sort())` sẽ fail nếu lệch một slug.
3. `NEW_ART_TEMPLATE_SLUGS` (dòng 31) + `NEW_ART_TEMPLATE_HERO_COUNTS` (dòng 66) + `NEW_ART_TEMPLATE_FONTS` (dòng 101) trong `template-manifest.test.ts` — cả `HERO_COUNTS` (`Record<(typeof NEW_ART_TEMPLATE_SLUGS)[number], 1 | 2>`) và `FONTS` (`satisfies Record<...>`) đều key theo `NEW_ART_TEMPLATE_SLUGS`, nên thêm slug vào mảng mà không thêm vào hai map kia là **lỗi typecheck**.

`ART_OG_FONTS` trong `src/lib/og-image.test.ts:14-29` **không bắt buộc**: nó chỉ có 14 entry (không phủ hết 33 slug) và test lặp qua chính object đó, nên thiếu slug mới không làm fail. Thêm vào chỉ để có coverage — `resolveOgFont` đọc từ `chungdoiThemeConfig[slug].fonts.couple` mà registrar đã sinh, và `"Fz Qellia"` đã có trong `FONT_FILE_BY_FAMILY`, nên OG image vẫn đúng font dù không thêm.

---

## Task 1: Artwork generator

**Files:**
- Create: `scripts/generate-thanh-duong-anh-sang-artwork.mjs`
- Generate: `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp`
- Generate: `public/chungdoi/images/giftbox/thanh-duong-anh-sang/envelope.webp`
- Generate: `tmp/thanh-duong-anh-sang/plate.png`, `tmp/thanh-duong-anh-sang/layer-*.png`

**Interfaces:**
- Consumes: `sharp` (đã có trong dependencies).
- Produces: 4 file trong `tmp/thanh-duong-anh-sang/` (`plate.png`, `layer-rose-glow.png`, `layer-dove-pair.png`, `layer-light-shaft.png`) mà Task 2 truyền vào `prepare-opening-assets`. Script tự in ra lệnh prepare hoàn chỉnh ở stdout.

- [ ] **Step 1: Tạo script generator**

Create `scripts/generate-thanh-duong-anh-sang-artwork.mjs`:

```javascript
#!/usr/bin/env node

// Thánh Đường Ánh Sáng — gothic double arch, a stained-glass rose window and a
// pair of doves rising through morning light.
// Every motif stays inside the top 38% of the canvas so the hero date/name
// cluster anchored to the bottom is never crossed by artwork.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs must end above this

const workDir = path.join(root, "tmp/thanh-duong-anh-sang");
const themeDir = path.join(root, "public/chungdoi/images/themes/_decor/thanh-duong-anh-sang");
const giftDir = path.join(root, "public/chungdoi/images/giftbox/thanh-duong-anh-sang");

await mkdir(workDir, { recursive: true });
await mkdir(themeDir, { recursive: true });
await mkdir(giftDir, { recursive: true });

const colors = {
  paper: "#f9f6ef",
  paperWarm: "#f2ede0",
  ink: "#1e3a5f",
  glassBlue: "#2d6fa0",
  glassGold: "#c9922f",
  glassRose: "#b8607a",
  dove: "#fdfcf8",
  sun: "#e8c67a",
};

// Rose window and arch geometry — all values well above SAFE_BOTTOM (584).
const rose = { cx: 512, cy: 168, r: 92 };
const archTop = 268;
const archBase = 556;

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

// --- rose window petals drawn as static plate detail -----------------------
function rosePetals() {
  const petals = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * 360) / 8;
    const fill = index % 2 === 0 ? colors.glassBlue : colors.glassGold;
    petals.push(
      `<path d="M${rose.cx} ${rose.cy - 26}C${rose.cx + 20} ${rose.cy - 52} ${rose.cx + 20} ${rose.cy - 74} ${rose.cx} ${rose.cy - 84}C${rose.cx - 20} ${rose.cy - 74} ${rose.cx - 20} ${rose.cy - 52} ${rose.cx} ${rose.cy - 26}Z" fill="${fill}" fill-opacity=".42" transform="rotate(${angle} ${rose.cx} ${rose.cy})"/>`,
    );
  }
  return petals.join("");
}

// --- plate: paper, grain, gothic arches, rose window, frame rule -----------
const plate = `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.25" y2="1">
    <stop stop-color="${colors.paper}"/>
    <stop offset="1" stop-color="${colors.paperWarm}"/>
  </linearGradient>
  <pattern id="grain" width="41" height="53" patternUnits="userSpaceOnUse">
    <circle cx="8" cy="15" r="1" fill="${colors.ink}" opacity=".028"/>
    <circle cx="29" cy="39" r=".9" fill="${colors.glassGold}" opacity=".050"/>
  </pattern>
  <radialGradient id="roseCore" cx="0.5" cy="0.5" r="0.5">
    <stop stop-color="${colors.sun}" stop-opacity=".55"/>
    <stop offset="1" stop-color="${colors.glassGold}" stop-opacity=".18"/>
  </radialGradient>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>

<!-- outer ogee frame -->
<path d="M84 72H940V1464H84Z" fill="none" stroke="${colors.ink}" stroke-width="2" opacity=".22"/>
<path d="M110 98H914" stroke="${colors.ink}" stroke-width="1" opacity=".24"/>

<!-- gothic double arch, nét mỏng, hoàn toàn trên safe line -->
<g fill="none" stroke="${colors.ink}" stroke-width="1.6" opacity=".34">
  <path d="M262 ${archBase}V404C262 322 306 288 374 ${archTop}C442 288 486 322 486 404V${archBase}"/>
  <path d="M538 ${archBase}V404C538 322 582 288 650 ${archTop}C718 288 762 322 762 404V${archBase}"/>
  <path d="M290 ${archBase}V416C290 344 328 314 374 300C420 314 458 344 458 416V${archBase}" opacity=".55"/>
  <path d="M566 ${archBase}V416C566 344 604 314 650 300C696 314 734 344 734 416V${archBase}" opacity=".55"/>
</g>

<!-- rose window: static stained glass -->
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r}" fill="none" stroke="${colors.ink}" stroke-width="2.2" opacity=".40"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r - 12}" fill="none" stroke="${colors.ink}" stroke-width="1.2" opacity=".26"/>
${rosePetals()}
<circle cx="${rose.cx}" cy="${rose.cy}" r="26" fill="url(#roseCore)"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="26" fill="none" stroke="${colors.ink}" stroke-width="1.4" opacity=".34"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="9" fill="${colors.glassRose}" fill-opacity=".38"/>
`;

// --- foreground layers: full-canvas, true alpha, all above SAFE_BOTTOM -----
// rose-glow   : halo radiating from the rose window (y 18–318)
// dove-pair   : two doves flanking the window       (y 196–330)
// light-shaft : slanted morning beam through the arch (y 104–540)
const layers = [
  {
    id: "rose-glow",
    body: `
<defs>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop stop-color="${colors.sun}" stop-opacity=".62"/>
    <stop offset=".45" stop-color="${colors.glassGold}" stop-opacity=".26"/>
    <stop offset="1" stop-color="${colors.glassGold}" stop-opacity="0"/>
  </radialGradient>
</defs>
<circle cx="${rose.cx}" cy="${rose.cy}" r="150" fill="url(#halo)"/>
<g stroke="${colors.sun}" stroke-width="2" opacity=".34" stroke-linecap="round">
  <path d="M${rose.cx} ${rose.cy - 112}V${rose.cy - 142}"/>
  <path d="M${rose.cx + 79} ${rose.cy - 79}L${rose.cx + 100} ${rose.cy - 100}"/>
  <path d="M${rose.cx + 112} ${rose.cy}H${rose.cx + 142}"/>
  <path d="M${rose.cx - 79} ${rose.cy - 79}L${rose.cx - 100} ${rose.cy - 100}"/>
  <path d="M${rose.cx - 112} ${rose.cy}H${rose.cx - 142}"/>
</g>`,
  },
  {
    id: "dove-pair",
    body: `
<g fill="${colors.dove}" stroke="${colors.ink}" stroke-width="1.1" stroke-opacity=".28">
  <!-- left dove, gliding outward -->
  <path d="M300 268c14-9 30-11 45-6 8-14 21-22 36-23-6 9-8 18-6 27 13 4 23 13 27 25-14-6-27-6-40 1-9 12-23 19-38 19 7-8 11-17 11-27-13-2-25-8-35-16Z"/>
  <path d="M336 265c9-16 24-27 42-31-10 12-16 25-17 39" fill="none" stroke-opacity=".34"/>
  <!-- right dove, mirrored -->
  <path d="M724 268c-14-9-30-11-45-6-8-14-21-22-36-23 6 9 8 18 6 27-13 4-23 13-27 25 14-6 27-6 40 1 9 12 23 19 38 19-7-8-11-17-11-27 13-2 25-8 35-16Z"/>
  <path d="M688 265c-9-16-24-27-42-31 10 12 16 25 17 39" fill="none" stroke-opacity=".34"/>
</g>`,
  },
  {
    id: "light-shaft",
    body: `
<defs>
  <linearGradient id="beam" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.sun}" stop-opacity=".40"/>
    <stop offset=".6" stop-color="${colors.sun}" stop-opacity=".16"/>
    <stop offset="1" stop-color="${colors.sun}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beamThin" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.paper}" stop-opacity=".46"/>
    <stop offset="1" stop-color="${colors.paper}" stop-opacity="0"/>
  </linearGradient>
</defs>
<path d="M470 104L560 104L680 540L392 540Z" fill="url(#beam)"/>
<path d="M498 112L536 112L596 528L448 528Z" fill="url(#beamThin)"/>`,
  },
];

const platePath = path.join(workDir, "plate.png");
await sharp(Buffer.from(svg(plate))).png().toFile(platePath);

const rendered = [];
for (const layer of layers) {
  const filePath = path.join(workDir, `layer-${layer.id}.png`);
  await sharp(Buffer.from(svg(layer.body))).ensureAlpha().png().toFile(filePath);

  // Guard the playbook rule: nothing may extend past 38% of the canvas height.
  const { info, data } = await sharp(filePath)
    .extract({ left: 0, top: SAFE_BOTTOM, width: canvas.width, height: canvas.height - SAFE_BOTTOM })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let maxAlpha = 0;
  for (let i = info.channels - 1; i < data.length; i += info.channels) {
    if (data[i] > maxAlpha) maxAlpha = data[i];
  }
  if (maxAlpha > 8) {
    throw new Error(`layer ${layer.id}: ink found below the ${SAFE_BOTTOM}px safe line (alpha ${maxAlpha})`);
  }

  rendered.push({ ...layer, filePath });
}

await sharp(platePath)
  .composite(rendered.map(({ filePath }) => ({ input: filePath })))
  .webp({ quality: 94 })
  .toFile(path.join(themeDir, "artwork.webp"));

// Giftbox envelope: a mini arch with a rose window, matching the theme.
const gift = svg(
  `<rect x="40" y="70" width="340" height="184" rx="10" fill="${colors.paperWarm}" stroke="${colors.ink}" stroke-width="6" stroke-opacity=".5"/>
   <path d="M40 84L210 178 380 84" fill="none" stroke="${colors.ink}" stroke-width="5" stroke-opacity=".42"/>
   <path d="M168 250V150C168 118 186 104 210 92C234 104 252 118 252 150V250" fill="none" stroke="${colors.glassGold}" stroke-width="5"/>
   <circle cx="210" cy="132" r="24" fill="none" stroke="${colors.glassBlue}" stroke-width="4"/>
   <circle cx="210" cy="132" r="9" fill="${colors.glassGold}" fill-opacity=".6"/>`,
  { width: 420, height: 300 },
);
await sharp(Buffer.from(gift)).webp({ lossless: true }).toFile(path.join(giftDir, "envelope.webp"));

process.stdout.write(
  `thanh-duong-anh-sang assets generated\n  npm run templates:prepare-opening-assets -- --slug thanh-duong-anh-sang --plate ${path.relative(root, platePath)} ${rendered
    .map(({ id, filePath }) => `--layer ${id}=${path.relative(root, filePath)}`)
    .join(" ")}\n`,
);
```

- [ ] **Step 2: Chạy generator**

```bash
node scripts/generate-thanh-duong-anh-sang-artwork.mjs
```

Expected: in ra `thanh-duong-anh-sang assets generated` kèm lệnh prepare. Nếu throw `ink found below the 584px safe line`, sửa SVG để đẩy họa tiết lên trên rồi chạy lại.

- [ ] **Step 3: Xác nhận kích thước và alpha của asset sinh ra**

```bash
node -e "const sharp=require('sharp');(async()=>{for(const f of ['tmp/thanh-duong-anh-sang/plate.png','tmp/thanh-duong-anh-sang/layer-rose-glow.png','tmp/thanh-duong-anh-sang/layer-dove-pair.png','tmp/thanh-duong-anh-sang/layer-light-shaft.png','public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp']){const m=await sharp(f).metadata();const s=await sharp(f).stats();console.log(f,m.width+'x'+m.height,'ch='+m.channels,'alphaMin='+(s.channels[3]?s.channels[3].min:'n/a'),'alphaMax='+(s.channels[3]?s.channels[3].max:'n/a'));}})()"
```

Expected: mọi file `1024x1536`. Ba file `layer-*.png` có `ch=4`, `alphaMin=0` và `alphaMax` > 0. Nếu `alphaMin` khác 0, layer đó phủ kín canvas — phải giảm vùng vẽ.

- [ ] **Step 4: Kiểm tra bằng mắt**

Mở `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp`. Xác nhận: vòm gothic và cửa sổ hoa hồng nằm trọn nửa trên, nửa dưới là nền trơn, đôi bồ câu nhìn ra hình con chim (không phải khối trắng vô định).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-thanh-duong-anh-sang-artwork.mjs public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp public/chungdoi/images/giftbox/thanh-duong-anh-sang/envelope.webp
git commit -m "feat(thanh-duong): sinh artwork vòm gothic và cửa sổ hoa hồng"
```

---

## Task 2: Chuẩn bị opening assets

**Files:**
- Modify: `scripts/validate-opening-effect-assets.ts:9-42` (thêm slug vào `ART_OPENING_THEME_SLUGS`)
- Generate: `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-plate.webp`
- Generate: `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-{rose-glow,dove-pair,light-shaft}.webp`
- Generate: `public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-assets.json`

**Interfaces:**
- Consumes: `tmp/thanh-duong-anh-sang/{plate,layer-rose-glow,layer-dove-pair,layer-light-shaft}.png` từ Task 1.
- Produces: `opening-assets.json` với shape `OpeningEffectAssetManifest` (`{ canvas: {width,height}, plateSrc: string, layers: [{id, src, rect:{x,y,width,height}}] }`) mà Task 3 import.

**Thứ tự bắt buộc:** `prepare-opening-assets.ts:49-56` đọc kích thước canvas từ `artwork.webp` của theme, nên **Task 1 phải chạy xong trước**. Script cũng yêu cầu mọi layer nguồn đúng full-canvas `1024×1536` (dòng 80-87) trước khi trim, và tự giới hạn padding trong suốt ≤ 2px mỗi phía.

- [ ] **Step 1: Thêm slug vào danh sách validator**

Trong `scripts/validate-opening-effect-assets.ts`, thêm dòng cuối vào mảng `ART_OPENING_THEME_SLUGS` (ngay sau `"hoa-thu-xanh-duong",`):

```typescript
  "hoa-thu-xanh-duong",
  "thanh-duong-anh-sang",
] as const;
```

- [ ] **Step 2: Chạy prepare để sinh layer đã trim**

```bash
npm run templates:prepare-opening-assets -- --slug thanh-duong-anh-sang --plate tmp/thanh-duong-anh-sang/plate.png --layer rose-glow=tmp/thanh-duong-anh-sang/layer-rose-glow.png --layer dove-pair=tmp/thanh-duong-anh-sang/layer-dove-pair.png --layer light-shaft=tmp/thanh-duong-anh-sang/layer-light-shaft.png
```

Expected: `thanh-duong-anh-sang: prepared 3 transparent opening layers`

- [ ] **Step 3: Kiểm tra manifest sinh ra**

```bash
cat public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-assets.json
```

Expected: `canvas` là `1024x1536`, `plateSrc` là `/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-plate.webp`, đúng 3 layer với `id` là `rose-glow`, `dove-pair`, `light-shaft`. Mỗi `rect` phải có `y + height <= 584` — xác nhận họa tiết vẫn trong safe zone sau khi trim.

- [ ] **Step 4: Chạy validator**

```bash
npm run templates:validate-opening-assets -- --slugs thanh-duong-anh-sang
```

Expected: PASS, không throw. Nếu báo `unknown art opening theme`, Step 1 chưa được áp dụng.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-opening-effect-assets.ts public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/
git commit -m "feat(thanh-duong): chuẩn bị plate và ba layer alpha cho hiệu ứng mở"
```

---

## Task 3: Đăng ký motion opening effect

**Files:**
- Modify: `src/data/templates/art-opening-effects.ts` (thêm import + entry vào `effectInputs`)
- Modify: `src/data/templates/opening-effect.test.ts:22-55` (thêm vào `artThemeDurations`)

**Interfaces:**
- Consumes: `opening-assets.json` từ Task 2.
- Produces: `artOpeningEffects["thanh-duong-anh-sang"]` kiểu `ArtOpeningEffect` — Task 4 (manifest) truyền vào `createArtTemplateManifest({ openingEffect })`.

- [ ] **Step 1: Viết test kỳ vọng trước (thêm vào fixture duration)**

Trong `src/data/templates/opening-effect.test.ts`, thêm dòng cuối vào `artThemeDurations` (ngay sau `"hoa-thu-xanh-duong": 1470,`):

```typescript
  "hoa-thu-xanh-duong": 1470,
  "thanh-duong-anh-sang": 1400,
} as const;
```

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
npx tsx --test src/data/templates/opening-effect.test.ts
```

Expected: FAIL. Test `assert.deepEqual(Object.keys(artOpeningEffects).sort(), Object.keys(artThemeDurations).sort())` báo thiếu `thanh-duong-anh-sang` trong `artOpeningEffects`.

- [ ] **Step 3: Thêm import asset JSON**

Trong `src/data/templates/art-opening-effects.ts`, thêm dòng import sau dòng `import y2kChromeAssets ...` (dòng 32):

```typescript
import thanhDuongAnhSangAssets from "../../../public/chungdoi/images/themes/_decor/thanh-duong-anh-sang/opening-assets.json";
```

- [ ] **Step 4: Thêm entry motion vào `effectInputs`**

Trong cùng file, thêm entry ngay trước `...phongThuMotions,` (dòng ~293):

```typescript
  "thanh-duong-anh-sang": [thanhDuongAnhSangAssets, {
    durationMs: 1400,
    exits: {
      "rose-glow": [0, -90, 3.2, 0, 10],
      "dove-pair": [60, -75, 2.8, -8, 9],
      "light-shaft": [5, -80, 2.4, -5, 8],
    },
    peaks: {
      "rose-glow": { yPercent: -10, brightness: 1.4 },
      "dove-pair": { xPercent: 8, yPercent: -8, brightness: 1.2 },
      "light-shaft": { yPercent: -6 },
    },
    origins: {
      "rose-glow": "50% 10%",
      "dove-pair": "40% 20%",
      "light-shaft": "50% 7%",
    },
  }],
  ...phongThuMotions,
```

- [ ] **Step 5: Chạy test để xác nhận pass**

```bash
npx tsx --test src/data/templates/opening-effect.test.ts
```

Expected: PASS. Nếu báo `opening effect must contain 3 or 4 layers`, kiểm tra `opening-assets.json` có đúng 3 layer. Nếu báo lỗi duration, xác nhận `durationMs: 1400` (contract yêu cầu 1300–1500).

- [ ] **Step 6: Commit**

```bash
git add src/data/templates/art-opening-effects.ts src/data/templates/opening-effect.test.ts
git commit -m "feat(thanh-duong): đăng ký motion bồ câu và luồng sáng"
```

---

## Task 4: Manifest và wrapper renderer

**Files:**
- Create: `src/data/templates/thanh-duong-anh-sang.manifest.ts`
- Create: `src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx`
- Modify: `src/data/templates/template-manifest.test.ts:31-134` (3 fixture)
- Modify: `src/lib/og-image.test.ts:14-29` (`ART_OG_FONTS`)
- Auto-generated: `src/data/templates/generated-data.ts`, `src/components/generated/template-renderers.tsx`

**Interfaces:**
- Consumes: `artOpeningEffects["thanh-duong-anh-sang"]` từ Task 3.
- Produces: named export `manifest` từ file manifest; named export `ThanhDuongAnhSangInvitation` (nhận prop `{ content: ChungDoiDemoContent }`) từ wrapper. Registrar đọc cả hai qua convention tên file.

- [ ] **Step 1: Thêm slug vào 3 fixture của `template-manifest.test.ts`**

Thêm vào `NEW_ART_TEMPLATE_SLUGS` (sau `"hoa-thu-xanh-duong",`):

```typescript
  "hoa-thu-xanh-duong",
  "thanh-duong-anh-sang",
] as const;
```

Thêm vào `NEW_ART_TEMPLATE_HERO_COUNTS` (sau `"hoa-thu-xanh-duong": 1,`):

```typescript
  "hoa-thu-xanh-duong": 1,
  "thanh-duong-anh-sang": 1,
};
```

Thêm vào `NEW_ART_TEMPLATE_FONTS` (sau `"hoa-thu-xanh-duong": ["Fz Qellia", "font-art-qellia"],`):

```typescript
  "hoa-thu-xanh-duong": ["Fz Qellia", "font-art-qellia"],
  "thanh-duong-anh-sang": ["Fz Qellia", "font-art-qellia"],
} as const satisfies Record<(typeof NEW_ART_TEMPLATE_SLUGS)[number], readonly [string, string]>;
```

- [ ] **Step 2: (Tuỳ chọn) Thêm entry vào `ART_OG_FONTS` của `og-image.test.ts`**

Không bắt buộc — test lặp qua chính object này nên thiếu slug không fail. Thêm để có coverage OG font. Thêm vào `ART_OG_FONTS` (sau `"riso-duotone": [...],` ở dòng 28):

```typescript
  "riso-duotone": ["SVN-HC Marvin Visions", "SVN-HC-Marvin-Visions.otf"],
  "thanh-duong-anh-sang": ["Fz Qellia", "Fz_Qellia_Fix.ttf"],
} as const;
```

- [ ] **Step 3: Chạy test để xác nhận fail**

```bash
npx tsx --test src/data/templates/template-manifest.test.ts
```

Expected: FAIL với lỗi liên quan `thanh-duong-anh-sang` — thiếu catalog entry, hoặc `ENOENT` khi đọc `src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx`.

- [ ] **Step 4: Tạo manifest**

Create `src/data/templates/thanh-duong-anh-sang.manifest.ts`:

```typescript
import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "thanh-duong-anh-sang", viRouteSlug: "thanh-duong-anh-sang", rendererExport: "ThanhDuongAnhSangInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["thanh-duong-anh-sang"],
  name: "Cathedral Light", title: "Cathedral Light Wedding Invitation | Thiệp Mừng Online",
  description: "A warm limestone invitation framed by gothic arches and rose-window light.",
  category: "Modern", color: "Gold",
  highlights: ["Gothic double arch in warm limestone", "Rose window with cobalt and gold panes", "Dove pair rising through morning light"],
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  outer: "#f2ede0", card: "#f9f6ef", ink: "#1e3a5f", muted: "rgba(30,58,95,0.55)", accent: "#c9922f", buttonText: "#f9f6ef",
  fontFamily: "Fz Qellia", particleType: "sparkles", gallerySlug: "arch-sage", music: "/chungdoi/music/jasmine-white.mp3",
  i18n: {
    vi: { name: "Thánh Đường Ánh Sáng", description: "Thiệp cưới nền đá vôi ấm với vòm gothic, cửa sổ hoa hồng kính màu lam vàng và đôi bồ câu bay trong nắng sớm." },
    en: { name: "Cathedral Light", description: "Warm limestone, gothic pointed arches, a cobalt-and-gold rose window and a pair of doves rising through morning light." },
    ja: { name: "大聖堂の光", description: "温かな石灰岩の地に尖ったゴシック・アーチ、藍と金のバラ窓、朝の光に舞い上がる二羽の鳩を描いた招待状です。" },
    ko: { name: "성당의 빛", description: "따뜻한 석회석 바탕에 고딕 아치와 코발트·금빛 장미창, 아침 빛으로 날아오르는 비둘기 한 쌍을 담은 청첩장입니다。" },
    zh: { name: "圣堂之光", description: "温暖石灰岩底色，哥特尖拱与钴蓝金色玫瑰窗，一对白鸽在晨光中振翅的婚礼请柬。" },
  },
});
```

- [ ] **Step 5: Tạo wrapper renderer**

Create `src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { ArtInvitation, type ArtInvitationConfig, type InvitationTranslationKey } from "@/components/chungdoi-tpl-art-invitation";

const config = {
  layout: "split",
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  pageClass: "bg-[#f2ede0]",
  heroClass: "bg-[#f4f0e4]",
  surfaceClass: "bg-[#f9f6ef]",
  sectionClass: "border-t border-[#1e3a5f]/16 pt-10",
  inkClass: "text-[#1e3a5f]",
  mutedClass: "text-[#1e3a5f]/55",
  accentTextClass: "text-[#c9922f]",
  accentBgClass: "bg-[#c9922f]",
  borderClass: "border-[#1e3a5f]/18",
  buttonClass: "bg-[#c9922f] text-[#f9f6ef]",
  displayFontClass: "font-art-qellia",
  coupleClass: "text-[clamp(3.4rem,11vw,7rem)] font-normal leading-[0.84] tracking-wide",
  headingClass: "text-4xl font-normal leading-none md:text-6xl",
  imageClass: "saturate-[0.94]",
  radiusClass: "rounded-[999px]",
  giftLayout: "flip",
  accentHex: "#c9922f",
  inkHex: "#1e3a5f",
} satisfies ArtInvitationConfig;

export function ThanhDuongAnhSangInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const translate = (key: InvitationTranslationKey, values?: Record<string, string | number>) => t(key, values);
  return <ArtInvitation content={content} config={config} t={translate} />;
}
```

- [ ] **Step 6: Chạy registrar**

```bash
npm run templates:register
```

Expected: chạy thành công, ghi lại `src/data/templates/generated-data.ts` và `src/components/generated/template-renderers.tsx`. Xác nhận slug xuất hiện:

```bash
grep -c "thanh-duong-anh-sang" src/data/templates/generated-data.ts src/components/generated/template-renderers.tsx
```

Expected: cả hai file trả về số > 0.

- [ ] **Step 7: Chạy typecheck**

```bash
npm run typecheck && npm run typecheck:tests
```

Expected: PASS cả hai. Nếu `NEW_ART_TEMPLATE_FONTS` báo lỗi `satisfies`, một trong ba fixture ở Step 1 còn thiếu slug.

- [ ] **Step 8: Commit**

```bash
git add src/data/templates/thanh-duong-anh-sang.manifest.ts src/components/chungdoi-tpl-thanh-duong-anh-sang.tsx src/data/templates/generated-data.ts src/components/generated/template-renderers.tsx src/data/templates/template-manifest.test.ts src/lib/og-image.test.ts
git commit -m "feat(thanh-duong): thêm manifest và renderer Thánh Đường Ánh Sáng"
```

---

## Task 5: Seed demo và chụp preview

**Files:**
- Modify: `dev.db` (local, gitignored)
- Generate: `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/thanh_duong_anh_sang.webp`
- Modify: `src/data/template-preview-version.ts` (script tự đổi version)

**Interfaces:**
- Consumes: manifest đã đăng ký từ Task 4.
- Produces: 3 file preview WebP tên `thanh_duong_anh_sang.webp` (slug đổi `-` thành `_`). Test `template-manifest.test.ts` yêu cầu listing ≥ 20.000 bytes, portrait và landscape ≥ 10.000 bytes.

- [ ] **Step 1: Seed thiệp demo vào DB local**

```bash
npm run seed:demos
```

Expected: script upsert `demo-thanh-duong-anh-sang`. Không seed thì `/admin/demos` sẽ không thấy mẫu mới.

- [ ] **Step 2: Khởi động dev server bind `localhost`**

Chạy nền, giữ cửa sổ này:

```bash
node node_modules/next/dist/bin/next dev --hostname localhost -p 3200
```

Đợi tới khi in `Ready`. **Không** để script capture tự spawn server: nó bind `127.0.0.1`, khiến middleware next-intl rewrite sang `localhost` khác host và lặp redirect vô hạn — script sẽ báo "server không sẵn sàng sau 120 giây" rồi treo. Nếu cổng 3200 đang bị giữ, kill process cũ trước (`lsof -ti:3200 | xargs kill`).

- [ ] **Step 3: Chụp preview**

```bash
CAPTURE_BASE_URL=http://localhost:3200 npm run screenshots:templates -- --slug thanh-duong-anh-sang --no-sync-production
```

Expected: sinh 3 biến thể. `--no-sync-production` là bắt buộc khi chạy local để không ghi đè dữ liệu production.

- [ ] **Step 4: Xác nhận preview đủ 3 biến thể và đủ dung lượng**

```bash
ls -l public/chungdoi/images/template-previews/en/listing/thanh_duong_anh_sang.webp public/chungdoi/images/template-previews/en/portrait/thanh_duong_anh_sang.webp public/chungdoi/images/template-previews/en/landscape/thanh_duong_anh_sang.webp
```

Expected: listing ≥ 20.000 bytes, portrait và landscape ≥ 10.000 bytes. Nếu nhỏ hơn, trang render lỗi hoặc capture chụp lúc chưa load xong — chụp lại.

- [ ] **Step 5: Tắt dev server**

Ctrl-C cửa sổ ở Step 2, hoặc `lsof -ti:3200 | xargs kill`.

- [ ] **Step 6: Commit**

```bash
git add public/chungdoi/images/template-previews/en/ src/data/template-preview-version.ts
git commit -m "feat(thanh-duong): chụp preview listing, portrait và landscape"
```

---

## Task 6: Full verification gate

**Files:** không tạo file mới — task này chạy toàn bộ gate tự động và gate trực quan.

**Interfaces:**
- Consumes: mọi thứ từ Task 1–5.
- Produces: xác nhận mẫu đạt Definition of Done.

- [ ] **Step 1: Chạy validator asset toàn bộ**

```bash
npm run templates:validate-opening-assets
```

Expected: PASS cho tất cả 33 slug (32 slug cũ + `thanh-duong-anh-sang`). Chạy toàn bộ, không dùng `--slugs`, để bắt hồi quy.

- [ ] **Step 2: Chạy typecheck**

```bash
npm run typecheck && npm run typecheck:tests
```

Expected: PASS cả hai, không lỗi.

- [ ] **Step 3: Chạy unit test**

```bash
npm run test:unit
```

Expected: tất cả PASS. Đặc biệt `template-manifest.test.ts`, `opening-effect.test.ts`, `og-image.test.ts` và `art-invitation-typography.test.ts`.

- [ ] **Step 4: Chạy lint**

```bash
npm run lint
```

Expected: không error mới. Warning tồn tại sẵn trong repo không tính là lỗi — so sánh với `git stash` nếu cần phân biệt.

- [ ] **Step 5: Chạy build production**

```bash
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
```

Expected: build thành công, route `/mau-thiep/thanh-duong-anh-sang/demo` xuất hiện trong output.

- [ ] **Step 6: Kiểm tra whitespace**

```bash
git diff --check
```

Expected: không output.

- [ ] **Step 7: Gate trực quan**

Khởi động lại dev server (`node node_modules/next/dist/bin/next dev --hostname localhost -p 3200`), mở `http://localhost:3200/mau-thiep/thanh-duong-anh-sang/demo` và xác nhận từng điểm:

- Desktop 1280–1440px: nội dung sau mở một cột, outer tối đa 900px, cột đọc tối đa 760px.
- Mobile 390×844: full width. Chạy `document.documentElement.scrollWidth <= innerWidth` trong console → `true`.
- Hero artwork cao gần một viewport, tên và ngày nằm dưới, **không có nét vòm hay bồ câu nào cắt qua chữ**.
- Cuộn hai vị trí khác nhau: parallax thực sự chạy khác tốc độ với foreground.
- **Trước khi bấm Mở thiệp**: không có họa tiết nào vượt khỏi bo góc bìa.
- **Sau khi bấm Mở thiệp**: chụp một frame ở khoảng 60–70% (≈900ms) — bồ câu và hào quang phải lớn, sắc nét và vượt rõ mép thiệp; plate không zoom theo.
- Kiểm tra biên alpha của bồ câu trên nền tương phản: không còn viền chữ nhật hay matte bám theo.
- Sau 1400ms, overlay unmount, nội dung thiệp hoạt động bình thường.
- Bật `prefers-reduced-motion: reduce` (DevTools → Rendering): chỉ còn fade ngắn ~180ms, không scale/translate.
- Mọi section render đủ: hero, tên/ngày, 1 ảnh mở đầu, lời mời, hai gia đình, lễ và tiệc, countdown, lịch, album, timeline, bản đồ, dress code, guestbook, QR, footer.
- Trang `/mau-thiep` hiện mẫu mới với nhãn category "Hiện đại" và color "Vàng" — **không** hiện key thô `listing.categories.Modern`.

- [ ] **Step 8: Ghi provenance nếu cần**

Artwork sinh 100% bằng SVG trong repo, không dùng nguồn ngoài — **không cần** thêm entry vào `docs/research/asset-provenance.md`. Nếu có thay thế bằng ảnh ngoài, phải ghi nguồn.

- [ ] **Step 9: Commit cuối nếu có thay đổi còn sót**

```bash
git status --short
```

Nếu còn file chưa commit, commit chúng. Nếu sạch, task hoàn thành.

---

## Definition of Done

- [ ] Concept khác biệt rõ — vòm gothic và kính màu chưa mẫu nào dùng.
- [ ] Artwork sinh từ SVG trong repo, không cần provenance ngoài.
- [ ] Manifest đủ 5 locale, copy trung tính tôn giáo.
- [ ] Wrapper dùng shared renderer, không inline style, không `font-sans`/`font-serif` trong treatment.
- [ ] Registrar chạy thành công, `generated-data.ts` và `template-renderers.tsx` có slug mới.
- [ ] 4 registry hardcode đã cập nhật: `ART_OPENING_THEME_SLUGS`, `artThemeDurations`, 3 fixture `template-manifest.test.ts`, `ART_OG_FONTS`.
- [ ] `listing.categories.Modern` và `listing.colors.Gold` đã có sẵn — không cần sửa `messages/vi.json`.
- [ ] `npm run seed:demos` đã chạy.
- [ ] Đúng 1 ảnh mở đầu; opening effect có plate + 3 layer alpha sạch, duration 1400ms.
- [ ] Layer khớp pixel-perfect với plate ở frame đầu, sắc nét tới ~70%.
- [ ] Reduced motion chỉ fade ~180ms.
- [ ] Đủ preview listing (≥20KB), portrait và landscape (≥10KB).
- [ ] validate-opening-assets, typecheck, typecheck:tests, test:unit, lint, build, `git diff --check` đều pass.
- [ ] Gate trực quan desktop + mobile đã kiểm tra.
