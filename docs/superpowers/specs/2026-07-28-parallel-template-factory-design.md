# Parallel Template Factory — Design

**Ngày:** 2026-07-28
**Mục tiêu:** Sản xuất 18 mẫu thiệp cưới mới (9 truyền thống VN + 9 modern/quốc tế) bằng pipeline fan-out nhiều agent song song, có tầng phê bình thẩm mỹ tự động, tận dụng quota lớn.

## Bối cảnh

Repo hiện có 44 slug trong catalog / 40 file renderer. Khảo sát cho thấy sự đơn điệu về trục thẩm mỹ:

- Chỉ 8 giá trị `color` trong toàn catalog (Red, Green, Blue, Pink, White, Brown, Gold, Black)
- Chỉ 7 font couple; `Fz Aghita` + `Fz Qellia` chiếm ~24/44 slug
- Không có tím/lavender, không có mustard/cam đất
- Toàn bộ motif truyền thống là Hán tự long-phụng-song-hỷ — **không có tạo hình dân gian bản địa nào** (Đông Hồ, Hàng Trống, thổ cẩm, sơn mài)
- 4 mẫu duy nhất thuần CSS/SVG: `arch-sage`, `editorial-noir`, `ticket-terracotta`, `zen-sand`. 40 slug còn lại phụ thuộc raster.

Branch `feat/new-invitation-layouts` đang dở 4 mẫu trên (thiếu preview `vi`, thiếu seed, test audit đỏ). Quyết định: **park** sang `wip/old-4-layouts`, làm lại theo pipeline mới. Giữ lại `src/components/chungdoi-tpl-ornaments.tsx` — 29 SVG primitive dùng được cho ~14 mẫu mới.

## Vấn đề kiến trúc cốt lõi: tranh chấp file dùng chung

Một mẫu mới phải chạm **14 điểm đăng ký**, trong đó ~10 điểm là file dùng chung cho cả 44 slug:

| File | Điểm chạm |
|---|---|
| `src/data/chungdoi.ts` | `templates[]` + `completedTemplateSlugs` (:867) |
| `src/data/template-route-slugs.ts` | `vietnameseTemplateSlugs` (:45) |
| `src/lib/audited-template-renderers.ts` | `AUDITED_TEMPLATE_SLUGS` (:22) |
| `src/components/chungdoi-demo.tsx` | `dynamic()` import + `AUDITED_TEMPLATE_RENDERERS` map |
| `src/data/chungdoi-theme-config.ts` | theme token |
| `src/data/chungdoi-demo-content.ts` | demo content |
| `messages/{vi,en,ja,ko,zh}.json` | `listing.templates.<slug>` |
| `src/data/template-preview-version.ts` | auto-gen bởi capture script |
| `tests/e2e/templates.spec.ts` | `ENVELOPE_GROUP_E_SLUGS` |
| `src/components/chungdoi-envelope-sizing-policy.test.ts` | `groupE` |
| `src/lib/new-invitation-layouts.test.ts` | `NEW_LAYOUTS` |
| `src/lib/audited-template-renderers.test.ts` | count hard-code `21` → phải bump (xem tính toán dưới) |

18 agent cùng ghi 10 file này song song = hỗn loạn merge. Đây là cách đốt quota vô ích nhất.

### Giải pháp: đảo ngược quyền ghi

Mỗi agent **chỉ được ghi 2 file thuộc riêng nó**:

1. `src/components/chungdoi-tpl-<slug>.tsx` — renderer
2. `src/data/templates/<slug>.manifest.ts` — descriptor tự chứa

Manifest shape:

```ts
export const manifest: TemplateManifest = {
  slug: "dong-ho-folk",
  viRouteSlug: "dong-ho-dan-gian",
  catalog: { name, title, description, category, color, isNew, highlights[] },
  theme: { background, cardBg, textPrimary, /* ... */ particleColors[], particleType },
  fonts: { couple, body },
  sealType: "happiness",
  decorations: { cardImages: [...] },
  demoContent: { baseSlug: "song-hy-red", accent: "#...", font: "Lora" },
  i18n: {
    vi: { name, description },
    en: { name, description },
    ja: { /* ... */ }, ko: { /* ... */ }, zh: { /* ... */ },
  },
  assets: ["/chungdoi/images/themes/_decor/dong-ho/ga.webp"],
};
```

Không agent nào được chạm file dùng chung. Sau khi tất cả xong, **một pass "registrar" duy nhất** (chạy inline, tuần tự, xác định) fold toàn bộ manifest vào 10 registry một lượt. N-way conflict trở thành append-only.

Đây là điểm khiến pipeline scale được tới 18 agent song song thật.

## Pipeline 7 stage

| Stage | Việc | Song song | Ghi chú |
|---|---|---|---|
| 0 | Crawl tham chiếu, dựng mood board | 6 agent theo cụm thẩm mỹ | quốc tế + đối thủ VN |
| 1 | Chốt 18 concept | gate người thật | |
| 2 | Sản xuất asset raster | 3–4 agent crawl | theo asset policy dưới |
| 3 | Viết renderer + manifest | 18 agent, worktree riêng | burn chính #1 |
| 4 | Registrar fold-in | 1 pass tuần tự inline | |
| 5 | Seed + screenshot + auto-critic | 18 agent, ≤3 vòng | burn chính #2 |
| 6 | `npm run check` + e2e + gate người thật | tuần tự | |

