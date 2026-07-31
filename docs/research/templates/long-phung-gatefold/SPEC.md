# Long Phụng Gatefold — pilot specification

## Trạng thái quyết định

- Ngày khóa baseline: 2026-07-31.
- Phạm vi: một mẫu thí điểm duy nhất.
- Slug làm việc: `long-phung-gatefold`.
- Renderer family: `gatefold`.
- Physical carrier: thiệp gatefold ba phần, hai cánh có bản lề thật.
- Hướng văn hóa: sơn mài Việt Nam đương đại, không tuyên bố phục dựng một
  triều đại cụ thể.
- Linh vật: rồng ở cánh trái, phượng ở cánh phải.
- Visual direction được chọn cho bước tiếp theo: `A — engraved restraint`,
  revision v2 có clasp hai nửa.
- Concept image là style/geometry reference, chưa phải source master và không
  được cắt trực tiếp thành asset runtime.

Tài liệu này cụ thể hóa
[`DISTINCTIVE_TEMPLATE_ROADMAP.md`](../../DISTINCTIVE_TEMPLATE_ROADMAP.md).
Nếu có xung đột, roadmap là nguồn quyết định cao hơn.

## Concept một câu

Một vật phẩm gatefold sơn mài đỏ, rồng và phượng nằm trên hai cánh đại diện hai
gia đình; khóa trung tâm nhả lực, hai cánh mở liên tục từ pose 3D người xem đang
giữ để lộ tờ lễ trung tâm, rồi mặt đọc WebGL khớp chính xác với hero DOM.

## Mục tiêu và phi mục tiêu

### Mục tiêu

- Chứng minh physical opening `CLOSED -> OPENING -> HANDOFF -> OPENED`.
- Chứng minh một renderer family có UI khác rõ các mẫu art-scroll hiện tại.
- Dùng asset thật có layer, pivot và material mask trong prototype.
- Hoàn thiện đủ capability sản phẩm trên desktop và mobile.
- Tạo nền tảng để sau pilot mới trích primitive dùng chung.

### Phi mục tiêu

- Không triển khai hàng loạt 66 mẫu.
- Không thay hoặc refactor pipeline opening của các mẫu legacy.
- Không ép renderer này qua `ArtInvitation`.
- Không thêm physics engine, ScrollTrigger, Rive, post-processing hoặc WebGPU.
- Không generate toàn bộ asset production trước khi concept chủ đạo được chọn.
- Không mô phỏng chính xác mỹ thuật cung đình hoặc quy chế triều Nguyễn.

## Originality gate

| Trục | Long Phụng Gatefold | Khác art-scroll hiện tại |
| --- | --- | --- |
| `navigationModel` | Foldout chapters trên desktop, stacked chapters trên mobile | Có |
| `heroComposition` | Vật thể gatefold ba phần với hai cánh linh vật | Có |
| `sectionGrammar` | Insert, foldout, postcard, fabric swatch, mini envelope | Có |
| `mediaPresentation` | Loose prints và album sleeve | Có |
| `signatureMotion` | Hai cánh mở quanh bản lề rồi handoff mặt đọc | Có |

Kết quả: khác `5/5` trục; không dựa chủ yếu vào palette, font hoặc artwork.

## `TemplateArtDirection`

```ts
const longPhungGatefoldArtDirection = {
  layoutFamily: "gatefold-ceremonial",
  coverGeometry:
    "vertical three-panel gatefold; full-width center board; two half-width hinged wings; designed back board and visible paper edges",
  openingMechanism:
    "center clasp releases; left and right wings unfold with a short stagger; camera settles on the inner center sheet; WebGL-to-DOM geometric handoff",
  typography: {
    display: '"UNI Chu truyen thong", "Fz Qellia", serif',
    body: '"Lora", "Times New Roman", serif',
    hierarchy:
      "display font only for couple names and ceremonial headings; body font for invitation copy, dates, addresses, controls and forms; locale-aware fallback is mandatory",
  },
  colorPalette:
    "lacquer crimson #5A0B12; deep cinnabar #7C1B1B; antique gold #B58A3A; warm ivory #EAD9B8; lacquer black #17110F",
  materialPreset:
    "deep lacquer on outer wings; warm cotton paper inside; separate antique-gold foil pass; shallow emboss; restrained clearcoat",
  lightingPreset:
    "large warm key from upper-left; low neutral fill from front-right; soft environment reflection; grounded contact shadow",
  motionPreset:
    "weighty cardstock; immediate clasp feedback; 70ms wing stagger; controlled hinge motion; no game-like bounce; quiet camera settle",
  soundPreset:
    "soft clasp release; two short paper-hinge sounds panned by wing; subtle paper settle; shared mute state with background music",
  sectionCompositions: [
    "inner-center ceremonial hero",
    "paired family wing panels",
    "portrait prints tucked below the center sheet",
    "calendar insert",
    "album sleeve with loose-photo grid",
    "timeline ribbon",
    "map foldout",
    "dress-code fabric swatches",
    "guestbook postcard",
    "gift mini-envelope with QR",
    "thank-you colophon",
  ],
} satisfies TemplateArtDirection;
```

