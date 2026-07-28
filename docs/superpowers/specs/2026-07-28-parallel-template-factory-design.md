# Parallel Template Factory — Design

**Ngày:** 2026-07-28
**Mục tiêu:** Sản xuất 18 mẫu thiệp cưới mới (9 truyền thống VN + 9 modern/quốc tế) bằng pipeline fan-out nhiều agent song song, có tầng phê bình thẩm mỹ tự động, tận dụng quota lớn.

## Cập nhật tiếp tục trên Codex (2026-07-28)

- Commit `42118fe` đã đưa renderer, gallery, nhạc và preview cho 4 mẫu `editorial-noir`, `ticket-terracotta`, `zen-sand`, `arch-sage` vào branch, nhưng chưa nối catalog, route, demo content, theme và i18n. Vì vậy 4 mẫu chưa thực sự xuất hiện công khai.
- Codex hiện có image generation. Asset mới ưu tiên tạo riêng theo concept, không tải artwork thương mại từ đối thủ. Nguồn public-domain hoặc museum open-access chỉ dùng để kiểm chứng motif lịch sử và ghi provenance khi có sử dụng trực tiếp.
- Manifest/registrar được triển khai trước với 4 mẫu trên làm ca kiểm chứng. Sau đó 18 mẫu mới dùng cùng một đường đăng ký, thay vì sửa thủ công nhiều registry.
- Baseline trước khi tiếp tục: 138/138 unit test pass, TypeScript app và test pass.
- Kết quả triển khai: 22 manifest được registrar nối tự động (4 mẫu đang park + 18 mẫu mới), đưa catalog lên 62 mẫu và renderer audit lên 39 mẫu. Cả 18 mẫu mới có artwork gốc, 5 locale và đủ preview listing/portrait/landscape.
- Sau review sản phẩm, cả 18 mẫu giữ bố cục một cột nhưng phần thiệp sau khi mở được nới tối đa 900px, với cột nội dung đọc tối đa 760px và co toàn chiều rộng trên mobile. Bìa trước khi mở không thay đổi. Artwork được tái sử dụng thành ba lớp nền parallax mờ; hero và ảnh cô dâu/chú rể có chuyển động cuộn nhẹ, đồng thời tắt hoàn toàn khi người dùng bật giảm chuyển động. 8 mẫu dùng một ảnh mở đầu và 10 mẫu dùng hai ảnh cô dâu/chú rể xếp dọc.
- Gate trực quan đã kiểm tra đủ 6 họ thẩm mỹ trên preview thật; ảnh mở đầu, nội dung, lịch, album, bản đồ, sổ lưu bút và QR đều hiển thị, không có ảnh trắng hoặc section bị cắt.

## Bối cảnh

Repo hiện có **40 slug** trong catalog / 40 file renderer (một số file chứa nhiều biến thể màu). Khảo sát cho thấy sự đơn điệu về trục thẩm mỹ:

- Chỉ 8 giá trị `color` trong toàn catalog (Red, Green, Blue, Pink, White, Brown, Gold, Black)
- Chỉ 7 font couple; `Fz Aghita` + `Fz Qellia` chiếm phần lớn slug
- Không có tím/lavender, không có mustard/cam đất
- Toàn bộ motif truyền thống là Hán tự long-phụng-song-hỷ — **không có tạo hình dân gian bản địa nào** (Đông Hồ, Hàng Trống, thổ cẩm, sơn mài)
- 4 mẫu thuần CSS/SVG (`arch-sage`, `editorial-noir`, `ticket-terracotta`, `zen-sand`) là công việc đang park; 40 slug đang live phụ thuộc raster.

Branch `feat/new-invitation-layouts` đang dở 4 mẫu trên (thiếu preview `vi`, thiếu seed, test audit đỏ). Quyết định: **park** sang `wip/old-4-layouts`, làm lại theo pipeline mới. Giữ lại `src/components/chungdoi-tpl-ornaments.tsx` — **10** SVG primitive (`HairRule`, `OrnamentDivider`, `DiamondRule`, `EnsoCircle`, `LinkedRings`, `LeafSprig`, `PerforationRule`, `Barcode`, `ArchOutline`, `CornerBracket`) dùng lại được.

