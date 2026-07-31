# Nguyệt Ảnh Sleeve - pilot specification

## Trạng thái quyết định

- Ngày khóa baseline: 2026-07-31.
- Phạm vi: một mẫu thí điểm duy nhất.
- Slug: `nguyet-anh-sleeve`.
- Renderer family: `contact-sheet`.
- Physical carrier: smoked-glass sleeve chứa một film card hai mặt.
- Hướng thị giác: cold-luxury darkroom, photogram sen Việt đương đại.
- Opening trigger: chỉ native button `Mở thiệp`.
- Stack: React Three Fiber/Three.js/Drei, GSAP, React DOM và CSS fallback.

## Concept một câu

Một film card ánh bạc nằm trong sleeve kính khói; khi khách bấm mở, aperture
nhả khóa, film card trượt ra theo ma sát, xoay về mặt đọc và camera đi vào khung
ảnh đầu tiên trước khi handoff sang một contact sheet DOM.

## Originality gate

| Trục | Nguyệt Ảnh Sleeve | Khác Long Phụng Gatefold |
| --- | --- | --- |
| `navigationModel` | Contact-sheet chapters và vertical film reel | Có |
| `heroComposition` | Smoked-glass sleeve + film card | Có |
| `sectionGrammar` | Frame, proof sheet, exposure notes, film strip | Có |
| `mediaPresentation` | Contact sheet và full-bleed proof frames | Có |
| `signatureMotion` | Aperture release, card pull-out, quarter-turn settle | Có |

Kết quả: khác `5/5` trục. Concept không dựa chủ yếu vào palette, font hoặc
artwork.

## `TemplateArtDirection`

```ts
const nguyetAnhSleeveArtDirection = {
  layoutFamily: "contact-sheet-darkroom",
  coverGeometry:
    "smoked-glass vertical sleeve with a visible open slot, silver edge rails, a two-sided inner film card and a shallow aperture lock",
  openingMechanism:
    "the explicit open button releases the aperture, the film card slides upward with restrained friction, rotates toward the camera and aligns its first frame with the DOM hero",
  typography: {
    display: '"HelveticaNeue", "Be Vietnam Pro", sans-serif',
    body: '"Be Vietnam Pro", "HelveticaNeue", sans-serif',
    hierarchy:
      "light display sans for couple names, condensed titling only for short headings, body sans for dates, addresses, controls and forms",
  },
  colorPalette:
    "graphite #0B1116; smoke #14232D; silver #D7E4EA; moon cyan #78C7D7; ink #071015",
  materialPreset:
    "smoked acrylic outer sleeve, brushed aluminium rails, matte photographic paper and restrained pearl emulsion",
  lightingPreset:
    "cool key from upper-left, low silver rim from the right and soft grounded contact shadow",
  motionPreset:
    "friction-led pull, no bounce, continuous spherical camera settle, 3D object and DOM frame align without crossfade",
  soundPreset:
    "short aperture tick, low film drag and a soft frame-seat cue; shared mute state",
  sectionCompositions: [
    "first-frame handoff hero",
    "two portrait proof frames",
    "family exposure notes",
    "ceremony film strip",
    "countdown light table",
    "calendar proof sheet",
    "album contact sheet",
    "timeline exposure log",
    "map projection frame",
    "dress-code emulsion swatches",
    "guestbook annotation panel",
    "gift negative sleeve",
    "thank-you end frame",
  ],
} satisfies TemplateArtDirection;
```

## `PhysicalOpeningModel`

```ts
const nguyetAnhSleeveOpeningModel = {
  object: "sleeve",
  openTrigger: "explicit-button",
  closedInteraction: {
    mode: "tilt-and-flip",
    showsBackFace: true,
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  affordance:
    "native open button releases a shallow aperture lock; the aperture is visual feedback only and never opens on canvas click",
  hinges: [
    {
      part: "aperture-ring",
      transformOrigin: "center axis",
    },
    {
      part: "film-card",
      transformOrigin: "card center after leaving the sleeve slot",
    },
  ],
  revealOrder: [
    "aperture contraction",
    "slot light",
    "film perforations",
    "film card portrait frame",
    "couple names and wedding date",
    "DOM first frame",
  ],
  cameraTransition:
    "preserve current camera and object pose, travel on the shortest spherical path to an opening-safe angle, then dolly only after the film clears the sleeve",
  settleTarget:
    "the first film frame matches the DOM hero rectangle, aspect ratio, background and camera-facing angle",
  durationMs: 2050,
  mobileDurationMs: 1780,
  reducedMotionDurationMs: 200,
} satisfies PhysicalOpeningModel;
```

## `AssetBible`