### Typography rule

- `UNI Chu truyen thong` là baseline display font đã có trong project.
- `Lora` là baseline body font đã có trong project.
- Tên người dùng vẫn được render bằng DOM/texture; asset AI không chứa chữ.
- Nếu display font không phủ glyph của locale, dùng locale fallback thay vì
  hiển thị tofu hoặc rasterize chữ vào artwork.

## `PhysicalOpeningModel`

```ts
const longPhungGatefoldOpeningModel = {
  object: "gatefold",
  closedInteraction: {
    mode: "tilt-and-flip",
    showsBackFace: true,
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  affordance: "central clasp placed over the meeting seam of the two wings",
  hinges: [
    {
      part: "left-wing",
      transformOrigin: "inner-left edge of the center board",
    },
    {
      part: "right-wing",
      transformOrigin: "inner-right edge of the center board",
    },
  ],
  revealOrder: [
    "clasp response",
    "clasp release",
    "center seam",
    "inner wing shadows",
    "center invitation sheet",
    "couple names and wedding date",
    "DOM hero",
  ],
  cameraTransition:
    "preserve current camera/object pose at frame zero; interpolate to an opening-safe frontal pose while the clasp releases; dolly toward the center sheet only after both wings clear it",
  settleTarget:
    "inner center sheet matches the DOM hero rectangle, scale, background and camera-facing angle",
  durationMs: 1900,
  reducedMotionDurationMs: 200,
} satisfies PhysicalOpeningModel;
```

### Geometry baseline

- Center board: width `3` world units, height derived from captured content ratio.
- Left/right wing: each half the center-board width.
- Paper thickness must remain visible at grazing angles.
- Each wing is a child of its own pivot group; artwork layer groups are children
  of the corresponding wing, not absolute scene overlays.
- Clasp consists of two visual halves or a removable bridge. It cannot remain
  visibly glued across the seam after the wings separate.
- Back face uses lacquer black/red with a restrained cloud border and a DOM
  texture region for guest/date information.
- No asset is allowed to cross a hinge unless it is intentionally split into
  pieces assigned to both sides.

## `AssetBible`

```ts
const longPhungGatefoldAssetBible = {
  templateSlug: "long-phung-gatefold",
  culturalDirection:
    "contemporary Vietnamese lacquer-inspired ceremonial art; long-phung treated as an auspicious paired composition, not a dynastic costume reconstruction",
  historicalReference:
    "Vietnamese museum references for lacquer, crimson-and-gilded surfaces, and documented dragon-phoenix artifacts; no direct copying of a single artifact",
  primaryMotifs: [
    "serpentine dragon on the left wing",
    "phoenix with a readable crest and layered tail on the right wing",
    "restrained auspicious clouds",
    "small circular clasp without generated lettering",
  ],
  illustrationStyle:
    "engraved antique-gold linework and shallow relief over deep red lacquer; controlled negative space; no painterly background scene",
  lineWeight:
    "two-level system: strong outer contour that survives at 390px; finer inner engraving no thinner than one runtime pixel",
  palette: ["#5A0B12", "#7C1B1B", "#B58A3A", "#EAD9B8", "#17110F"],
  materialLanguage: [
    "deep lacquer",
    "antique-gold foil",
    "shallow emboss",
    "warm cotton paper",
  ],
  lightingDirection:
    "material reference light comes from upper-left; color assets contain no baked specular highlight",
  detailLevel: "medium",
  symmetryRule:
    "balanced pair, not mirrored clones; visual mass and gaze meet at the center clasp while anatomy and feather/scale rhythm remain species-specific",
  animationLayers: [
    "dragon-body-left",
    "dragon-whiskers-left",
    "dragon-cloud-front-left",
    "phoenix-body-right",
    "phoenix-wing-front-right",
    "phoenix-tail-front-right",
    "cloud-back",
    "cloud-front",
  ],
  requiredMasks: [
    "dragon-foil-mask",
    "dragon-emboss-mask",
    "phoenix-foil-mask",
    "phoenix-emboss-mask",
    "foil-roughness",
    "paper-normal",
  ],
  mobileReadabilityRule:
    "at a projected closed-cover width of 320px, both animal silhouettes, heads and center-facing gesture must remain identifiable; remove sub-pixel engraving rather than increasing contrast noise",
  avoid: [
    "AI-generated text, signature or watermark",
    "generic East Asian fantasy dragon",
    "Japanese or Chinese costume/crest elements added without a source",
    "mixing motifs from multiple Vietnamese dynasties and calling the result historical",
    "extra legs, claws, wings, horns or fused anatomy",
    "mechanically mirrored animals or mirrored lighting",
    "baked foil highlight or baked contact shadow in color art",
    "dense decoration through the center text safe zone",
    "flat composite containing both animals and the whole cover",
    "alpha halo, colored matte or clipped feathers and whiskers",
  ],
} satisfies AssetBible;
```