## Trạng thái đã xác minh (2026-07-28, sau khi park)

Xác minh trực tiếp trên working tree, không dựa vào khảo sát agent:

- `templates[]` = **40**, `completedTemplateSlugs` = **40**, `vietnameseTemplateSlugs` = **40**, `AUDITED_TEMPLATE_SLUGS` = **17**
- 4 mẫu park đã bị revert khỏi 5 registry (`chungdoi.ts`, `template-route-slugs.ts`, `audited-template-renderers.ts`, `chungdoi-demo-content.ts`, `chungdoi-demo.tsx`)
- Wiring đầy đủ của 4 mẫu đó được snapshot ở commit `cb9b6fa` trên branch `backup/new-templates-snapshot` (reachable, an toàn khỏi GC)
- Còn sót chưa dọn: 4 renderer `.tsx` (untracked), 4 entry trong `chungdoi-theme-config.ts` (dirty), 12 preview WebP (untracked), `new-invitation-layouts.test.ts` (untracked), entry `listing.templates.*` + namespace `invitationTemplate` trong 5 file messages (dirty)
- `src/data/templates/` **chưa tồn tại** — Task 1 tạo mới
- Type renderer dùng là `ChungDoiDemoContent` từ `@/data/chungdoi-demo-content` (bản rich), **không phải** type trùng tên trong `chungdoi.ts` (bản đó không được component nào dùng)
- Không có hàm `createLayoutDemo` — `chungdoiDemoContent` là `Record<string, ChungDoiDemoContent>` với object literal đầy đủ

## Vấn đề kiến trúc cốt lõi: tranh chấp file dùng chung

Một mẫu mới phải chạm **14 điểm đăng ký**, trong đó ~10 điểm là file dùng chung cho cả 40 slug:

| File | Điểm chạm |
|---|---|
| `src/data/chungdoi.ts` | `templates[]` (:29-747) + `completedTemplateSlugs` (:751-792) |
| `src/data/template-route-slugs.ts` | `vietnameseTemplateSlugs` (:1-42) |
| `src/lib/audited-template-renderers.ts` | `AUDITED_TEMPLATE_SLUGS` (17 slug hiện tại) |
| `src/components/chungdoi-demo.tsx` | `dynamic()` import + `AUDITED_TEMPLATE_RENDERERS` map |
| `src/data/chungdoi-theme-config.ts` | theme token |
| `src/data/chungdoi-demo-content.ts` | demo content |
| `messages/{vi,en,ja,ko,zh}.json` | `listing.templates.<slug>` |
| `src/data/template-preview-version.ts` | auto-gen bởi capture script |
| `tests/e2e/templates.spec.ts` | `ENVELOPE_GROUP_E_SLUGS` |
| `src/components/chungdoi-envelope-sizing-policy.test.ts` | `groupE` |
| `src/lib/new-invitation-layouts.test.ts` | `NEW_LAYOUTS` |
| `src/lib/audited-template-renderers.test.ts` | count hard-code → registrar set `35` |

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
  demoContent: { baseSlug: "song-hy-red", primaryColor: "#...", fontFamily: "Lora" },
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

| # | Slug | Concept | Khác biệt so với 40 mẫu hiện có |
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
| Độc bản | Có lẫn với mẫu nào trong 40 mẫu cũ? Critic được xem 3 preview gần nhất về màu để so | ≥4 |
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
| `audited-template-renderers.test.ts` count hard-code | Registrar nối động `17` base + 4 mẫu park + 18 mẫu mới = `39` |
| 18 mẫu nhàn nhạt giống nhau | Mỗi concept có cột "khác biệt" ràng buộc từ đầu; critic tiêu chí Độc bản |
| Asset chưa có khi renderer chạy | Stage 2 chạy trước stage 3, chặn cứng |

## Ngoài phạm vi

- Không sửa 40 mẫu hiện có
- Không đổi editor / capabilities trừ khi mẫu mới cần hero image
- Không deploy production trong đợt này — chỉ tới gate duyệt người thật