```ts
const nguyetAnhSleeveAssetBible = {
  templateSlug: "nguyet-anh-sleeve",
  culturalDirection:
    "contemporary Vietnamese botanical photogram using lotus as a quiet photographic subject, without claiming a historic photographic reconstruction",
  primaryMotifs: [
    "asymmetrical lotus photogram",
    "restrained moon-aperture ring",
    "film perforations",
    "silver emulsion edge",
  ],
  illustrationStyle:
    "cyanotype and silver-gelatin photogram with real photographic-paper grain and a large center safe zone",
  lineWeight:
    "botanical silhouettes must survive a 320px projected cover; grain remains subordinate to text",
  palette: ["#0B1116", "#14232D", "#D7E4EA", "#78C7D7", "#071015"],
  materialLanguage: [
    "smoked acrylic",
    "brushed aluminium",
    "matte photographic paper",
    "pearl emulsion",
  ],
  lightingDirection:
    "cool key from upper-left; runtime material owns highlights and reflections",
  detailLevel: "medium",
  symmetryRule:
    "intentionally asymmetric botanical mass with a centered readable frame",
  animationLayers: [
    "outer-sleeve",
    "aperture-ring",
    "inner-film-card",
    "slot-light",
  ],
  requiredMasks: [
    "film-card-alpha",
    "aperture-mask",
    "paper-roughness",
  ],
  mobileReadabilityRule:
    "at 320px cover width the lotus silhouette, aperture circle and card slot remain distinct; text safe zone stays visually quiet",
  avoid: [
    "generated text, numbers, logo, signature or watermark",
    "warm beige, brass or red lacquer",
    "purple neon and outer glow",
    "generic floral wreath",
    "wedding rings or stock wedding iconography",
    "reflection baked into the color artwork",
    "grain dense enough to reduce name contrast",
  ],
} satisfies AssetBible;
```

## Storyboard desktop

Target full-motion duration: `2050ms`.

| Progress | Phase | Hành động |
| ---: | --- | --- |
| `0%` | `closed` | Giữ nguyên camera, target và pose do khách vừa xoay. |
| `0-10%` | `anticipation` | Aperture co nhẹ, slot light phản hồi tức thì. |
| `10-24%` | `release` | Sleeve nội suy về góc mở an toàn, aperture nhả khóa. |
| `24-58%` | `extract` | Film card trượt lên khỏi slot theo quỹ đạo thẳng có ma sát. |
| `46-72%` | `rotate` | Card xoay nhẹ về camera, sleeve lùi xuống và ra sau. |
| `70-94%` | `settle` | Camera đi theo quỹ đạo cầu, frame đầu khớp DOM hero. |
| `94-100%` | `handoff` | DOM nhận focus; Canvas giữ thêm hai frame rồi unmount. |

## Storyboard mobile

Target full-motion duration: `1780ms`.

- Camera widen nhẹ trước khi card di chuyển.
- Card chỉ trượt khoảng `72%` quãng desktop rồi sleeve hạ xuống khỏi reading
  path, không để vật thể vượt viewport.
- Quarter-turn giảm còn khoảng `8deg`.
- DOM hero chiếm chiều rộng an toàn `min(88vw, 28rem)`.
- Không yêu cầu hover hoặc precision drag.

## Reduced motion

- Duration `200ms`.
- Giữ thứ tự aperture response, reveal và handoff.
- Không orbit travel, camera zoom lớn hoặc card rotation.
- Film card dịch chuyển ngắn, DOM hero đã reserve sẵn geometry.

## Motion rationale

- Aperture response truyền đạt feedback của nút mở.
- Pull-out truyền đạt quan hệ vật lý giữa sleeve và film card.
- Quarter-turn giải thích vì sao mặt đọc hướng về người xem.
- Camera settle duy trì tính liên tục giữa Three.js và DOM.
- Post-open reveal chỉ dùng opacity/transform để dẫn hierarchy; không chạy
  marquee, scroll hijack hoặc perpetual animation.

## Mini asset pack v1

```text
public/chungdoi/templates/nguyet-anh-sleeve/
  source/
    lotus-photogram-master-v1.png
  cover/
    lotus-photogram-v1.webp
    lotus-photogram-v1.mobile.webp
  asset-manifest.json
```

Asset này là color artwork. Smoked glass, aluminium, aperture, film
perforations, roughness và shadow được dựng procedural trong Three.js; không
giả PBR map từ ảnh màu.

## Acceptance gates

- Chỉ native button mở thiệp; canvas, aperture, card và back face không mở.
- Back face được thiết kế và khóa open button cho đến khi về mặt trước.
- Frame đầu giữ pose hiện tại; không snap về camera mặc định.
- Film card trượt thật ra khỏi sleeve, không fade/swap.
- Timeline có labels deterministic và test được progress.
- Canvas unmount sau two-frame handoff.
- CSS fallback vẫn có sleeve hai mặt và pull-out có nghĩa.
- Mobile `360`, `390`, `430px` không overflow ngang.
- Reduced motion, double-click guard, focus transfer và replay pass.
- Nội dung sau mở đủ portrait, families, ceremonies, countdown, calendar,
  album, timeline, map, dress code, guestbook, QR, RSVP, music và guest media.
- Typecheck, lint, unit test, build và E2E pass.