### Cultural reference boundary

The visual direction uses museum material as a guardrail, not as a license to
claim historical reconstruction:

- Vietnam National Museum of History documents dragon and phoenix on Nguyễn
  dynasty treasures and associates the pair with power, prosperity and
  happiness:
  <https://vnmh.com.vn/en/Articles/3173/55924/special-exhibition-the-dragon-phoenix-on-treasures-of-the-nguyen-dynasty.html>
- Its crimsoned-and-gilded wood collection provides a material reference for
  deep red and gold relief surfaces:
  <https://vnmh.com.vn/en/Articles/3188/18228/collection-of-crimsoned-and-gilded-wood-worshipping-objects-under-nguyen-dynasty-preserved-in-vietnam-national-museum-of-history-vnmh.html>
- Vietnam National Fine Arts Museum explicitly maintains lacquer-painting and
  traditional-art collections:
  <https://vnfam.vn/en/about>

Production artwork must not trace, recreate or label itself as one of those
artifacts. A more historically specific direction requires a separate review.

## Desktop storyboard — `1440 × 900`

Target full-motion duration: `1900ms`.

| Progress | State/label | Visual and physical action |
| ---: | --- | --- |
| `0%` | `CLOSED` | Preserve exact user-controlled object pose, camera and controls target. Both wings meet at the clasp. |
| `0–8%` | `anticipation` | Clasp depresses `1–2mm`; object gives a small local response without resetting pose. Controls lock after input ownership transfers to the timeline. |
| `8–18%` | `release` | Clasp bridge lifts or separates. Camera/object begin a smooth interpolation toward an opening-safe pose. |
| `18–48%` | `unfold-a` | Left wing opens first. Inner contact shadow deepens near the hinge. Dragon artwork remains attached to the wing; whiskers lag slightly. |
| `22–55%` | `unfold-b` | Right wing follows about `70ms` later. Phoenix front wing and tail respond with restrained secondary motion. |
| `42–68%` | `reveal` | Center sheet becomes readable. Back-cloud layer stays behind names; front-cloud layer clears the safe zone. |
| `68–90%` | `settle` | Wings reach their designed open angle; camera dollies toward the center sheet. Dynamic shadow resolves into the open composition. |
| `90–98%` | `handoff-align` | WebGL center sheet matches the reserved DOM hero rectangle in position, scale, color and angle. |
| `98–100%` | `HANDOFF` | DOM receives focus and scroll. Canvas unmounts within `1–2` frames after visual alignment. No white frame or crossfade. |
| after | `OPENED` | Desktop foldout chapters and shared functional components become interactive. |

## Mobile storyboard — `390 × 844`

Target full-motion duration: `1650ms`.

| Progress | State/label | Visual and physical action |
| ---: | --- | --- |
| `0%` | `CLOSED` | Preserve current pose. Cover occupies a safe central area and never requires hover. |
| `0–12%` | `anticipation` | Clasp responds; pose begins a smooth correction only if the current angle would make opening leave the viewport. |
| `12–25%` | `release` | Clasp releases. Camera widens slightly before the wings move. |
| `25–60%` | `unfold` | Wings open to a smaller angle than desktop and remain fully inside the viewport. Secondary animal motion is reduced. |
| `48–72%` | `reveal` | Center sheet appears and becomes the dominant visual. No precision drag is required. |
| `72–94%` | `settle` | Camera pushes toward the center sheet; wings move mostly out of the reading path without abrupt clipping. |
| `94–100%` | `HANDOFF` | Center sheet matches the vertical DOM hero. Focus moves to the first meaningful DOM heading/control. |
| after | `OPENED` | Family wings become stacked chapters; all inserts become vertical cards/foldouts with no horizontal overflow. |

## Reduced-motion storyboard

- Duration: `200ms`.
- Keep activation, reveal and handoff order.
- Clasp changes state immediately.
- Wings use only a very small angular change; no orbit travel, large camera zoom,
  parallax or elastic overshoot.
- The inner sheet becomes visible through a short opacity reveal and hands off to
  the already-reserved DOM rectangle.
- Never set every duration to zero.

## Section and capability mapping