Vehicle: `Workflow` tool — fan-out có schema, `isolation: 'worktree'` cho stage 3, `pipeline()` không barrier nên mẫu A có thể đang critic khi mẫu B còn đang viết.

Ước lượng: **2–4M token, ~4–6 giờ wall-clock**.

## Asset policy (stage 2)

Không có tool sinh ảnh trong môi trường này, nên asset raster phải crawl. Thứ tự ưu tiên:

1. **Public domain / CC0 / museum open-access** — Wikimedia Commons, Met, Rijksmuseum, Bảo tàng Mỹ thuật VN. Tranh Đông Hồ, Hàng Trống, hoa văn cung đình Nguyễn, motif gốm Bát Tràng đều có bản scan độ phân giải cao dùng thương mại được.
2. **Stock free license** — khi (1) không đủ.
3. **Site đối thủ VN: mood board tham chiếu duy nhất.** Xem để học bố cục, **không tải asset về.** Artwork của họ là hàng mua hoặc thuê vẽ — dùng cho sản phẩm bán tiền là rủi ro bản quyền thật.

Asset đích: `public/chungdoi/images/themes/_decor/<concept>/`. Mỗi asset ghi nguồn + license vào `docs/research/asset-provenance.md`.

Stage 2 chạy **trước** stage 3 vì renderer không render được khi asset chưa tồn tại — capture script fail hard nếu `naturalWidth === 0`.

## 18 concept

### Truyền thống VN (9)

| # | Slug | Concept | Khác biệt so với 44 mẫu hiện có |
|---|---|---|---|
| 1 | `dong-ho-folk` | Đông Hồ woodblock | Giấy dó, màu điệp — không mẫu nào có tạo hình dân gian |
| 2 | `tho-cam-highland` | Thổ cẩm H'Mông/Thái | `brocade-flower-red` là gấm cung đình Trung, không phải dệt vùng cao |
| 3 | `son-mai-lacquer` | Sơn mài | Đen sâu + vàng quỳ + vỏ trứng rạn — chất liệu chưa ai chạm |
| 4 | `bat-trang-blue` | Gốm Bát Tràng lam-trắng | `crystal-floral-blue` gọi là porcelain nhưng hình là hoa tinh thể Âu |
| 5 | `hang-trong-folk` | Hàng Trống | Khác Đông Hồ về nét và màu, cùng họ dân gian |
| 6 | `sen-monoline` | Sen monoline mực | Hoa hiện tại 100% watercolor raster đã tô |
| 7 | `truc-chi-minimal` | Trúc chỉ tối giản | Giấy thủ công, gần như không trang trí |
| 8 | `long-phung-deco` | Long phụng Deco | Lai Art Deco với truyền thống — hình học thay vì hữu cơ |
| 9 | `ao-dai-hue` | Áo dài Huế / dệt cung đình | Trọng tâm là vải và đường may, khác `nhat-binh-red` |

### Modern / quốc tế (9)

| # | Slug | Concept | Khoảng trống được lấp |
|---|---|---|---|
| 10 | `art-deco-gatsby` | Art Deco 1920s | Quạt/chevron/sunburst; 4 mẫu royal là vàng-trên-tối nhưng hoa văn hữu cơ |
| 11 | `celestial-map` | Star map / pha trăng | Không mẫu nào lấy thiên văn làm ngôn ngữ hình |
| 12 | `coastal-mediterranean` | Coastal Địa Trung Hải | 3 tông xanh hiện có đều navy/lam sứ; cưới Phú Quốc/Đà Nẵng là phân khúc lớn |
| 13 | `swiss-brutalist` | Swiss grid mono | `editorial-noir` gần nhất nhưng vẫn serif cổ điển |
| 14 | `riso-duotone` | Riso overprint | Không mẫu nào có texture in ấn |
| 15 | `cinema-credit` | Poster phim / credit block | `ticket-terracotta` dùng vật phẩm in, chưa dùng ngữ pháp điện ảnh |
| 16 | `aurora-glass-dark` | Dark aurora glassmorphism | `glass-garden-green` có panel kính nhưng nền sáng; chưa có dark-mode gốc |
| 17 | `y2k-chrome` | Y2K chrome gradient | Mọi palette đang muted; chưa có gì bão hoà |
| 18 | `botanical-lavender` | Botanical monoline lavender/mustard | Lấp đúng 2 khoảng trống màu |

## Renderer contract

Ràng buộc bị test hard-gate (`src/lib/new-invitation-layouts.test.ts`):

```ts
"use client";
export function XInvitation({ content }: { content: ChungDoiDemoContent })
```