| Product capability | Gatefold composition |
| --- | --- |
| Couple hero/date | Inner center ceremonial sheet |
| Opening portraits | Two loose prints below the hero, stacked on mobile |
| Invitation/families | Left and right family panels; stacked chapters on mobile |
| Ceremonies/banquet | Center insert plus additional foldout rows |
| Countdown/calendar | Clasp echo plus removable calendar insert |
| Album/lightbox | Loose-print album sleeve using shared lightbox |
| Timeline | Vertical ribbon after handoff |
| Map/directions | Paper foldout using shared map/directions behavior |
| Dress code | Fabric swatch card |
| Guestbook/wish form | Postcard surface using shared form submission |
| Gift/QR | Mini envelope with shared QR/VietQR logic |
| RSVP | Experience-shell action with template visual treatment |
| Music | Shared player and mute state |
| Guest media | Portal before the thank-you colophon |
| Footer | Lacquer maker-style colophon |

## Mini asset pack v0

The first pack exists to validate silhouette, hinge occlusion and material
response. It is not the full section-decoration library.

```text
public/chungdoi/templates/long-phung-gatefold/
  source/
    dragon-left-master.png
    phoenix-right-master.png
  concepts/
    cover-variant-a.webp
    cover-variant-b.webp
    cover-variant-c.webp
  cover/
    dragon-body-left.webp
    dragon-whiskers-left.webp
    dragon-foil-mask.png
    dragon-emboss-mask.png
    dragon-shadow.webp
    phoenix-body-right.webp
    phoenix-wing-front-right.webp
    phoenix-tail-front-right.webp
    phoenix-foil-mask.png
    phoenix-emboss-mask.png
    phoenix-shadow.webp
  opening/
    cloud-back.webp
    cloud-front.webp
  materials/
    paper-color.webp
    paper-normal.webp
    foil-roughness.webp
  asset-manifest.json
  prompts.md
```

Concept preview images may initially live beside this spec. Only the selected
variant is promoted into the runtime tree.

Selected concept reference:

```text
docs/research/templates/long-phung-gatefold/concepts/
  selected-a-engraved-restraint-v2.png
```

## Concept variant brief

All variants share the same geometry, layout, palette and material intent. They
change only the illustration language:

1. `A — engraved restraint`: sparse engraved linework, strongest negative space,
   easiest mobile read.
2. `B — lacquer relief`: deeper relief and bolder silhouette, more ceremonial
   weight, moderate detail.
3. `C — geometric deco`: Vietnamese long-phụng simplified into controlled
   geometric rhythm, highest contrast but greatest risk of drifting into generic
   Art Deco.

Decision:

- Chọn `A` vì có negative space tốt nhất, linework đủ nhẹ cho lacquer/foil mask,
  và dễ giảm chi tiết cho mobile.
- Revision v2 bổ sung clasp hai nửa để khớp `PhysicalOpeningModel`.
- `B` được giữ làm reference về độ nổi vật liệu nhưng bị reject vì mật độ relief
  quá cao và dễ thành palace/fantasy ornament.
- `C` được giữ làm reference về mobile silhouette nhưng bị reject vì abstraction
  làm yếu đặc trưng long-phụng và dễ trượt sang geometric-deco chung.

Reject a variant if:

- the cover only looks like a flat poster;
- the center seam or hinge is visually impossible;
- the animals cannot be split into the declared animation layers;
- the center text safe zone is not clear;
- the back face is ignored;
- the concept loses readability at a `320px` projected width.

## Prototype acceptance gates

- Frame zero matches `CLOSED` exactly after any legal drag/flip pose.
- Controls cannot change object transforms after timeline ownership begins.
- Both wing pivots and the clasp are inspectable via refs.
- Timeline supports `play`, `pause`, `reverse` and deterministic `seek`.
- The center sheet and DOM hero differ by less than `1px` at handoff in the
  reference viewport after fonts/assets are ready.
- Canvas persists through `CLOSED`, `OPENING` and `HANDOFF`, then unmounts.
- Opening still completes when an optional secondary asset or SFX fails.
- Keyboard open, repeated-click guard, focus transfer and reduced motion pass.
- Mobile has no horizontal document overflow at `360`, `390` and `430px`.
- WebGL fallback still presents a two-sided carrier and a short meaningful open.
- All existing product capabilities remain wired to shared behavior.

## Implementation order after visual selection

1. Promote one concept variant and freeze its prompt as the asset style anchor.
2. Produce the mini asset pack and `asset-manifest.json`.
3. Prototype procedural gatefold geometry and pivots with the real assets.
4. Add the explicit experience state machine and GSAP master timeline.
5. Implement deterministic handoff lab before full content.
6. Build the complete DOM renderer using shared business primitives.
7. Add desktop/mobile post-open composition.
8. Run accessibility, reduced-motion, WebGL fallback, visual and performance
   gates.