- **Không được có `style=`** — chỉ Tailwind arbitrary values (`bg-[#eef1ea]`)
- **Phải gọi `useTranslations("invitationTemplate")`** — mọi copy tĩnh qua `t(...)`
- Tên file **phải** khớp slug: `chungdoi-tpl-<slug>.tsx`

Helper dùng lại từ `src/components/chungdoi-tpl-shared.tsx`: `formatDate`, `buildCalendar`, `formatWishTime`, `googleCalendarUrl`, `InvitationMap`, `MapDirectionsButton`, `SharedCountdown`, `SharedWishForm`, `AlbumGallery`, `GiftEnvelope`, `GiftQrGrid`, `SharedCarousel`, `Lightbox`/`useLightbox`, `DressCode`, `FitText`, `FamilyColumn`, `hexToRgba`.

Ornament SVG từ `src/components/chungdoi-tpl-ornaments.tsx` (29 primitive): `ArchOutline`, `LeafSprig`, `EnsoCircle`, `PerforationRule`, `Barcode`, `HairRule`, `DiamondRule`, `LinkedRings`, `CornerBracket`, …

Display helper từ `src/lib/invitation-display.ts`: `orderedCouple`, `orderByBrideFirst`, `invitationOpeningMessage`, `invitationCeremonyMessage`, `invitationHeroImage`.

Copy key bắt buộc có trong cả 5 locale: `invitation, ceremony, reception, album, location, timeline, guestbook, gift, addToCalendar, presenceHonor`.

**Envelope sizing tự động** — `responsiveEnvelopeTemplateSlugs` derive thẳng từ `vietnameseTemplateSlugs`, nên chỉ cần registrar thêm cặp `[slug, viSlug]` là xong.

## Tầng critic (stage 5)

**Critic xem ảnh, không đọc code.** Agent viết renderer **không được tự chấm** mẫu của mình.

Screenshot: `npm run screenshots:templates -- --slug <slug> --no-sync-production`
(cờ `--no-sync-production` là bắt buộc — mặc định script rsync demo từ minipc rồi `delete from Invitation where isDemo = 1`, sẽ xóa demo local vừa seed.)

Bốn tiêu chí, mỗi cái 1–5, kèm lý do bắt buộc:

| Tiêu chí | Hỏi gì | Ngưỡng |
|---|---|---|
| Độc bản | Có lẫn với mẫu nào trong 44 mẫu cũ? Critic được xem 3 preview gần nhất về màu để so | ≥4 |
| Hoàn thiện | Chữ tràn, ảnh vỡ, khoảng trắng chết, chồng lớp, mobile 375px | ≥4 |
| Trung thực concept | Trông có đúng là "sơn mài"/"Art Deco", hay chỉ là màu na ná | ≥4 |
| Bán được | Cô dâu VN có gửi cái này cho họ hàng không | ≥3 |

Dưới ngưỡng → critic trả danh sách sửa cụ thể → agent gốc sửa → chụp lại → chấm lại. **Tối đa 3 vòng.** Vòng 3 vẫn fail → đánh dấu `needs-human`, đưa người xem. Không tự loại, không tự ship.

Hai chốt an toàn:

- **Critic chạy trên model mạnh** — cùng tier với agent viết. Chấm thẩm mỹ bằng model yếu là tự lừa mình.
- **Auto-critic chỉ là bộ lọc thô.** Gate cuối là mắt người ở stage 6 — trang lưới 18 preview để duyệt một lượt.

## Định nghĩa "xong" cho một mẫu

Cả 6 điều, không thiếu điều nào:

1. `npm run check` xanh (lint + typecheck + typecheck:tests + test:unit + build)
2. Test audit registry pass — có mặt ở đủ 14 điểm đăng ký
3. Renderer không có `style=`, mọi copy qua `useTranslations`
4. Copy đủ 5 locale (vi/en/ja/ko/zh)
5. 3 preview WebP hợp lệ, không blank/clip (listing ≥20KB, portrait/landscape ≥10KB, raw height ≥1200px)
6. Critic ≥ ngưỡng cả 4 tiêu chí, **hoặc** được người duyệt tay

## Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| 18 agent tranh chấp registry | Manifest pattern + registrar 1 pass (kiến trúc cốt lõi) |
| Bản quyền asset | Asset policy PD/CC0-first; site đối thủ chỉ mood board |
| Agent tự cho điểm cao | Critic là agent khác, xem ảnh, có ngưỡng số |
| Critic hạ tier làm mất giá trị | Ràng buộc critic dùng model mạnh |
| Capture script xóa demo local | Bắt buộc `--no-sync-production` |
| `audited-template-renderers.test.ts` count hard-code | Registrar bump `21` → `35` (17 base + 18 mới) |
| 18 mẫu nhàn nhạt giống nhau | Mỗi concept có cột "khác biệt" ràng buộc từ đầu; critic tiêu chí Độc bản |
| Asset chưa có khi renderer chạy | Stage 2 chạy trước stage 3, chặn cứng |

## Ngoài phạm vi

- Không sửa 44 mẫu hiện có
- Không đổi editor / capabilities trừ khi mẫu mới cần hero image
- Không deploy production trong đợt này — chỉ tới gate duyệt người thật
